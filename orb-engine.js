import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/*
 * JARVIS character stage.
 * The scene loads a CC0 mecha asset and recolors it into an original
 * yellow/graphite/cyan JARVIS visual treatment. A procedural character is
 * displayed first, so the stage remains useful if the remote model is offline.
 * Model source and license: RamonLinares/atlas-09, public/models/atlas-09.glb,
 * CC0 1.0 Universal. This is an original JARVIS interface, not an official
 * Transformers/Bumblebee asset.
 */
const host = document.querySelector("#core");
if (!host) throw new Error("JARVIS character mount not found");

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: !/Android/i.test(navigator.userAgent),
    powerPreference: "low-power",
    stencil: false,
    depth: true
  });
} catch (error) {
  console.warn("JARVIS 3D stage unavailable; CSS stage remains visible.", error);
}

if (renderer) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 2.35, 8.7);
  camera.lookAt(0, 1.85, 0);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.domElement.className = "jarvis-webgl";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xb9f5ff, 0x10151a, 2.0));
  const key = new THREE.DirectionalLight(0xffe4a1, 3.2);
  key.position.set(-3, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x39d9ff, 4.0);
  rim.position.set(4, 3, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffb829, 1.4);
  fill.position.set(1, 1, 5);
  scene.add(fill);

  const stage = new THREE.Group();
  scene.add(stage);

  const floorRingMaterial = new THREE.MeshBasicMaterial({
    color: 0x36c8dc, transparent: true, opacity: 0.22, side: THREE.DoubleSide
  });
  const floorRing = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.012, 5, 96), floorRingMaterial);
  floorRing.rotation.x = Math.PI / 2;
  floorRing.position.y = 0.08;
  stage.add(floorRing);
  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.12, 0.006, 4, 96),
    new THREE.MeshBasicMaterial({ color: 0xf2c64b, transparent: true, opacity: 0.18 })
  );
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = 0.09;
  stage.add(innerRing);

  const dustCount = /Android/i.test(navigator.userAgent) ? 55 : 100;
  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 6.5;
    dustPositions[i * 3 + 1] = Math.random() * 4.5;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 3.0 - 0.8;
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({
    color: 0x8aefff, size: 0.018, transparent: true, opacity: 0.35,
    sizeAttenuation: true, depthWrite: false
  }));
  stage.add(dust);

  const armor = new THREE.MeshStandardMaterial({
    color: 0xe5b52f, metalness: 0.72, roughness: 0.29
  });
  const armorLight = new THREE.MeshStandardMaterial({
    color: 0xffd75d, metalness: 0.64, roughness: 0.25
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x11191e, metalness: 0.84, roughness: 0.35
  });
  const joint = new THREE.MeshStandardMaterial({
    color: 0x303a40, metalness: 0.72, roughness: 0.42
  });
  const optic = new THREE.MeshStandardMaterial({
    color: 0x72f4ff, emissive: 0x18cce8, emissiveIntensity: 3.0,
    metalness: 0.1, roughness: 0.18
  });
  const trim = new THREE.MeshStandardMaterial({
    color: 0x8fa3ab, metalness: 0.85, roughness: 0.24
  });

  function box(group, material, size, pos, bevel = false) {
    const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (bevel) mesh.rotation.z = 0.02;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  function cylinder(group, material, radiusTop, radiusBottom, height, pos, segments = 10) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  }
  function buildFallbackMech() {
    const bot = new THREE.Group();
    const torso = new THREE.Group();
    bot.add(torso);
    // Compact original mecha silhouette, used only until the CC0 model arrives.
    box(torso, dark, [0.82, 0.68, 0.4], [0, 2.15, 0]);
    box(torso, armor, [0.96, 0.56, 0.44], [0, 2.48, 0.025], true);
    box(torso, armorLight, [0.57, 0.16, 0.12], [0, 2.57, 0.255]);
    box(torso, dark, [0.43, 0.28, 0.08], [0, 2.29, 0.255]);
    box(torso, optic, [0.24, 0.055, 0.03], [0, 2.31, 0.31]);
    box(torso, armorLight, [0.18, 0.13, 0.13], [-0.29, 2.38, 0.26]);
    box(torso, armorLight, [0.18, 0.13, 0.13], [0.29, 2.38, 0.26]);
    box(torso, dark, [0.42, 0.35, 0.34], [0, 1.68, 0]);
    box(torso, armor, [0.62, 0.18, 0.36], [0, 1.8, 0.02]);
    // Head and brow.
    cylinder(torso, joint, 0.12, 0.15, 0.22, [0, 2.91, 0], 8);
    box(torso, dark, [0.42, 0.37, 0.33], [0, 3.12, 0]);
    box(torso, armor, [0.48, 0.16, 0.36], [0, 3.29, 0.015]);
    box(torso, dark, [0.31, 0.11, 0.05], [0, 3.12, 0.18]);
    box(torso, optic, [0.105, 0.035, 0.025], [-0.09, 3.12, 0.213]);
    box(torso, optic, [0.105, 0.035, 0.025], [0.09, 3.12, 0.213]);
    box(torso, armorLight, [0.11, 0.16, 0.16], [0, 3.42, 0]);
    // Shoulder blocks and arms.
    for (const side of [-1, 1]) {
      const x = side * 0.66;
      box(torso, dark, [0.3, 0.3, 0.34], [x, 2.47, 0]);
      box(torso, armor, [0.42, 0.31, 0.4], [x, 2.57, 0.015], true);
      box(torso, armorLight, [0.24, 0.09, 0.07], [x, 2.59, 0.23]);
      cylinder(torso, joint, 0.13, 0.13, 0.2, [side * 0.68, 2.23, 0], 9);
      box(torso, armor, [0.24, 0.45, 0.26], [side * 0.7, 1.98, 0]);
      box(torso, dark, [0.27, 0.17, 0.28], [side * 0.72, 1.69, 0]);
      box(torso, armorLight, [0.25, 0.25, 0.28], [side * 0.73, 1.49, 0.01]);
      box(torso, dark, [0.24, 0.18, 0.25], [side * 0.73, 1.34, 0.02]);
      // Thighs, knees, shins, and wide planted feet.
      box(torso, armor, [0.31, 0.47, 0.32], [side * 0.28, 1.34, 0]);
      box(torso, dark, [0.32, 0.17, 0.34], [side * 0.28, 1.06, 0.02]);
      box(torso, armor, [0.32, 0.49, 0.35], [side * 0.29, 0.79, 0]);
      box(torso, armorLight, [0.16, 0.19, 0.06], [side * 0.29, 0.79, 0.19]);
      box(torso, dark, [0.4, 0.19, 0.56], [side * 0.29, 0.43, 0.08]);
      box(torso, armor, [0.42, 0.11, 0.42], [side * 0.29, 0.49, 0.1]);
      // Side vents and small metallic bolts.
      for (let i = 0; i < 3; i++) box(torso, dark, [0.045, 0.22, 0.025], [side * 0.68, 2.0 + i * 0.055, 0.143]);
      cylinder(torso, trim, 0.035, 0.035, 0.025, [side * 0.44, 2.56, 0.25], 8).rotation.x = Math.PI / 2;
    }
    bot.position.y = 0;
    return bot;
  }

  const fallback = buildFallbackMech();
  stage.add(fallback);
  let character = fallback;
  let mixer = null;
  let stateLevel = 0;
  let time = 0;

  function recolorModel(root) {
    const blueWords = /eye|optic|visor|glass|emissive|blue light/i;
    const darkWords = /black|rubber|tire|joint|inner|dark|carbon|shadow|underside|wheel/i;
    root.traverse(object => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const mat of materials) {
        if (!mat || !mat.color) continue;
        const name = String(mat.name || object.name || "");
        const original = mat.color.clone();
        const luminance = original.r * 0.2126 + original.g * 0.7152 + original.b * 0.0722;
        if (blueWords.test(name)) {
          mat.color.set("#b6faff");
          if ("emissive" in mat) {
            mat.emissive.set("#16cde8");
            mat.emissiveIntensity = 2.2;
          }
        } else if (darkWords.test(name) || luminance < 0.16) {
          mat.color.set("#182126");
        } else {
          mat.color.set("#e6b42e");
          if ("metalness" in mat) mat.metalness = Math.max(mat.metalness || 0, 0.55);
          if ("roughness" in mat) mat.roughness = Math.min(mat.roughness ?? 0.5, 0.38);
        }
      }
    });
  }

  function fitModel(root) {
    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 3.55 / Math.max(size.y, size.x * 0.62, 0.1);
    root.scale.setScalar(scale);
    root.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    root.position.y += 0.06;
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = true;
  controls.rotateSpeed = 0.38;
  controls.minPolarAngle = Math.PI * 0.34;
  controls.maxPolarAngle = Math.PI * 0.57;
  controls.target.set(0, 1.85, 0);
  controls.update();

  const loader = new GLTFLoader();
  loader.load(
    "https://raw.githubusercontent.com/RamonLinares/atlas-09/main/public/models/atlas-09.glb",
    gltf => {
      if (!host.isConnected) return;
      const model = gltf.scene;
      recolorModel(model);
      fitModel(model);
      model.position.x = 0;
      model.rotation.y = 0;
      stage.remove(fallback);
      stage.add(model);
      character = model;
      if (gltf.animations?.length) {
        mixer = new THREE.AnimationMixer(model);
        const idle = gltf.animations.find(clip => /idle|stand|rest/i.test(clip.name)) || gltf.animations[0];
        mixer.clipAction(idle).play();
      }
      console.info("JARVIS character model loaded.");
    },
    undefined,
    error => console.warn("Remote mecha unavailable; using local procedural character.", error)
  );

  let frame = 0;
  let previous = 0;
  function resize() {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  function animate(now = 0) {
    frame = requestAnimationFrame(animate);
    const delta = Math.min(previous ? (now - previous) / 1000 : 0.016, 0.05);
    previous = now;
    time += delta;
    if (mixer) mixer.update(delta);
    if (!reducedMotion && character === fallback) {
      fallback.position.y = Math.sin(time * 1.1) * 0.035;
      fallback.rotation.y = Math.sin(time * 0.35) * 0.08;
    } else if (!reducedMotion && character !== fallback) {
      character.rotation.y += delta * (stateLevel ? 0.025 : 0.055);
    }
    floorRing.rotation.z = Math.sin(time * 0.25) * 0.025;
    innerRing.rotation.z = -time * 0.08;
    dust.rotation.y = time * 0.012;
    optic.emissiveIntensity = 2.4 + Math.sin(time * 2.4) * 0.35 + stateLevel * 1.2;
    controls.update();
    renderer.render(scene, camera);
  }

  const onState = event => {
    const text = String(event.detail?.state || "").toLowerCase();
    stateLevel = text.includes("listening") ? 1 : text.includes("thinking") ? 0.75 : text.includes("speaking") ? 0.9 : 0;
    renderer.domElement.classList.toggle("is-listening", stateLevel > 0.8);
  };
  window.addEventListener("jarvis-core-state", onState);
  requestAnimationFrame(animate);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) previous = 0;
  });

  window.jarvisCharacter = {
    reset() {
      controls.reset();
      camera.position.set(0, 2.35, 8.7);
      controls.target.set(0, 1.85, 0);
      controls.update();
    },
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("jarvis-core-state", onState);
      controls.dispose();
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
      renderer.dispose();
    }
  };
}
