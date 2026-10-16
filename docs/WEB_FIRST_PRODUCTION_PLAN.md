# JARVIS Web-First Production Plan

## Product order
The web/PWA is the primary product until its functional acceptance tests pass. Android work is a downstream packaging target and must not be used to discover core product behavior.

## Verified baseline
- Main branch's GitHub Pages deployment and smoke workflow were green on commit `7b93daf2375f70134b849e1d37b2c9d94d15f130`.
- The web UI embeds its JavaScript in `index.html`; intent training corpus is `training/intents.json`.
- 54 versioned intent regression cases plus 10 action-schema fixtures are evaluated by the offline classifier and action validator.
- The smoke test checks JavaScript syntax, intent/slot evaluation, action validation, security helpers, and static feature contracts. A Playwright mobile-browser suite also runs in CI.
- An authenticated server-side AI gateway is implemented. Public deployment should set `JARVIS_DISABLE_BROWSER_KEYS=true`; browser-key mode remains available only for trusted personal testing.
- Browser wake-word recognition depends on browser support, microphone permission, network/service behavior, page visibility and device power management. It cannot guarantee OS-level always-on listening.
- Timers/reminders driven by page JavaScript cannot guarantee delivery after the page/browser is closed or the device suspends. Production reminders need a durable scheduler and notification delivery strategy.

## Web-first implementation gates
### Gate 1: command correctness and safety
- Enforce confirmation before calls, messages, app launches, or other consequential side effects.
- Distinguish an intent parsed, an action queued, an external app opened, and an action actually completed.
- Never claim a message was sent when JARVIS only opened a compose screen.
- Add tests for positive, negative, ambiguous and missing-slot commands.

### Gate 2: brain
- Local deterministic skills execute first for supported commands.
- AI is a planner/assistant, not an authority to bypass policy.
- Use schema-validated proposed actions; validate intent, slots, permissions and risk before execution.
- Clarify missing names, numbers, times, dates and timezones rather than guessing.
- Add provider timeouts, cancellation, error mapping and explicit online/offline state.

### Gate 3: automation
- Define a durable job schema: id, trigger, timezone, recurrence, action, permissions, confirmation policy, status, idempotency key, retry budget, created/updated timestamps and run history.
- Store local jobs for offline UI access, but use a server scheduler or platform notifications for reliable delivery when the web page is closed.
- Until that scheduler exists, label reminders as foreground/browser-session reminders and show the limitations when created.
- Provide pause, resume, edit, cancel, run-now, history and failure recovery.

### Gate 4: voice and hands-free
- Push-to-talk works with permission prompts, clear listening state, transcript review and cancellation.
- Browser wake-word mode must be labelled best-effort and foreground-only.
- Add an obvious microphone-active indicator and one-action stop.
- Avoid executing sensitive actions based solely on a potentially misrecognized wake-word transcript.
- Test speech recognition unavailable, permission denied, no network, backgrounding, and stop/resume.

### Gate 5: data and security
- Validate import files and schema versions; offer export, clear-data and recovery flows.
- Explain local storage scope and that browser storage can be cleared by the browser/OS.
- Remove client-embedded shared provider secrets before public production. Use a protected backend for shared credentials and per-user authorization.
- Treat remote feeds and AI output as untrusted data; render text safely and constrain action arguments.
- Add privacy and dependency reviews.

### Gate 6: browser acceptance
- Run JavaScript syntax checks and intent corpus tests in CI.
- A Playwright mobile-Chromium acceptance suite checks home rendering, offline help, brain traces and feedback/deletion, briefing fallback, task persistence across reload, memory saving, secure gateway login and key policy, all brain/action evaluation checks, multi-turn clarification, action confirmation/cancellation, and uncaught browser exceptions. The suite passed in GitHub Actions on commit `6f691c53a6af07d11e000f4824c9278c9dcddda7`; it is a baseline, not full production certification.
- Add Playwright browser tests for primary navigation, settings, notes, tasks, reminders, confirmation gates, offline behavior, import/export, errors and mobile viewport.
- Run manual checks on Android Chrome and desktop Chrome/Firefox/Safari where supported.
- Verify GitHub Pages deploy and a real browser session before considering Android packaging.

## Current change in this branch
The command planner's `requiresConfirmation` flag is enforced at the dispatch boundary for configured consequential intents. The user must click an explicit confirmation button before the handler is run, and can cancel without running the action. Browser reminders now disclose that closing JARVIS or device sleep can prevent delivery. Smoke assertions and a Playwright mobile-browser suite are added; The current smoke and Playwright CI run passed on commit `6f691c53a6af07d11e000f4824c9278c9dcddda7`. Source syntax, all 54 intent cases, and all 10 action-schema fixtures passed. Additional coverage and manual real-device/browser checks remain before production readiness.
