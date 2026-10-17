# Review: Anthropic JARVIS HTML prototype

## Decision

Keep the current JARVIS app and Android bridge as the product baseline. Treat `jarvis-web.html` as a feature reference, not a replacement for `index.html`. The supplied file is a standalone 1,151-line HTML/CSS/JavaScript application with its own state model, navigation, browser demo backend, voice stack, and AI-agent loop. Replacing the current app with it would discard the existing intent regression suite, local trace/correction loop, API security boundary, and native reminder integration.

## What the prototype contains

| Capability | What the supplied source actually does | Integration decision |
|---|---|---|
| Voice UI and speech | Uses Web Speech API recognition and speech synthesis, animated voice overlay, optional page-open wake listening | Reuse selected interaction patterns only if they improve the current voice UI; preserve the existing voice pipeline and test coverage |
| AI agent loop | Defines JSON-schema-like tools and lets the model request up to six tool-call rounds | Strong candidate for the brain, but implement through the existing server-side AI gateway and action validator, not as a second client-side agent |
| Timers and alarms | Uses browser-page timers; the alarm is implemented as a countdown to a clock time | Keep Android native reminders as the durable path; do not treat browser timers as reliable background alarms |
| Tasks and notes | Persists local tasks and notes in browser storage | Compare with existing local storage/notes and avoid creating a parallel store |
| Weather and location | Uses browser geolocation, approximate IP fallback, reverse geocoding, and Open-Meteo; draws an interactive CARTO tile map | Good optional UI feature; add behind a small location/weather service and clearly label approximate location |
| Contacts, calls, messages | Browser demo includes hard-coded sample contacts and messages; calls open a `tel:` link and WhatsApp/SMS open a prepared link for the user to confirm | Never import the sample contacts/messages; use the Android bridge for real device data and keep the user's final send/call action explicit |
| Phone controls | The browser demo reports many controls as Android-only; several controls are placeholders in demo mode | Reuse only controls backed by an implemented, permission-checked native bridge method |
| Provider configuration | Sends Anthropic/OpenAI/Groq requests directly from the browser and stores provider keys in localStorage | Do not copy this design. Keep credentials server-side behind the existing authenticated gateway |
| Conversation/tool history | Maintains a small in-memory provider history and a local chat history | Prefer the current bounded trace store, explicit user feedback, and privacy controls |

## High-value additions, in order

1. **Schema-driven brain tools through the existing gateway.** Define a small allowlist of typed tools such as weather, timer/reminder, task/note, web search, and open navigation. The model may propose a tool call; JARVIS validates arguments, checks required permissions, asks for confirmation for consequential actions, executes through the existing command/native bridge, and records the real result in the trace ledger. Do not add a second independent action executor.
2. **Multi-step request planning.** Adapt the prototype's bounded tool loop so a request like “check the weather, then remind me to take an umbrella before I leave” can sequence independent steps. Put a strict step limit, per-tool schemas, cancellation, timeout/error handling, and a trace for each step around it.
3. **Location/weather card and map.** This is the most visible net-new UI feature. Keep location optional, show when it is approximate, and do not request location until the user invokes a location-dependent feature.
4. **Voice overlay polish.** Borrow the animated listening/speaking state design, reduced-motion support, and clear cancel control. Do not replace working speech recognition/wake logic just for the visual effect.
5. **Capability-aware settings.** Show actual bridge capability and permission status, not optimistic demo statuses. A browser stub must say “Android app required” instead of simulating success.

## Security and correctness findings in the supplied prototype

- It sends provider keys directly from the browser using `anthropic-dangerous-direct-browser-access` and stores keys in localStorage. This is not suitable for the current product; retain server-side credentials.
- Demo contacts and messages are hard-coded fixtures, including a sample OTP. They must never be presented as the user's real inbox or imported into production state.
- Some browser demo operations only mutate local sample data. A response such as “Reply sent” is not evidence that a real message was delivered.
- The wake-word feature runs while the page is active and depends on browser speech recognition support. It is not a reliable Android background service.
- Browser timers cannot be relied on to fire when the page/process is suspended. Keep durable reminders on the native Android scheduler and report scheduling outcomes accurately.
- The model's tool output is untrusted input. Validate tool names and every argument, enforce per-tool permissions, require confirmation where appropriate, and never claim success unless the platform confirms it.
- External geocoding/map/weather endpoints introduce network and privacy dependencies. Make location use opt-in and handle failures without breaking core JARVIS.

## Integration guardrails

- Preserve `index.html`, `brain/feedback-learning.js`, `brain/trace-store.js`, `training/intents.json`, the existing test suites, server-side gateway, and Android native reminder bridge.
- Do not wholesale-copy the prototype or its `Demo` backend.
- Add one capability at a time behind the existing contracts, with tests for success, denied permission, malformed model arguments, cancellation, offline mode, and native bridge absence.
- Keep the current branch/PR workflow; do not merge to `main` as part of this review.
- Treat this review as a source-code inspection, not as proof that every prototype path works on a device.

## Recommended first implementation

Build the **schema-driven tool contract and bounded multi-step planner** against the existing AI gateway and command-confirmation pipeline. This brings the prototype's most valuable brain idea into JARVIS without importing its unsafe browser-key handling or replacing the existing application. The map/weather panel is the next independent UI enhancement.
