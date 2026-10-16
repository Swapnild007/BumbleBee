# JARVIS Capability Audit and Production Roadmap

Audit scope: repository source on `feature/android-apk-foundation`. This is a source review, not a claim of physical-device verification. Status means what the current implementation actually does.

## Executive finding

JARVIS is currently a mobile web assistant wrapped in an Android WebView with a small Kotlin bridge. It is not yet a complete autonomous Android assistant. The offline command classifier, UI, provider calls, and local storage are useful foundations, but several actions are placeholders, some commands only simulate completion, and there is no production-grade automation runtime or native always-on listening service.

## Capability inventory

| Capability | Current state | Production requirement |
|---|---|---|
| Text chat / AI response | Implemented when a provider key and network are available; client-side provider configuration | Server-side credential protection, provider adapters, timeouts, retries, streaming/cancel, health states |
| Local intent recognition | Rule-based classifier and 38-example training corpus | Expand coverage, add confusion/negative tests, confidence thresholds, typed slots, safe fallback |
| Action planner | Basic planner with confirmation-intent list | Central policy engine; confirmation must gate actual execution, not just annotate a plan |
| Personal memory / notes | Local browser storage, searchable/editable UI | Data schema/versioning, export/import validation, deletion guarantees, encrypted sensitive fields if required |
| Tasks | Local task list | Durable scheduler for due tasks and recurring tasks, reboot handling, exact completion state |
| Timers / reminders | Local records and UI flow; Android alarm handoff exists for alarm intent | Native AlarmManager/WorkManager scheduling, notification channel, exact-alarm policy handling, cancel/edit, reboot persistence |
| Calendar / meetings | Current UI uses local event helpers; no verified calendar connector in this Android bridge | Calendar permission or supported calendar integration, timezone handling, empty/error states |
| Weather | External forecast request based on current location; cached/local state | Network failure and stale-data UX, location provenance, unit/timezone tests |
| Location | Browser geolocation request with IP fallback; native WebView geolocation callback now configured | Verify permission lifecycle on Android; preserve GPS over IP estimates; distinguish precise/approximate, denied, stale, unavailable |
| Maps | Web map embed in browser; native app avoids remote iframe in bridge-enabled WebView and uses Maps link | Native map preview or external Maps handoff, no remote content inside privileged WebView |
| News | RSS conversion/feed flow with cache and source metadata | Source validation, feed failure/retry policy, stale-cache labels, parsing tests |
| Phone call | Opens dialer intent, not silent calling | Confirmation, validated contact/number, result receipt; direct calls require explicit permission and user consent |
| SMS / WhatsApp | Opens compose/chat UI; WhatsApp auto-send setting is not a safe guarantee of actual sending | Keep review-before-send by default; never report sent until independently confirmed |
| Installed apps | Package allowlist and launcher intent for known apps; some app links use HTTPS fallback | Per-device package tests, missing-app handling, verified app links |
| Clock / alarm | Clock handoff with fallback alarm intent | Validate supported clock behavior, timezone/date rollover, OEM fallback, exact schedule and cancellation |
| Camera | Camera intent handoff exists | Verify camera app availability and return behavior; define whether capture or preview is expected |
| Flashlight | Web command path exists; native handler has been identified as a placeholder in the audited source | Implement CameraManager torch with runtime permission, lifecycle/error handling, hardware absence tests |
| Voice input | Android speech-recognition activity and Web Speech path | Permission/result/error tests, language selection, no false listening indicator |
| Spoken responses | Android TextToSpeech and browser speech output | TTS lifecycle, initialization failures, queue/cancel behavior, locale fallback |
| Hands-free wake word | Browser-only continuous recognition attempt while page is active; native `setWake` is a not-implemented placeholder | Foreground microphone service with visible notification, Android-version permission compliance, start/stop controls, battery/thermal testing, false-trigger guard, command confirmation, reliable recovery |
| Read notifications / messages | Kotlin getters return empty arrays; access-status methods return false; no complete listener implementation | User-enabled NotificationListenerService, privacy minimization, app allowlist, permission/revocation handling |
| Reply to notifications | Placeholder response | Notification action token validation and supported-reply handling, user confirmation, verified result |
| Contacts | Native getter returns empty array; browser contact flow is not equivalent to native contacts permission | Contacts permission only when requested, provider query, normalization, duplicate/disambiguation handling |
| Volume / system controls | Native volume/global-action methods are placeholders | Implement only allowed APIs; accessibility service is a separate opt-in and Play policy-sensitive capability |
| Always-on assistant / screen-off commands | Not implemented | Foreground-service design and device/OEM validation; be explicit about OS restrictions and battery trade-offs |
| Offline mode | Some local skills work without a provider | Clear online/offline status; local fallback for every core flow; no fake success |
| AI agents / automation | UI counters/agent concepts exist, but no production task scheduler/agent execution engine verified | Skill registry, durable job queue, scoped permissions, idempotency, logs, retry budgets, cancellation, approval gates |
| Security | Bridge is local-origin oriented; provider keys are stored client-side; backup is disabled in manifest | Harden navigation/origin validation and message schemas; server-side keys; threat model; privacy review; dependency scanning |
| Data persistence | localStorage-based UI data | Migration tests, corruption recovery, backup/export controls, restore tests, data deletion controls |
| Release / QA | CI builds a debug APK; smoke checks validate source and command-classifier examples | Android lint, unit/instrumentation tests, signed release pipeline, SBOM/dependency review, crash diagnostics, physical-device matrix |

