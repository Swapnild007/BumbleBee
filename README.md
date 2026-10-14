# JARVIS · Personal Intelligence

A mobile-first JARVIS assistant prototype using the supplied cinematic telecom UI reference as a visual design source only. The reference informs the dark space environment, illuminated Earth horizon, cyan accents, glass panels, typography, layered depth, and compact bottom navigation. The product itself remains a personal AI assistant.

## Features

- Single-file responsive interface in `index.html`, with embedded CSS and JavaScript.
- Cinematic dark-space composition, cyan intelligence visualization, and glass-style status panels.
- Assistant, Tasks, Memory, and Settings navigation.
- Local commands for time, date, task listing, task creation, opening local sections, and saving notes.
- Browser speech recognition where supported, plus speech cancellation.
- Local task and note storage using browser localStorage.
- Installable web app shell via `manifest.webmanifest` and `sw.js`.

## Intelligence and security

The current prototype does not connect to a cloud model. General AI responses are not available until a provider is securely configured. Do not put provider API keys in client-side HTML or JavaScript. Use a protected backend or local proxy for cloud intelligence.

Speech recognition support and behavior depend on the browser. Local commands and saved notes do not require cloud access. LocalStorage data remains in that browser on that device.

## Run

Serve this directory over HTTP or deploy it with GitHub Pages. No build step or third-party JavaScript dependency is required.

## UI acceptance criteria

- The reference is the source of truth for visual style, not telecom product content.
- No telecom usage tracker, plan allowance metrics, or carrier account claims.
- No previous assistant orb-only screen or purple/gold theme.
- Preserve JARVIS as the product, with offline-first controls and an honest cloud-connection status.
- On mobile, the composer and bottom navigation remain anchored while the main content can scroll.
