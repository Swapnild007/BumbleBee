# JARVIS · Personal Intelligence

A mobile-first JARVIS assistant prototype. The app keeps its own visual design and uses the supplied ULTRON Orb UI repository as a technical reference for 3D-rendering techniques only.

## Current implementation

- `index.html`: the JARVIS mobile UI, local command handling, voice input where browser-supported, local tasks, and notes.
- `orb-engine.js`: a Three.js WebGL core with layered wireframe spheres, orbiting rings, animated shader energy core, particles, signal nodes, touch rotation, and pinch zoom.
- `manifest.webmanifest` and `sw.js`: installable app shell and caching of the 3D engine.

## Technical reference and attribution

The 3D scene takes inspiration from techniques described in [ULTRON Orb UI by Sagar Tamang](https://github.com/SAGAR-TAMANG/ultron-by-sagar-builds), which is published under the MIT license. This project does not use ULTRON's HUD, layout, branding, or interface copy. The JARVIS UI and scene implementation here are independently composed for this project.

## Runtime

The app is a static HTML/JavaScript project with no build step. It loads Three.js and OrbitControls as ES modules from jsDelivr, so the first load needs an internet connection. The app shell and orb engine are cached by the service worker after a successful load. Browser/WebGL support is required for the 3D core; the existing CSS core remains as a fallback if WebGL cannot initialize.

## Mobile performance

- Pixel ratio is capped at 1.5.
- Particle count is reduced on Android.
- Rendering pauses when the document is hidden or the core is offscreen.
- Reduced-motion preferences disable automatic rotation.
- OrbitControls handles touch rotation and pinch zoom.

## Intelligence and security

Local commands currently support time/date, task listing and creation, opening local sections, and saving notes. General AI reasoning is not connected yet. Do not store cloud provider API keys in client-side HTML or JavaScript. Connect cloud intelligence through a protected backend or local proxy.