## Hands-free control design

The desired interaction is: say “Hey JARVIS”, wait for an audible/visual acknowledgement, issue a command, hear a truthful result, and optionally confirm consequential actions.

Required safety rules:
- Listening must be visibly active and stoppable at any time.
- Microphone use must be user-enabled, permission-gated, and shown with a foreground notification when required.
- Never claim an alarm, message, call, setting, or automation succeeded until the native/API operation returns a verifiable result.
- Calls, messages, purchases, deletion, and system-wide actions require confirmation unless a narrowly scoped user-approved rule exists.
- Wake-word recognition and speech recognition are not guaranteed to continue under all Android/OEM battery and background restrictions. The UI must communicate that limitation.
- No accessibility service or auto-send behavior should be enabled silently.

## Automation engine required

Each automation needs: stable ID, trigger, timezone, recurrence, input schema, permission set, confirmation policy, idempotency key, timeout/retry limits, next-run time, run history, cancellation, and result receipt. Use Android WorkManager for deferrable work and AlarmManager only when exact timing is justified and permitted. Store jobs durably; recover after process death/reboot; never rely on JavaScript setTimeout for production reminders.

## Brain / skills architecture required

1. **Perception:** text, push-to-talk, foreground wake service, and explicit system events.
2. **Intent and context:** local deterministic routing first, then model-assisted interpretation when configured. Validate model output against a schema.
3. **Planner:** build typed actions with required slots, risk level, permissions, and confirmation requirements.
4. **Policy gate:** block unauthorized or unsafe actions before dispatch.
5. **Skill registry:** adapters for device actions, reminders, news, weather, memory, files, and provider APIs. Every skill declares availability, permissions, timeout, retries, and tests.
6. **Execution:** durable job state, cancellation, bounded retries, and no duplicate side effects.
7. **Receipts:** succeeded/failed/partial/cancelled state backed by the actual tool result.
8. **Memory and audit:** user-controlled persistence, sensitive-data minimization, inspectable execution history.

## Release gates

- [ ] Existing web UI and all existing shortcuts regression-tested.
- [ ] Every command in the training corpus has a positive, negative, and ambiguous-input test.
- [ ] Planner confirmation is enforced at the execution boundary.
- [ ] No native placeholder can return a success-looking response.
- [ ] Reminder/timer behavior survives process death and reboot as designed.
- [ ] Location source/accuracy and permission states are truthful.
- [ ] Wake service start/stop, notification, denial, background, screen-off, and battery tests pass.
- [ ] Provider credentials removed from public client-side production configuration.
- [ ] WebView bridge origin, navigation, input and message-size defenses reviewed.
- [ ] Android lint, unit tests, instrumentation tests, and web smoke tests pass.
- [ ] Signed release build reproducible and dependency/security checks pass.
- [ ] Physical-device validation performed on target Oppo device before declaring release-ready.

## Priority order

**P0: Truth and safety.** Fix success-looking responses for unsupported volume/global actions, wake word, contacts, messages, and automation. Enforce confirmation at execution time.

**P1: Core reliability.** Expand command coverage/tests; persistent timers/reminders; native location/voice/camera/clock/torch; error handling and data migrations.

**P2: Hands-free.** Build the opt-in foreground wake service and voice command pipeline, with Android background restrictions clearly surfaced.

**P3: Brain and automation.** Implement provider adapters, schema-validated tool calling, skill registry, durable scheduler, job history, cancellation and permission policy.

**P4: Production release.** Server-side secrets, threat model, release signing, instrumentation, physical-device QA, crash and privacy review.

A green APK compilation is only a packaging gate. It is not proof that JARVIS is production-ready.
