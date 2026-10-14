# JARVIS · Personal Intelligence

A mobile-first, single-file HTML/CSS/JavaScript prototype for a personal assistant. The supplied Sogaso telecom screenshot is used only as a visual reference for cinematic space lighting, restrained cyan accents, translucent glass cards, strong typography, and compact navigation. This project is JARVIS, not a telecom app.

## V1 capabilities

- Mobile-first JARVIS assistant interface with a space-inspired intelligence visualization.
- Typed chat interface with honest local-command responses.
- Local commands: time, date, task listing, opening Tasks and Memory, adding tasks, and saving notes.
- Local task and note storage in browser localStorage.
- Browser speech recognition when supported and permitted; browser text-to-speech is available for future response playback.
- Assistant, Tasks, Memory, and Settings screens.
- Installable app shell and service worker.

## Important boundaries

- **Cloud intelligence is not configured.** No request is sent to a remote model, and no API key is included in browser code.
- General AI reasoning is not yet connected to a cloud or on-device language model. Unsupported questions are answered honestly rather than simulated as completed AI work.
- Speech recognition support varies by browser and may require internet. It is not guaranteed to work offline.
- Local tasks and notes remain in this browser on this device and can be lost if site data is cleared.
- No native Android integrations, background assistant, or always-listening capability is implemented.

## Run

Deploy this folder with GitHub Pages or serve it over HTTP. The prototype has no build step or third-party JavaScript dependencies.

## Next milestones

1. Test layout and controls on the target Android phone.
2. Verify speech recognition and speech synthesis on the target browser.
3. Add a secure, configurable cloud-model gateway without exposing secrets in client code.
4. Add an optional local model path after confirming device compatibility and resource requirements.
5. Test offline shell startup and local commands in airplane mode.

The UI uses the reference's visual language, while all content and controls are designed for JARVIS.
