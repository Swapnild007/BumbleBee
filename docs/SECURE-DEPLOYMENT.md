# Secure JARVIS deployment

The authenticated AI gateway requires a serverless host that runs the repository's `api/auth.js` and `api/ai.js` functions. A static-only host such as GitHub Pages can serve the UI but cannot run these API routes.

## Deploy on Vercel

1. Import `Swapnild007/BumbleBee` into Vercel and deploy the repository root. Select **Other** if Vercel asks for a framework preset; no frontend build step is required for the current single-page app.
2. In **Project Settings → Environment Variables**, add:
   - `JARVIS_ACCESS_PASSWORD`: a unique, strong password of at least 12 characters.
   - `JARVIS_SESSION_SECRET`: a random secret of at least 32 characters. Generate one locally with `openssl rand -base64 48`.
   - One or more provider keys, for example `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Only configured providers can answer requests.
   - `JARVIS_PUBLIC_ORIGIN` is optional and is used for OpenRouter request metadata.
3. Add secrets directly in the host dashboard. Do not put real values in GitHub, `.env.example`, HTML, screenshots, or chat logs.
4. Redeploy after changing environment variables.
5. Open JARVIS → **System → Secure AI Gateway**, enter `JARVIS_ACCESS_PASSWORD`, and select **Connect**. The app should show **Connected · server-side**.
6. Choose the provider whose server-side key you configured. AI requests then go to the same-origin `/api/ai` endpoint; the provider key is read from the server environment and is not sent by the browser.

## Security behavior

- Login creates a signed, expiring session in an `HttpOnly`, `SameSite=Strict` cookie; HTTPS deployments also set `Secure`.
- The gateway enforces same-origin requests, bounded JSON payloads, supported provider/model validation, and per-session/IP rate limiting.
- If a secure session expires, JARVIS asks you to reconnect instead of silently switching back to a browser-stored provider key.
- Personal-mode BYOK remains available for private testing. It stores the key in browser storage and sends it directly to the provider, so it is **not appropriate for a public deployment**.
- CI verifies the gateway's authentication and server-side key handling with mocked provider responses. You must still verify the deployed environment variables and real provider connection after deployment.
