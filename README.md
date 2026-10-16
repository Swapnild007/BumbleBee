# JARVIS · Personal Intelligence

A mobile-first JARVIS personal-assistant prototype. The product is named JARVIS; `BumbleBee` is only the repository name.

## Current prototype

- `index.html`: mobile UI, local command routing, voice input where supported, speech output, tasks, reminders, notes, contacts, weather, and provider settings.
- Current-news briefing: topic feeds for World, India, Business, Technology, Science, and Sports. It retrieves headlines through RSS2JSON, displays the feed source and publication time where provided, caches results locally, and reports refresh failures. News summaries use the fetched headlines as context when an AI provider is configured.
- `orb-engine.js`: optional WebGL orb scene.
- `manifest.webmanifest` and `sw.js`: installable web-app shell and cache versioning.
- `training/intents.json`: versioned intent-evaluation corpus covering 48 intent regression cases plus action-schema fixtures covering slot extraction, clarification, confidence, and safety expectations. It is test data, not model fine-tuning data.
- `scripts/train-intents.mjs`: deterministic offline evaluation of the current rule-based classifier and command-confirmation planner.
- `scripts/smoke.mjs`: dependency-free source, JavaScript syntax, and safety-contract checks, run by GitHub Actions.
- `scripts/e2e.mjs`: Playwright mobile-browser acceptance checks for key interactions and safety flows.

## News and voice limitations

The current news feature is best-effort, not a guaranteed breaking-news service. RSS feeds and the conversion service can be unavailable, and headline metadata can be incomplete. JARVIS must not claim a fresh update if it could not verify a current feed. Headlines are not a substitute for opening the linked reporting. The browser's available speech voices vary by Android device and browser; native voice tuning and real-device latency still need testing.

## Brain and evaluation status\n\nThe current offline brain is a deterministic rule-based command classifier with slot extraction, low-confidence fallback, and targeted clarification for incomplete supported commands. Consequential calls, messages, and app launches are gated by explicit confirmation after required details are present. Model-proposed `ACTION` payloads are schema-validated and held for confirmation before any task, note, reminder, app, flashlight, call, or message action executes. The Training Lab measures regression performance against the versioned corpus; it does not train a general-purpose language model. Open-ended reasoning depends on an explicitly configured provider and is not available as a fully offline general-knowledge model.\n\n## Security

Provider API keys are currently configured in the client prototype. This is not production-secure: browser storage and client-side requests cannot protect secrets from a device user or injected script. Do not use this pattern for a public production deployment. The production architecture should keep provider credentials on a protected backend and validate actions server-side.

## Native Android status

This repository is currently a web prototype, not an installable native Android APK. The native Android bridge is an integration seam only; native Kotlin/Compose implementation, permissions, Android app launching, and APK build/release remain separate milestones.

## Development checks

Run `npm test` for source, classifier, planner, and safety checks. Run `npm run test:e2e` for mobile-browser acceptance tests (requires the pinned Playwright dependency and Chromium). GitHub Actions runs both checks on pull requests.\n\n## Production gates still open\n\n- Move provider credentials and privileged actions behind a protected backend.\n- Implement and test durable reminders/automation that survive page closure and device sleep.\n- Replace native Android integration stubs with permission-aware, user-approved implementations and verify them on real devices.\n- Validate browser/native speech latency, lifecycle behavior, and permissions on target Android hardware.\n- Add end-to-end evaluation for real model responses, tool execution outcomes, and recovery from provider/network failures before calling the assistant production-ready.
