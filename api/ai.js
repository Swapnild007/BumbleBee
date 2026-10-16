import crypto from "node:crypto";
import { isSameOrigin, parseCookies, readJsonBody, rateLimit, validateAiPayload, verifySession, SESSION_COOKIE } from "./_security.js";

const requests = new Map();
const PROVIDERS = {
  anthropic: { key: "ANTHROPIC_API_KEY", kind: "anthropic" },
  openai: { key: "OPENAI_API_KEY", kind: "openai", url: "https://api.openai.com/v1/chat/completions" },
  gemini: { key: "GEMINI_API_KEY", kind: "gemini" },
  groq: { key: "GROQ_API_KEY", kind: "openai", url: "https://api.groq.com/openai/v1/chat/completions" },
  openrouter: { key: "OPENROUTER_API_KEY", kind: "openai", url: "https://openrouter.ai/api/v1/chat/completions" }
};

function json(res, status, value) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(status).json(value);
}

function clientKey(req, token) {
  return crypto.createHash("sha256").update(token + "|" + String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")).digest("hex");
}

async function providerRequest(config, payload, key) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    let response;
    if (config.kind === "anthropic") {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: payload.model, max_tokens: 500, system: payload.system, messages: payload.messages })
      });
    } else if (config.kind === "gemini") {
      const contents = payload.messages.map(message => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] }));
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(payload.model) + ":generateContent", {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: payload.system }] }, contents })
      });
    } else {
      const headers = { "content-type": "application/json", authorization: "Bearer " + key };
      if (payload.provider === "openrouter") {
        headers["HTTP-Referer"] = process.env.JARVIS_PUBLIC_ORIGIN || "https://jarvis.local";
        headers["X-Title"] = "JARVIS Personal Assistant";
      }
      response = await fetch(config.url, {
        method: "POST",
        signal: controller.signal,
        headers,
        body: JSON.stringify({ model: payload.model, max_tokens: 500, messages: [{ role: "system", content: payload.system }, ...payload.messages] })
      });
    }

    if (!response.ok) {
      // Never relay provider bodies, which may contain internal details, to the client.
      return { ok: false, status: response.status === 429 ? 429 : 502, error: response.status === 429 ? "AI provider rate limit reached." : "AI provider request failed." };
    }
    const result = await response.json();
    let text = "";
    if (config.kind === "anthropic") text = Array.isArray(result.content) ? result.content.map(part => part.text || "").join("") : "";
    else if (config.kind === "gemini") text = (result.candidates?.[0]?.content?.parts || []).map(part => part.text || "").join("");
    else text = typeof result.choices?.[0]?.message?.content === "string" ? result.choices[0].message.content : "";
    if (!text) return { ok: false, status: 502, error: "AI provider returned no usable text." };
    return { ok: true, text };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (!isSameOrigin(req)) return json(res, 403, { error: "Cross-origin requests are not allowed." });
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed." });
  }

  const secret = process.env.JARVIS_SESSION_SECRET || "";
  if (secret.length < 32) return json(res, 503, { error: "Secure AI gateway is not configured." });
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!verifySession(token, secret)) return json(res, 401, { error: "Secure AI session expired. Reconnect in Settings." });

  const body = readJsonBody(req, 32_768);
  if (!body.ok) return json(res, body.status, { error: body.error });
  const validation = validateAiPayload(body.body);
  if (!validation.ok) return json(res, 400, { error: validation.error });

  const key = clientKey(req, token);
  const limit = rateLimit(requests, key, { limit: 30, windowMs: 10 * 60_000 });
  if (!limit.allowed) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return json(res, 429, { error: "JARVIS AI request limit reached. Try again later." });
  }

  const payload = validation.value;
  const config = PROVIDERS[payload.provider];
  const providerKey = process.env[config.key] || "";
  if (!providerKey) return json(res, 503, { error: "No server-side key is configured for the selected AI provider." });

  try {
    const result = await providerRequest(config, payload, providerKey);
    if (!result.ok) return json(res, result.status, { error: result.error });
    return json(res, 200, { text: result.text });
  } catch (error) {
    const aborted = error?.name === "AbortError";
    return json(res, aborted ? 504 : 502, { error: aborted ? "AI provider timed out." : "AI provider is temporarily unavailable." });
  }
}
