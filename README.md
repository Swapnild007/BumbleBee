# JARVIS · Personal Intelligence

Mobile-first JARVIS assistant prototype. **The JARVIS UI remains our own.** The open-source ULTRON project is used as a code source for the 3D scene and optional hand-gesture tracking, not as a UI template.

## Architecture

- `index.html`: JARVIS UI, local command handling, browser speech input, task and note memory.
- `src/lib/orbScene.ts`: reused and cyan-adapted source scene from ULTRON Orb UI. Keeps its Three.js scene architecture, orbital geometry, particles, scan rings, post-processing and camera controls.
- `src/lib/handTracker.ts`: reused MediaPipe hand-tracking implementation, including pinch hysteresis, smoothing and one-hand rotation / two-hand zoom.
- `src/main.ts`: JARVIS-specific bridge that mounts the scene in the existing core and adds opt-in camera controls inside JARVIS Settings. It does not import ULTRON's HUD or page layout.
- `package.json` / `vite.config.ts`: bundle the TypeScript modules and their dependencies into a static site.
- `public/`: install manifest and service worker copied into the production build.

## Source reuse and license

The scene and gesture modules are derived from [SAGAR-TAMANG/ultron-by-sagar-builds](https://github.com/SAGAR-TAMANG/ultron-by-sagar-builds). The upstream repository is MIT-licensed. Its license is preserved at `LICENSES/ULTRON-ORB-MIT.txt`. The palette and app integration were adapted for JARVIS. ULTRON branding, HUD and page layout are not used.

## Build

```sh
npm install
npm run dev
npm run build
npm run preview
```

GitHub Actions builds the static site to `dist/` and deploys it to GitHub Pages. The repository's Pages deployment source must be set to **GitHub Actions** for that workflow to publish.

## Important scope boundary

The upstream repository publishes the orb and hand-gesture UI code. Its creator describes the real-time voice agent and Android device-control layer as proprietary, not included in this repository. JARVIS's local commands remain in the existing page; general cloud reasoning and native Android device control are separate future modules and are not implied to be implemented by the orb.

## Camera and offline behavior

Hand gestures are optional and require explicit camera permission plus HTTPS. Three.js and MediaPipe packages are bundled into the web build; MediaPipe's WASM and hand model are loaded from upstream URLs when camera tracking is enabled, so the first use of hand tracking requires internet access. WebGL must be available for the 3D scene; JARVIS keeps the CSS core fallback if WebGL initialization fails.
