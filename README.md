# BEECORE

A mobile-first personal assistant foundation focused on real capabilities, honest status, and privacy.

## Current implementation

The GitHub Pages app is in `index.html`. It currently provides:

- A mobile-first, voice-oriented assistant interface.
- Local task and note storage in browser storage.
- A real on-device language-model integration using the open-source [WebLLM](https://github.com/mlc-ai/web-llm) runtime.
- An explicit **Prepare local brain** action. The app does not download a large model until the user asks it to.
- Multi-turn chat history stored locally.
- Browser speech-recognition support where available; this is not guaranteed to work offline.
- A service worker and web app manifest for the application shell.

## Local model requirements

The configured model is `Llama-3.2-1B-Instruct-q4f16_1-MLC`, provided through WebLLM's prebuilt model configuration. WebLLM uses WebGPU for in-browser inference and caches model artifacts through the browser cache.

First-time setup requires a compatible browser, internet access, and a substantial model download. Browser GPU support and available memory vary by device. The first model initialization has **not yet been verified on the target phone**.

Do not assume complete offline readiness merely because the page shell is cached. The runtime module is loaded from a CDN and model artifacts must be available in cache. Offline cold-start behavior must be tested on the actual device before it can be called reliable.

## What is not implemented yet

- Native Android runtime or Android system integrations.
- Reliable offline speech recognition and offline speech synthesis.
- A permissioned skill registry for external actions.
- Web research, file-system automation, email sending, or other external tools.
- Verified on-device performance and offline cold-start behavior.

The app must never claim an external action succeeded without a verifiable result. A language model response alone is not evidence that an action happened.

## Architecture references used

- [WebLLM](https://github.com/mlc-ai/web-llm): open-source WebGPU inference, model loading, and chat completion APIs.
- [Vesta](https://github.com/RisorseArtificiali/vesta): native Android local-model assistant architecture, memory, and system actions.
- [OffHand](https://github.com/MRDarshan7/OffHand): offline-first voice processing, action validation, and explicit confirmation.

These projects are technical references, not code copied wholesale into BEECORE. Review their licenses and attribution requirements before adopting source files or dependencies.

## Next engineering gates

1. Verify WebGPU availability on the target phone.
2. Download and initialize the local model; verify a multi-turn conversation.
3. Reload after caching and test airplane-mode cold start.
4. Add a typed skill registry with validation, permission gates, and execution receipts.
5. Integrate voice components only after their online/offline behavior is known.
6. Run mobile tests and document verified device/browser versions.

## Privacy and credentials

The local-model path does not require an API key. Do not put provider secrets into client-side code or commit them to the repository. If a remote model is added later, use a secure server-side gateway and explicit user configuration.

## License

Review each dependency's own license before redistributing or bundling it. The repository's license and third-party licenses should be kept distinct.
