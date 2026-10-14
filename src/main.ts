import { createOrbScene, type OrbSceneApi } from "./lib/orbScene";
import { HandTracker, type TrackerStatus } from "./lib/handTracker";

const core = document.querySelector<HTMLElement>("#core");
if (core) {
  let scene: OrbSceneApi | null = null;
  try {
    scene = createOrbScene(core);
    core.classList.add("webgl-ready");
  } catch (error) {
    console.error("JARVIS WebGL core could not start; keeping the CSS fallback.", error);
  }

  const settings = document.querySelector<HTMLElement>("#settingsPage");
  if (settings) {
    const panel = document.createElement("div");
    panel.className = "panel gesture-panel";
    panel.innerHTML = `
      <div class="panel-title">3D CORE INTERACTION</div>
      <p class="page-intro">Rotate the core by dragging it, pinch to zoom, or optionally enable camera-based hand gestures. Camera access is opt-in.</p>
      <div class="gesture-actions">
        <button class="btn primary" id="gestureToggle" type="button">Enable hand gestures</button>
        <button class="btn" id="gestureReset" type="button">Reset core view</button>
      </div>
      <div class="gesture-video-wrap" id="gestureVideoWrap">
        <video id="gestureVideo" muted playsinline></video>
        <canvas id="gestureOverlay" width="208" height="156"></canvas>
      </div>
      <div class="gesture-status" id="gestureStatus" role="status">Touch controls are ready. Camera is off.</div>
    `;
    const intelligencePanel = settings.querySelector(".panel");
    if (intelligencePanel) intelligencePanel.insertAdjacentElement("afterend", panel);

    const video = panel.querySelector<HTMLVideoElement>("#gestureVideo")!;
    const overlay = panel.querySelector<HTMLCanvasElement>("#gestureOverlay")!;
    const wrap = panel.querySelector<HTMLElement>("#gestureVideoWrap")!;
    const toggle = panel.querySelector<HTMLButtonElement>("#gestureToggle")!;
    const reset = panel.querySelector<HTMLButtonElement>("#gestureReset")!;
    const status = panel.querySelector<HTMLElement>("#gestureStatus")!;
    let tracker: HandTracker | null = null;
    let starting = false;

    const showStatus = (value: TrackerStatus) => {
      const mode = value.mode === "spin" ? "SPIN" : value.mode === "zoom" ? "ZOOM" : "STANDBY";
      status.textContent = value.hands ? `${value.hands} hand(s) detected · ${mode}` : "Camera on · show your hands and pinch to control the core.";
    };

    const stop = () => {
      tracker?.stop();
      tracker = null;
      starting = false;
      wrap.classList.remove("active");
      toggle.disabled = false;
      toggle.textContent = "Enable hand gestures";
      status.textContent = "Camera is off. Touch controls remain available.";
    };

    toggle.addEventListener("click", async () => {
      if (tracker || starting) {
        stop();
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        status.textContent = "Camera tracking needs HTTPS and a browser with camera support.";
        return;
      }
      starting = true;
      toggle.disabled = true;
      toggle.textContent = "Starting camera…";
      status.textContent = "Requesting camera permission…";
      wrap.classList.add("active");
      const instance = new HandTracker(video, overlay, {
        onRotate: (dt, dp) => scene?.rotateBy(dt, dp),
        onZoom: factor => scene?.zoomBy(factor),
        onStatus: showStatus
      });
      try {
        await instance.start();
        tracker = instance;
        toggle.disabled = false;
        toggle.textContent = "Disable hand gestures";
        status.textContent = "Camera on · pinch with one hand to rotate; pinch with both hands to zoom.";
      } catch (error) {
        instance.stop();
        starting = false;
        wrap.classList.remove("active");
        toggle.disabled = false;
        toggle.textContent = "Enable hand gestures";
        status.textContent = error instanceof DOMException && error.name === "NotAllowedError"
          ? "Camera permission was denied. Enable it in your browser settings to use gestures."
          : "Gesture tracking could not initialize. Touch controls are still available.";
        console.warn("JARVIS hand tracking unavailable", error);
      }
    });
    reset.addEventListener("click", () => scene?.resetView());
    window.addEventListener("pagehide", stop, { once: true });
  }

  window.addEventListener("keydown", event => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.key.toLowerCase() === "r") scene?.resetView();
    if (event.key === "+" || event.key === "=") scene?.zoomIn();
    if (event.key === "-" || event.key === "_") scene?.zoomOut();
  });
}
