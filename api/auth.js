import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSession,
  isSameOrigin,
  parseCookies,
  readJsonBody,
  rateLimit,
  safeEqual,
  verifySession
} from "./_security.js";

const loginAttempts = new Map();
const secret = () => process.env.JARVIS_SESSION_SECRET || "";
const password = () => process.env.JARVIS_ACCESS_PASSWORD || "";
const clientKey = req => String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();

function json(res, status, value) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(status).json(value);
}

function sessionCookie(token, req, clear = false) {
  const secure = process.env.NODE_ENV === "production" || String(req.headers["x-forwarded-proto"] || "").split(",")[0] === "https";
  return SESSION_COOKIE + "=" + (clear ? "" : encodeURIComponent(token)) +
    "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + (clear ? 0 : SESSION_TTL_SECONDS) +
    (secure ? "; Secure" : "");
}

export default function handler(req, res) {
  if (!isSameOrigin(req)) return json(res, 403, { error: "Cross-origin requests are not allowed." });
  if (req.method === "GET") {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    const authenticated = verifySession(token, secret());
    return json(res, 200, { authenticated });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Method not allowed." });
  }

  const parsed = readJsonBody(req, 2048);
  if (!parsed.ok) return json(res, parsed.status, { error: parsed.error });
  if (parsed.body.logout === true) {
    res.setHeader("Set-Cookie", sessionCookie("", req, true));
    return json(res, 200, { authenticated: false });
  }

  const configuredPassword = password();
  const configuredSecret = secret();
  if (configuredPassword.length < 12 || configuredSecret.length < 32) {
    return json(res, 503, { error: "Secure gateway is not configured. Set JARVIS_ACCESS_PASSWORD and JARVIS_SESSION_SECRET." });
  }

  const ip = clientKey(req);
  const limit = rateLimit(loginAttempts, ip, { limit: 5, windowMs: 15 * 60_000 });
  if (!limit.allowed) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return json(res, 429, { error: "Too many login attempts. Try again later." });
  }

  const supplied = typeof parsed.body.password === "string" ? parsed.body.password : "";
  if (!safeEqual(supplied, configuredPassword)) return json(res, 401, { error: "Incorrect gateway password." });

  loginAttempts.delete(ip);
  const token = createSession(configuredSecret);
  res.setHeader("Set-Cookie", sessionCookie(token, req));
  return json(res, 200, { authenticated: true, expiresIn: SESSION_TTL_SECONDS });
}
