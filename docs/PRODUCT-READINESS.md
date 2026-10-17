# JARVIS Product Readiness

Last reviewed: 2026-10-17  
Working branch: `feature/jarvis-android-reminders`  
Reference: `docs/ANTHROPIC-JARVIS-PROTOTYPE-REVIEW.md`

## Current verified state

- [x] Android debug APK builds in GitHub Actions.
- [x] Android lint and unit-test job passed for commit `931da70c880c65f2d0334c3631fb6a06977abc59`.
- [x] Unit, smoke, and security tests passed for the same revision.
- [ ] Browser acceptance suite: failed because the new planner E2E tried to fill a home-screen-only planner while the app was still on System settings. The test has been corrected to navigate back to Home and wait for the planner input. Re-run CI before calling this fixed.
- [ ] Install and test the latest APK on a real Android device. CI build success is not device verification.
- [ ] Production/release signing and distribution pipeline not verified.

## Feature status against the Anthropic reference

| Capability | Current state | Remaining work before release |
|---|---|---|
| Existing JARVIS UI, tasks, notes, local traces and corrections | Present in the current app | Regression-test persistence, reset/import/export, and error states on mobile |
| Android one-shot reminders | Native bridge and Android scheduling exist | Test notification permission denial, reboot, exact alarm behavior, timezone/time changes, and OEM battery restrictions on device; document force-stop limitations |
| AI provider access | Secure server-side gateway exists; browser personal-key mode is also present | Ensure production deployment disables browser keys by policy; verify authentication expiry, rate limits, timeout handling, and no secrets in logs/backups |
| Multi-step planner | Confirmation-first plan proposal, allowlisted step types, up to four steps | Verify the full E2E; add schema-per-tool validation, cancellation/timeouts, reliable per-step result classification, and trace entries for every step |
| Weather and location | Existing weather/location functionality is present | Add the reference's visible weather/location card and interactive map; make location opt-in, label approximate location, and handle denied permission/offline service |
| Voice UI and speech | Browser and Android speech pathways exist | Test start/stop/cancel, permission denial, unsupported browser, app background/foreground, and long-running wake behavior; keep reduced-motion support |
| Contacts, calls and messaging | Existing command/confirmation and native bridge pathways | Verify against real Android contacts/messages; no demo fixtures; never report a send/call as successful before platform confirmation |
| Phone controls | Some actions depend on Android bridge/permissions | Audit every displayed control against a real implemented native method and permission; clearly mark unavailable capabilities instead of simulating success |
| Settings and capabilities | AI, voice, phone, theme, security, and data settings exist | Show actual native bridge and permission state, gateway connectivity, and device support; make disabled features explicit |
| AI tool loop | Current planner uses a bounded allowlist and maps plan steps to existing command handlers | Implement typed per-tool schemas and a bounded multi-turn tool loop through the existing gateway, with strict allowlist, timeout, cancellation, permission checks, and auditable traces |
| Release quality | Debug APK artifact available from CI | Add release signing, versioning, install/upgrade tests, accessibility checks, crash/error reporting policy, privacy disclosure, and release notes |

## Release blockers

1. **Green acceptance CI on the latest commit.** The planner navigation regression test has been fixed in code, but must pass in a fresh run.
2. **Real-device verification.** Install the latest APK and test native reminders, reboot rescheduling, voice, notification/microphone permissions, flashlight if supported, and confirmation/cancellation flows.
3. **AI planner hardening.** Validate every argument using a schema specific to its tool; bound time and number of steps; stop safely on errors; record each actual result; never infer success from optimistic response text.
4. **Visible weather/map feature.** The reference has a map panel; the current product review identifies this as the highest-value visible feature still to integrate.
5. **Capability truthfulness.** Remove or clearly label any UI action that has no real bridge implementation, permission, or confirmed platform result.
6. **Release security and operations.** Confirm production gateway-only configuration, secret handling, authentication/rate limits, offline behavior, versioning, signing, and recovery from failed upgrades.

## Safe release criteria

Do not label the product production-ready until all of these are true:

- [ ] Latest branch commit passes unit, security, browser E2E, Android lint, and APK build workflows.
- [ ] Latest APK installs and upgrades successfully on a physical Android device.
- [ ] Critical native features are manually verified with permission granted and denied.
- [ ] Multi-step plans require confirmation, cancel without side effects, reject malformed/unsupported actions, stop on failures, and report actual outcomes.
- [ ] No browser-stored provider secrets are allowed in the production deployment.
- [ ] The UI accurately reports unsupported, disconnected, denied, offline, and failed states.
- [ ] Privacy, permissions, known limitations, release signing, and distribution are documented.

## Deliberately not copied from the reference

- No hard-coded sample contacts, messages, or OTPs as if they were real data.
- No direct browser provider-key calls in the production configuration.
- No claim that browser timers or page-active wake listening provide reliable background Android service.
- No fake success for placeholder phone controls.

## Decision

**Status: development build, not yet product-ready.** The Android debug artifact builds, but the planner acceptance test must pass again, the weather/map feature remains to be integrated, and real-device/release verification is outstanding. Keep changes on the feature branch until the release criteria are met; do not merge to `main` as part of this work.
