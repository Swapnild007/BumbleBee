import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/*
 * JARVIS 3D core engine.
 * Implementation techniques adapted from the MIT-licensed ULTRON Orb UI
 * project: layered spherical shells, orbital particles, scan rings, and
 * interactive orbit controls. JARVIS layout, colors, and product UI remain
 * independently designed in index.html.
 */
const host = document.querySelector("#core");
if (!host) throw new Error("JARVIS core mount not found");

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
  console.warn("JARVIS 3D renderer unavailable; keeping CSS fallback.", error);
}

if (renderer) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 0.15, 7.4);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.className = "jarvis-webgl";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.zoomSpeed = 0.65;
  controls.minDistance = 5.4;
  controls.maxDistance = 10;
  controls.rotateSpeed = 0.55;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.45;
  controls.target.set(0, 0, 0);
  controls.update();

  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const cyan = 0x67e8ff;
  const ice = 0xb9f8ff;
  const blue = 0x237fa5;

  function wireSphere(radius, segments, color, opacity, scale = [1, 1, 1]) {
    const geometry = new THREE.SphereGeometry(radius, segments, Math.max(8, Math.floor(segments * 0.68)));
    const material = new THREE.MeshBasicMaterial({
      color, wireframe: true, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(...scale);
    coreGroup.add(mesh);
    return mesh;
  }

  // Fine technical shell plus two offset shells create real 3D depth.
  const outerShell = wireSphere(1.72, 32, cyan, 0.27, [1, 1, 0.9]);
  const midShell = wireSphere(1.49, 24, 0x45bde2, 0.22, [0.96, 1.02, 1]);
  const innerShell = wireSphere(1.12, 20, ice, 0.15, [1, 0.97, 1.03]);

  // Bright latitude/longitude guide rings.
  const ringMaterials = [];
  function makeRing(radius, tilt, opacity, tube = 0.009) {
    const geometry = new THREE.TorusGeometry(radius, tube, 5, 128);
    const material = new THREE.MeshBasicMaterial({
      color: cyan, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.set(...tilt);
    coreGroup.add(ring);
    ringMaterials.push(material);
    return ring;
  }
  const ringA = makeRing(1.92, [0.9, 0.1, 0.22], 0.52, 0.008);
  const ringB = makeRing(1.57, [1.25, 0.4, -0.35], 0.36, 0.006);
  const ringC = makeRing(1.28, [0.25, 0.9, 0.75], 0.24, 0.005);

  // Energy core: animated shader, not a flat CSS gradient.
  const coreGeometry = new THREE.SphereGeometry(0.79, 48, 36);
  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uState: { value: 0 },
      uTint: { value: new THREE.Color(cyan) }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uState;
      uniform vec3 uTint;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 n = normalize(vNormal);
        float fresnel = pow(1.0 - abs(dot(n, vec3(0.0, 0.0, 1.0))), 2.0);
        float bands = 0.5 + 0.5 * sin(vPosition.y * 19.0 + uTime * (1.2 + uState * 2.0) + sin(vPosition.x * 9.0));
        float pulse = 0.84 + 0.16 * sin(uTime * (1.8 + uState * 3.0));
        vec3 deep = vec3(0.008, 0.035, 0.06);
        vec3 color = mix(deep, uTint, 0.18 + bands * 0.2);
        color += uTint * fresnel * (0.7 + bands * 0.7);
        color += vec3(0.3, 0.88, 1.0) * pow(max(0.0, 1.0 - length(vPosition.xy) / 0.8), 4.0) * 0.6;
        gl_FragColor = vec4(color * pulse, 0.94);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: true
  });
  const energyCore = new THREE.Mesh(coreGeometry, coreMaterial);
  coreGroup.add(energyCore);

  // Fine inner filament loops around the luminous center.
  const filaments = [];
  for (let i = 0; i < 5; i++) {
    const curve = new THREE.EllipseCurve(0, 0, 0.48 + i * 0.045, 0.17 + i * 0.025, 0, Math.PI * 2, false, i * 0.2);
    const points = curve.getPoints(100).map(p => new THREE.Vector3(p.x, p.y, (i - 2) * 0.055));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: i % 2 ? cyan : ice, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const line = new THREE.LineLoop(geometry, material);
    line.rotation.set(i * 0.45, i * 0.27, i * 0.62);
    coreGroup.add(line);
    filaments.push(line);
  }

  // Reusable point geometry keeps mobile draw calls low.
  const particleCount = /Android/i.test(navigator.userAgent) ? 520 : 850;
  const positions = new Float32Array(particleCount * 3);
  const phases = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const r = 1.95 + Math.random() * 1.45;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    phases[i] = Math.random() * Math.PI * 2;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x7eeaff, size: 0.022, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Sparse orbiting signal nodes.
  const nodeGeometry = new THREE.IcosahedronGeometry(0.035, 1);
  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: ice, transparent: true, opacity: 0.92,
    blending: THREE.AdditiveBlending
  });
  const nodes = [];
  for (let i = 0; i < 13; i++) {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    node.userData = {
      angle: (i / 13) * Math.PI * 2,
      radius: 1.82 + (i % 3) * 0.16,
      speed: (i % 2 ? 1 : -1) * (0.12 + (i % 5) * 0.018),
      tilt: (i % 4) * 0.32
    };
    nodes.push(node);
    scene.add(node);
  }

  // A subtle backlight halo, all geometry is generated locally.
  const haloGeometry = new THREE.SphereGeometry(2.0, 32, 24);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: blue, side: THREE.BackSide, transparent: true, opacity: 0.055,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  coreGroup.add(halo);

  let stateLevel = 0;
  let visible = true;
  let frame = 0;
  let previous = 0;
  const clock = new THREE.Clock();
  const reducedQuality = /Android/i.test(navigator.userAgent);
  let width = 1, height = 1;

  function resize() {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    camera.aspect = width / height;
    camera.fov = width < 190 ? 43 : 38;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  const visibilityObserver = new IntersectionObserver(entries => {
    visible = Boolean(entries[0]?.isIntersecting);
  }, { threshold: 0.01 });
  visibilityObserver.observe(host);

  function animate(now) {
    frame = requestAnimationFrame(animate);
    if (!visible || document.hidden) return;
    // Cap animation work on mobile while retaining smooth motion.
    const frameInterval = reducedQuality ? 1000 / 40 : 1000 / 60;
    if (now - previous < frameInterval) return;
    previous = now;
    const t = clock.getElapsedTime();

    outerShell.rotation.y = t * 0.055;
    outerShell.rotation.x = Math.sin(t * 0.13) * 0.08;
    midShell.rotation.y = -t * 0.075;
    midShell.rotation.z = Math.sin(t * 0.17) * 0.09;
    innerShell.rotation.y = t * 0.11;
    ringA.rotation.z += 0.0018;
    ringB.rotation.x += 0.0012;
    ringC.rotation.y -= 0.0015;
    energyCore.rotation.y = t * 0.045;
    coreMaterial.uniforms.uTime.value = t;
    coreMaterial.uniforms.uState.value = stateLevel;

    filaments.forEach((line, i) => {
      line.rotation.x += 0.0007 * (i + 1);
      line.rotation.y -= 0.00045 * (i + 1);
    });
    particles.rotation.y = t * 0.012;
    particles.rotation.x = Math.sin(t * 0.08) * 0.05;
    particleMaterial.opacity = 0.5 + 0.14 * Math.sin(t * 0.7);
    nodes.forEach(node => {
      const d = node.userData;
      const a = d.angle + t * d.speed;
      node.position.set(
        Math.cos(a) * d.radius,
        Math.sin(a * 1.4) * 0.55 + Math.sin(d.tilt) * 0.3,
        Math.sin(a) * d.radius * 0.65
      );
    });
    controls.update();
    renderer.render(scene, camera);
  }

  const onState = event => {
    const text = String(event.detail?.state || "").toLowerCase();
    stateLevel = text.includes("listening") ? 1 : text.includes("thinking") ? 0.7 : text.includes("speaking") ? 0.9 : 0;
    controls.autoRotate = !reducedMotion && stateLevel === 0;
    renderer.domElement.classList.toggle("is-listening", stateLevel > 0.8);
  };
  window.addEventListener("jarvis-core-state", onState);

  host.classList.add("webgl-ready");
  requestAnimationFrame(animate);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      previous = 0;
      clock.getDelta();
    }
  });

  window.jarvisOrb = {
    reset() {
      controls.reset();
      controls.target.set(0, 0, 0);
      camera.position.set(0, 0.15, 7.4);
      controls.update();
    },
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
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
