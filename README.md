# JARVIS · Personal Intelligence

A mobile-first JARVIS personal-assistant prototype. The product is named JARVIS; `BumbleBee` is only the repository name.

## Current prototype

- `index.html`: mobile UI, local command routing, voice input where supported, speech output, tasks, reminders, notes, contacts, weather, and provider settings.
- Current-news briefing: topic feeds for World, India, Business, Technology, Science, and Sports. It retrieves headlines through RSS2JSON, displays the feed source and publication time where provided, caches results locally, and reports refresh failures. News summaries use the fetched headlines as context when an AI provider is configured.
- `orb-engine.js`: optional WebGL orb scene.
- `manifest.webmanifest` and `sw.js`: installable web-app shell and cache versioning.
- `training/intents.json`: versioned intent-evaluation corpus covering 46 intent regression cases plus 8 action-schema fixtures covering slot extraction, clarification, confidence, and safety expectations. It is test data, not model fine-tuning data.
- `scripts/train-intents.mjs`: deterministic offline evaluation of the current rule-based classifier and command-confirmation planner.
- `brain/trace-store.js`: local-only, bounded command/response trace ledger with explicit helpfulness feedback, latency/failure/clarification metrics, JSON export, and user-controlled deletion. It does not upload conversations or train model weights.
- `docs/OPENJARVIS-BRAIN-INTEGRATION.md`: integration decisions, architecture mapping, and release gates inspired by OpenJarvis.
- `docs/SECURE-DEPLOYMENT.md` and `.env.example`: safe server-side AI gateway setup; placeholders only, never real secrets.
- `scripts/brain-traces.test.mjs`: unit tests for trace retention, feedback/export/deletion, and blocked-storage recovery.
- `scripts/smoke.mjs`: dependency-free source, JavaScript syntax, and safety-contract checks, run by GitHub Actions.
- `scripts/e2e.mjs`: Playwright mobile-browser acceptance checks for key interactions and safety flows.

## News and voice limitations

The current news feature is best-effort, not a guaranteed breaking-news service. RSS feeds and the conversion service can be unavailable, and headline metadata can be incomplete. JARVIS must not claim a fresh update if it could not verify a current feed. Headlines are not a substitute for opening the linked reporting. The browser's available speech voices vary by Android device and browser; native voice tuning and real-device latency still need testing.

## Brain and evaluation status

The current offline brain is a deterministic rule-based command classifier with slot extraction, low-confidence fallback, and targeted clarification for incomplete supported commands. Consequential calls, messages, and app launches are gated by explicit confirmation after required details are present. Model-proposed `ACTION` payloads are schema-validated and held for confirmation before any task, note, reminder, app, flashlight, call, or message action executes. The Training Lab measures regression performance against the versioned corpus; it does not train a general-purpose language model. Open-ended reasoning depends on an explicitly configured provider and is not available as a fully offline general-knowledge model.

## Security

An authenticated same-origin server-side AI gateway is available at `api/auth.js` and `api/ai.js`. In System → Secure AI Gateway, connect with the deployment's `JARVIS_ACCESS_PASSWORD`; the server also requires `JARVIS_SESSION_SECRET` and the selected provider's environment key (for example `ANTHROPIC_API_KEY`). While connected, JARVIS sends the conversation to `/api/ai` and the provider key remains on the server. Direct BYOK mode still stores and sends a user key from the browser, so it is for personal/prototype use only and is not safe for a public deployment. For public production, set `JARVIS_DISABLE_BROWSER_KEYS=true` so the UI disables browser-key mode and requires the secure gateway. See `docs/SECURE-DEPLOYMENT.md`.

## Native Android status

This repository is currently a web prototype, not an installable native Android APK. The native Android bridge is an integration seam only; native Kotlin/Compose implementation, permissions, Android app launching, and APK build/release remain separate milestones.

## Development checks

Run `npm test` for source, classifier, planner, and safety checks. Run `npm run test:e2e` for mobile-browser acceptance tests (requires the pinned Playwright dependency and Chromium). GitHub Actions runs both checks on pull requests.

## Production gates still open

- Move provider credentials and privileged actions behind a protected backend.
- Implement and test durable reminders/automation that survive page closure and device sleep.
- Replace native Android integration stubs with permission-aware, user-approved implementations and verify them on real devices.
- Validate browser/native speech latency, lifecycle behavior, and permissions on target Android hardware.
- Add end-to-end evaluation for real model responses, tool execution outcomes, and recovery from provider/network failures before calling the assistant production-ready.
