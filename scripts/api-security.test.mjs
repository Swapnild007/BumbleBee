import test from "node:test";
import assert from "node:assert/strict";
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
  const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
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
