# JARVIS · Personal Intelligence

A mobile-first JARVIS personal-assistant prototype. The product is named JARVIS; `BumbleBee` is only the repository name.

## Current prototype

- `index.html`: mobile UI, local command routing, voice input where supported, speech output, tasks, reminders, notes, contacts, weather, and provider settings.
- Current-news briefing: topic feeds for World, India, Business, Technology, Science, and Sports. It retrieves headlines through RSS2JSON, displays the feed source and publication time where provided, caches results locally, and reports refresh failures. News summaries use the fetched headlines as context when an AI provider is configured.
- `orb-engine.js`: optional WebGL orb scene.
- `manifest.webmanifest` and `sw.js`: installable web-app shell and cache versioning.
- `scripts/smoke.mjs`: dependency-free source and JavaScript syntax checks, run by GitHub Actions.

## Native Android status

The repository now contains the first native Android APK foundation under `app/`. It packages the existing web UI locally and uses an allowlisted Kotlin bridge for app launching, dialer/SMS/WhatsApp handoff, and alarm handoff. The Android build workflow produces an internal debug APK artifact. This is not yet a production or Play Store release.

Native speech, contact/SMS/notification reading, flashlight, system-wide actions, signing, and physical-device validation remain future work. The debug APK must be tested on the target Oppo Find X9 before calling those device behaviors verified.

## News and voice limitations

The current news feature is best-effort, not a guaranteed breaking-news service. RSS feeds and the conversion service can be unavailable, and headline metadata can be incomplete. JARVIS must not claim a fresh update if it could not verify a current feed. Headlines are not a substitute for opening the linked reporting. The browser's available speech voices vary by Android device or WebView; native voice tuning and real-device latency still need testing.

## Security

Provider API keys are currently configured in the client prototype. This is not production-secure: browser storage and client-side requests cannot protect secrets from a device user or injected script. Do not use this pattern for a public production deployment. A production architecture should keep provider credentials on a protected backend and validate actions server-side.

## Development checks

Run `node scripts/smoke.mjs` to validate JavaScript syntax and required UI safeguards. GitHub Actions runs the same check on pushes and pull requests.

See [Android APK implementation notes](docs/ANDROID_APK.md).
