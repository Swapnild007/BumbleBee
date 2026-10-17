# JARVIS Android APK foundation

This adds the first native Android wrapper around the existing JARVIS web interface.

## Architecture

- The existing root `index.html` remains the UI source of truth.
- During the Android build, Gradle copies the web UI, intent training corpus, and supporting assets into the APK.
- Android loads those bundled files through AndroidX `WebViewAssetLoader` on the app-assets HTTPS origin. It does not load the remote GitHub Pages site into a bridge-enabled WebView.
- The JavaScript bridge is named `JarvisNative`. Native app launching is allowlisted and uses Android's package launch intent. Unknown package names are rejected.
- Normal web links leave the WebView and open in an external app/browser.
- Call and SMS actions open the appropriate Android compose UI. WhatsApp opens a chat link for review; this foundation does not auto-send messages.

## Current implementation scope

Implemented in this foundation:
- Native Android app shell and local bundled web UI.
- Debug APK build workflow in GitHub Actions.
- Launch intents for the allowlisted installed apps.
- Android settings and dialer handoff.
- SMS compose and WhatsApp chat handoff.
- Alarm handoff to the installed Clock app.
- One-shot Android reminder notifications that can fire while JARVIS is closed, with app-private persistence and reboot rescheduling. Android 13+ notification permission is requested before delivery is enabled.
- Reminder cancellation is wired to the native scheduler.
- Explicit placeholder responses for native capabilities that are not implemented yet.

Not implemented yet:
- Native speech recognition / speech synthesis.
- Reading contacts, SMS, or notifications.
- Notification listener or accessibility service.
- Flashlight, system-wide volume, or global accessibility actions.
- Recurring reminder rules, exact-alarm guarantees, production signing, Play Store packaging, device QA, or any claim that this has been tested on a physical phone. Android may delay inexact alarms under power-management policies; force-stopping the app can prevent delivery until it is opened again.

## Build

The GitHub Actions workflow `.github/workflows/android-apk.yml` builds a debug APK and uploads it as the `jarvis-debug-apk` artifact when the workflow completes successfully. It is an unsigned-for-release debug build suitable for internal testing, not a Play Store release.

## Security notes

The JavaScript bridge can invoke native code, so only locally bundled app-owned UI is allowed to stay inside the WebView. External HTTP(S) links are handed off to the browser. No broad package enumeration permission is used; known shortcut packages are declared in `<queries>`. Sensitive runtime permissions are intentionally not requested by this initial foundation.
