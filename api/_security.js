import crypto from "node:crypto";

export const SESSION_COOKIE = "jarvis_session";
export const SESSION_TTL_SECONDS = 12 * 60 * 60;
const MAX_AI_MESSAGES = 24;
const MAX_AI_CHARS = 24000;
const PROVIDERS = new Set(["anthropic", "openai", "gemini", "groq", "openrouter"]);

export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function createSession(secret, now = Date.now()) {
  if (typeof secret !== "string" || secret.length < 32) throw new Error("JARVIS_SESSION_SECRET must contain at least 32 characters.");
  const payload = Buffer.from(JSON.stringify({
    issuedAt: now,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
    nonce: crypto.randomBytes(16).toString("hex")
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return payload + "." + signature;
}

export function verifySession(token, secret, now = Date.now()) {
  if (typeof token !== "string" || typeof secret !== "string" || secret.length < 32) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const expected = crypto.createHmac("sha256", secret).update(parts[0]).digest("base64url");
  if (!safeEqual(parts[1], expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return Number.isFinite(payload.expiresAt) && payload.expiresAt > now &&
      Number.isFinite(payload.issuedAt) && payload.issuedAt <= now + 60_000;
  } catch {
    return false;
  }
}

export function parseCookies(header = "") {
  const cookies = {};
  for (const part of String(header).split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key && value) cookies[key] = value;
  }
  return cookies;
}

export function isSameOrigin(req) {
  const origin = req?.headers?.origin;
  if (!origin) return true;
  const host = req?.headers?.host;
  if (!host) return false;
  try {
    return new URL(origin).host.toLowerCase() === String(host).toLowerCase();
  } catch {
    return false;
  }
}

export function readJsonBody(req, maxBytes = 32_768) {
  const length = Number(req?.headers?.["content-length"] || 0);
  if (Number.isFinite(length) && length > maxBytes) return { ok: false, status: 413, error: "Request body too large." };
  try {
    const body = typeof req?.body === "string" ? JSON.parse(req.body) : req?.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, status: 400, error: "Expected a JSON object." };
    if (Buffer.byteLength(JSON.stringify(body), "utf8") > maxBytes) return { ok: false, status: 413, error: "Request body too large." };
    return { ok: true, body };
  } catch {
    return { ok: false, status: 400, error: "Malformed JSON body." };
  }
}

export function validateAiPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "Expected an AI request object." };
  if (!PROVIDERS.has(body.provider)) return { ok: false, error: "Unsupported AI provider." };
  const model = typeof body.model === "string" ? body.model.trim() : "";
  if (!model || model.length > 160 || !/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(model) || model.split(/[/:]/).some(part => part === "." || part === "..")) return { ok: false, error: "Invalid model identifier." };
  const system = typeof body.system === "string" ? body.system : "";
  if (system.length > 8000) return { ok: false, error: "System context is too large." };
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > MAX_AI_MESSAGES) {
    return { ok: false, error: "Message count is outside the allowed range." };
  }
  let total = system.length;
  const messages = [];
  for (const message of body.messages) {
    if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") {
      return { ok: false, error: "Messages must contain only user/assistant roles and text content." };
    }
    if (message.content.length > 6000) return { ok: false, error: "A message is too large." };
    total += message.content.length;
    messages.push({ role: message.role, content: message.content });
  }
  if (!messages.some(message => message.role === "user")) return { ok: false, error: "At least one user message is required." };
  if (total > MAX_AI_CHARS) return { ok: false, error: "AI request exceeds the allowed context size." };
  return { ok: true, value: { provider: body.provider, model, system, messages } };
}

export function rateLimit(map, key, { now = Date.now(), limit = 20, windowMs = 10 * 60_000, maxKeys = 1000 } = {}) {
  // Serverless instances can be long-lived. Bound the in-memory key space so
  // rotating client identifiers cannot grow this map without limit.
  if (!map.has(key) && map.size >= maxKeys) {
    for (const [candidate, timestamps] of map) {
      const recentTimestamps = timestamps.filter(timestamp => now - timestamp < windowMs);
      if (recentTimestamps.length) map.set(candidate, recentTimestamps);
      else map.delete(candidate);
    }
    if (map.size >= maxKeys) {
      const oldestKey = map.keys().next().value;
      if (oldestKey !== undefined) map.delete(oldestKey);
    }
  }
  const prior = map.get(key) || [];
  const recent = prior.filter(timestamp => now - timestamp < windowMs);
  if (recent.length >= limit) {
    map.set(key, recent);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000)) };
  }
  recent.push(now);
  map.set(key, recent);
  return { allowed: true, remaining: limit - recent.length };
}
