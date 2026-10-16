# JARVIS Web-First Production Plan

## Product order
The web/PWA is the primary product until its functional acceptance tests pass. Android work is a downstream packaging target and must not be used to discover core product behavior.

## Verified baseline
- Main branch's GitHub Pages deployment and smoke workflow were green on commit `7b93daf2375f70134b849e1d37b2c9d94d15f130`.
- The web UI embeds its JavaScript in `index.html`; intent training corpus is `training/intents.json`.
- 38 existing intent examples pass the current offline classifier evaluation in a source-level run.
- The existing smoke test checks JavaScript syntax and static feature contracts; it is not yet a browser end-to-end suite.
- Provider API keys are stored in browser-side settings. This is acceptable only for a private prototype and is not a secure multi-user production architecture.
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
- Add Playwright browser tests for primary navigation, settings, notes, tasks, reminders, confirmation gates, offline behavior, import/export, errors and mobile viewport.
- Run manual checks on Android Chrome and desktop Chrome/Firefox/Safari where supported.
- Verify GitHub Pages deploy and a real browser session before considering Android packaging.

## Current change in this branch
The command planner's `requiresConfirmation` flag is now enforced at the dispatch boundary for configured consequential intents. The user must click the explicit confirmation button before the handler is run. Regression assertions were added. Source syntax and all 38 intent cases passed in a direct validation run. These checks do not yet replace browser end-to-end tests.
