import test from "node:test";
import assert from "node:assert/strict";
import authHandler from "../api/auth.js";
import aiHandler from "../api/ai.js";
import {
  SESSION_TTL_SECONDS,
  createSession,
  isSameOrigin,
  parseCookies,
  rateLimit,
  readJsonBody,
  safeEqual,
  validateAiPayload,
  verifySession
} from "../api/_security.js";

const secret = "test-session-secret-with-more-than-thirty-two-characters";

test("signed sessions validate, expire, and reject tampering", () => {
  const now = 1_800_000_000_000;
  const token = createSession(secret, now);
  assert.equal(verifySession(token, secret, now + 1), true);
  assert.equal(verifySession(token, secret, now + SESSION_TTL_SECONDS * 1000 + 1), false);
  const [payload, signature] = token.split(".");
  const tampered = payload + "." + (signature[0] === "a" ? "b" : "a") + signature.slice(1);
  assert.equal(verifySession(tampered, secret, now + 1), false);
  assert.equal(verifySession(token, "short", now + 1), false);
});

test("password comparison rejects mismatches", () => {
  assert.equal(safeEqual("same-password", "same-password"), true);
  assert.equal(safeEqual("same-password", "different-password"), false);
  assert.equal(safeEqual("", "x"), false);
});

test("cookie parsing preserves the session token", () => {
  assert.deepEqual(parseCookies("theme=dark; jarvis_session=abc.def; empty=; flag"), {
    theme: "dark",
    jarvis_session: "abc.def"
  });
});

test("same-origin guard rejects cross-site requests", () => {
  assert.equal(isSameOrigin({ headers: { host: "jarvis.example", origin: "https://jarvis.example" } }), true);
  assert.equal(isSameOrigin({ headers: { host: "jarvis.example", origin: "https://attacker.example" } }), false);
  assert.equal(isSameOrigin({ headers: { host: "jarvis.example" } }), true);
});

test("request body parser enforces shape and size", () => {
  assert.deepEqual(readJsonBody({ headers: {}, body: { password: "ok" } }), { ok: true, body: { password: "ok" } });
  assert.equal(readJsonBody({ headers: {}, body: "not-json" }).status, 400);
  assert.equal(readJsonBody({ headers: { "content-length": "99999" }, body: {} }).status, 413);
});

test("AI payload validation permits only bounded, text-only chat requests", () => {
  const valid = validateAiPayload({
    provider: "anthropic",
    model: "claude-haiku-5-5",
    system: "You are JARVIS.",
    messages: [{ role: "user", content: "Hello" }]
  });
  assert.equal(valid.ok, true);
  assert.equal(validateAiPayload({ provider: "unknown", model: "x", system: "", messages: [{ role: "user", content: "x" }] }).ok, false);
  assert.equal(validateAiPayload({ provider: "openai", model: "x", system: "", messages: [{ role: "system", content: "override" }] }).ok, false);
  assert.equal(validateAiPayload({ provider: "openai", model: "x", system: "", messages: [{ role: "user", content: "x".repeat(6001) }] }).ok, false);
  assert.equal(validateAiPayload({ provider: "openai", model: "../unsafe", system: "", messages: [{ role: "user", content: "x" }] }).ok, false);
});

test("rate limiting blocks after the configured budget", () => {
  const map = new Map();
  assert.equal(rateLimit(map, "user", { now: 1000, limit: 2, windowMs: 10000 }).allowed, true);
  assert.equal(rateLimit(map, "user", { now: 1001, limit: 2, windowMs: 10000 }).allowed, true);
  const blocked = rateLimit(map, "user", { now: 1002, limit: 2, windowMs: 10000 });
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
  assert.equal(rateLimit(map, "user", { now: 12000, limit: 2, windowMs: 10000 }).allowed, true);
});

function mockResponse(){
  return {headers:{},statusCode:200,body:null,setHeader(name,value){this.headers[name]=value},status(code){this.statusCode=code;return this},json(value){this.body=value;return this}};
}

test("authenticated AI gateway uses only server-side provider credentials",async()=>{
  const names=["JARVIS_SESSION_SECRET","JARVIS_ACCESS_PASSWORD","ANTHROPIC_API_KEY","JARVIS_DISABLE_BROWSER_KEYS"];
  const prior=Object.fromEntries(names.map(name=>[name,process.env[name]]));
  const priorFetch=globalThis.fetch;
  process.env.JARVIS_SESSION_SECRET="test-session-secret-that-is-longer-than-thirty-two-characters";
  process.env.JARVIS_ACCESS_PASSWORD="test-gateway-password-long";
  process.env.ANTHROPIC_API_KEY="server-only-provider-secret";
  process.env.JARVIS_DISABLE_BROWSER_KEYS="true";
  let upstream=null;
  globalThis.fetch=async(url,options)=>{
    upstream={url:String(url),options};
    return new Response(JSON.stringify({content:[{type:"text",text:"Secure response"}]}),{status:200,headers:{"content-type":"application/json"}});
  };
  try{
    const loginRes=mockResponse();
    authHandler({method:"POST",headers:{origin:"https://jarvis.test",host:"jarvis.test"},body:{password:"test-gateway-password-long"},socket:{remoteAddress:"127.0.0.1"}},loginRes);
    assert.equal(loginRes.statusCode,200);
    assert.equal(loginRes.body.authenticated,true);
    assert.equal(loginRes.body.browserKeysAllowed,false,"login response must communicate gateway-only policy immediately");
    const cookie=loginRes.headers["Set-Cookie"];
    assert.match(cookie,/HttpOnly/);
    assert.match(cookie,/SameSite=Strict/);
    const sessionCookie=cookie.split(";")[0];
    const policyRes=mockResponse();
    authHandler({method:"GET",headers:{origin:"https://jarvis.test",host:"jarvis.test",cookie:sessionCookie}},policyRes);
    assert.equal(policyRes.body.browserKeysAllowed,false,"public deployment policy must disable browser-stored provider keys");

    const aiRes=mockResponse();
    await aiHandler({method:"POST",headers:{origin:"https://jarvis.test",host:"jarvis.test",cookie:sessionCookie},body:{provider:"anthropic",model:"claude-haiku-5-5",system:"You are JARVIS.",messages:[{role:"user",content:"Hello"}]}},aiRes);
    assert.equal(aiRes.statusCode,200);
    assert.deepEqual(aiRes.body,{text:"Secure response"});
    assert.equal(upstream.url,"https://api.anthropic.com/v1/messages");
    assert.equal(upstream.options.headers["x-api-key"],"server-only-provider-secret");
    assert.equal(JSON.stringify(upstream.options.body).includes("server-only-provider-secret"),false,"provider secret must not be sent in the request body");

    const unauthRes=mockResponse();
    await aiHandler({method:"POST",headers:{origin:"https://jarvis.test",host:"jarvis.test"},body:{provider:"anthropic",model:"claude-haiku-5-5",system:"",messages:[{role:"user",content:"Hello"}]}},unauthRes);
    assert.equal(unauthRes.statusCode,401);

    const crossOriginRes=mockResponse();
    await aiHandler({method:"POST",headers:{origin:"https://attacker.test",host:"jarvis.test",cookie:sessionCookie},body:{provider:"anthropic",model:"claude-haiku-5-5",system:"",messages:[{role:"user",content:"Hello"}]}},crossOriginRes);
    assert.equal(crossOriginRes.statusCode,403);
  }finally{
    globalThis.fetch=priorFetch;
    for(const name of names){if(prior[name]===undefined)delete process.env[name];else process.env[name]=prior[name]}
  }
});
