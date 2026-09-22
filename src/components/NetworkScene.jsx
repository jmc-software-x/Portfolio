import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Particle morph scene.
 * ~7k glowing particles morph between shapes as the visitor scrolls:
 *   0 · DNA double helix  (salud / healthcare)
 *   1 · Global network     (estrategia / governance)
 *   2 · Data cube lattice  (arquitectura / datos)
 *   3 · Signal wave field  (operación / resultados)
 * Particles are pushed away by the pointer and the whole field reacts to
 * pointer parallax. Rendering pauses when the tab is hidden.
 */

const COUNT = 7000;

function helix(n) {
  const out = new Float32Array(n * 3);
  const turns = 5.5;
  const height = 5.8;
  const r = 1.15;
  const strandShare = 0.62; // 62% of points on the two strands, rest on rungs
  for (let i = 0; i < n; i++) {
    const u = Math.random();
    let x, y, z;
    if (i < n * strandShare) {
      const strand = i % 2;
      const t = u * turns * Math.PI * 2;
      const phase = strand * Math.PI;
      const jitter = 0.07;
      x = Math.cos(t + phase) * r + (Math.random() - 0.5) * jitter;
      z = Math.sin(t + phase) * r + (Math.random() - 0.5) * jitter;
      y = (u - 0.5) * height + (Math.random() - 0.5) * jitter;
    } else {
      const rungs = 44;
      const k = Math.floor(Math.random() * rungs);
      const t = ((k + 0.5) / rungs) * turns * Math.PI * 2;
      const s = Math.random() * 2 - 1;
      x = Math.cos(t) * r * s;
      z = Math.sin(t) * r * s;
      y = ((k + 0.5) / rungs - 0.5) * height;
    }
    out.set([x, y, z], i * 3);
  }
  return out;
}

function sphereNet(n) {
  const out = new Float32Array(n * 3);
  const R = 2.6;
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    // 70% on surface (fibonacci), 30% as "arcs" between random points
    if (i < n * 0.7) {
      const y = 1 - (i / (n * 0.7 - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const t = phi * i;
      out.set([Math.cos(t) * rad * R, y * R, Math.sin(t) * rad * R], i * 3);
    } else {
      const a = new THREE.Vector3().randomDirection();
      const b = new THREE.Vector3().randomDirection();
      const s = Math.random();
      const p = a.lerp(b, s).normalize().multiplyScalar(R * (1 + Math.sin(s * Math.PI) * 0.35));
      out.set([p.x, p.y, p.z], i * 3);
    }
  }
  return out;
}

function cube(n) {
  const out = new Float32Array(n * 3);
  const size = 3.4;
  const g = 6; // grid lines per axis
  for (let i = 0; i < n; i++) {
    const axis = i % 3;
    const a = (Math.floor(Math.random() * (g + 1)) / g - 0.5) * size;
    const b = (Math.floor(Math.random() * (g + 1)) / g - 0.5) * size;
    const c = (Math.random() - 0.5) * size;
    const p = axis === 0 ? [c, a, b] : axis === 1 ? [a, c, b] : [a, b, c];
    out.set(p, i * 3);
  }
  return out;
}

function wave(n) {
  const out = new Float32Array(n * 3);
  const side = Math.ceil(Math.sqrt(n));
  const span = 9;
  for (let i = 0; i < n; i++) {
    const gx = (i % side) / side - 0.5;
    const gz = Math.floor(i / side) / side - 0.5;
    out.set([gx * span, 0, gz * span], i * 3);
  }
  return out;
}

const vert = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixel;
  uniform float uScale;
  uniform float uWave;
  varying float vAlpha;
  varying float vMix;
  void main() {
    vec3 p = position;
    // living "breathing" motion
    p += 0.035 * vec3(sin(uTime * 1.3 + aSeed * 6.28), cos(uTime * 1.1 + aSeed * 9.1), sin(uTime * 0.9 + aSeed * 3.7));
    // signal wave when on the wave shape
    p.y += uWave * (sin(p.x * 1.1 + uTime * 1.6) * 0.45 + cos(p.z * 0.9 + uTime * 1.2) * 0.35);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixel * uScale * 0.055 / -mv.z;
    vAlpha = smoothstep(18.0, 4.0, -mv.z);
    vMix = aSeed;
  }
`;

const frag = /* glsl */ `
  uniform vec3 uColA;
  uniform vec3 uColB;
  uniform vec3 uColC;
  varying float vAlpha;
  varying float vMix;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uColA, uColB, vMix);
    if (vMix > 0.93) col = uColC;
    gl_FragColor = vec4(col, glow * glow * vAlpha);
  }
`;

export default function NetworkScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    } catch (e) {
      mount.classList.add("scene--fallback");
      return undefined;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmall = window.innerWidth < 760;
    const count = isSmall ? 4200 : COUNT;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const root = new THREE.Group();
    scene.add(root);

    const shapes = [helix(count), sphereNet(count), cube(count), wave(count)];
    const current = new Float32Array(shapes[0]);
    const velocity = new Float32Array(count * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(current, 3));
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      sizes[i] = 0.8 + Math.pow(Math.random(), 3) * 3.2;
      seeds[i] = Math.random();
    }
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const uniforms = {
      uTime: { value: 0 },
      uPixel: { value: renderer.getPixelRatio() },
      uScale: { value: 450 },
      uWave: { value: 0 },
      uColA: { value: new THREE.Color("#2dd4bf") },
      uColB: { value: new THREE.Color("#38bdf8") },
      uColC: { value: new THREE.Color("#fbbf24") },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    root.add(points);

    // faint orbit rings for depth
    const rings = [];
    [
      [3.6, 1.2, 0.3, "#2dd4bf", 0.18],
      [4.3, -0.4, 1.0, "#38bdf8", 0.1],
    ].forEach(([r, rx, rz, c, o]) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.006, 6, 220),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o })
      );
      m.rotation.set(rx, 0, rz);
      root.add(m);
      rings.push(m);
    });

    // background dust
    const DUST = 700;
    const dPos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dPos.set([(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 24, -8 - Math.random() * 20], i * 3);
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    const dMat = new THREE.PointsMaterial({ size: 0.05, color: 0x9fb4d9, transparent: true, opacity: 0.5, depthWrite: false });
    const dust = new THREE.Points(dGeo, dMat);
    scene.add(dust);

    // --- interaction state
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };
    const ndc = new THREE.Vector2(10, 10);
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    const localHit = new THREE.Vector3();
    let scrollP = 0;
    let wide = true;

    const layout = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      wide = w / h > 1.1;
      uniforms.uScale.value = h / 2;
    };
    const onPointer = (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      ndc.set(pointer.tx, -pointer.ty);
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollP = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    };
    layout();
    onScroll();
    window.addEventListener("resize", layout);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    const clock = new THREE.Clock();
    let raf = 0;
    const smooth = { p: 0 };
    const inv = new THREE.Matrix4();

    const render = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      uniforms.uTime.value = reduceMotion ? 0 : t;

      // which pair of shapes, and how far between them
      smooth.p += (scrollP - smooth.p) * 0.08;
      const seg = smooth.p * (shapes.length - 1);
      const i0 = Math.min(Math.floor(seg), shapes.length - 2);
      let f = seg - i0;
      f = f * f * (3 - 2 * f); // ease
      const A = shapes[i0];
      const B = shapes[i0 + 1];
      uniforms.uWave.value = i0 === shapes.length - 2 ? f : 0;

      // pointer in local space of the particle group
      let hasHit = false;
      if (pointer.active && !reduceMotion) {
        raycaster.setFromCamera(ndc, camera);
        if (raycaster.ray.intersectPlane(plane, hit)) {
          inv.copy(root.matrixWorld).invert();
          localHit.copy(hit).applyMatrix4(inv);
          hasHit = true;
        }
      }

      const k = 5.5 * dt; // spring towards target
      const damp = Math.pow(0.02, dt);
      for (let i = 0; i < count; i++) {
        const j = i * 3;
        const tx = A[j] + (B[j] - A[j]) * f;
        const ty = A[j + 1] + (B[j + 1] - A[j + 1]) * f;
        const tz = A[j + 2] + (B[j + 2] - A[j + 2]) * f;
        velocity[j] += (tx - current[j]) * k;
        velocity[j + 1] += (ty - current[j + 1]) * k;
        velocity[j + 2] += (tz - current[j + 2]) * k;
        if (hasHit) {
          const dx = current[j] - localHit.x;
          const dy = current[j + 1] - localHit.y;
          const dz = current[j + 2] - localHit.z;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < 1.6) {
            const push = (1.6 - d2) * 0.9 * dt * 10;
            const inv = 1 / Math.sqrt(d2 + 0.0001);
            velocity[j] += dx * inv * push;
            velocity[j + 1] += dy * inv * push;
            velocity[j + 2] += dz * inv * push;
          }
        }
        velocity[j] *= damp;
        velocity[j + 1] *= damp;
        velocity[j + 2] *= damp;
        current[j] += velocity[j] * dt * 6;
        current[j + 1] += velocity[j + 1] * dt * 6;
        current[j + 2] += velocity[j + 2] * dt * 6;
      }
      geo.attributes.position.needsUpdate = true;

      // layout: right side on wide screens in the hero, centred later
      const heroFactor = Math.max(0, 1 - smooth.p * 6);
      const targetX = wide ? 2.9 * heroFactor + 1.8 * (1 - heroFactor) : 0;
      const targetY = wide ? 0 : 1.4 * heroFactor;
      root.position.x += (targetX - root.position.x) * 0.06;
      root.position.y += (targetY - root.position.y) * 0.06;
      root.scale.setScalar(wide ? 1 : 0.72);

      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      const spin = reduceMotion ? 0 : t * 0.18;
      root.rotation.y = spin + pointer.x * 0.45;
      root.rotation.x = pointer.y * 0.25 + (i0 === shapes.length - 2 ? f * 0.55 : 0);
      root.rotation.z = i0 === 0 ? (1 - f) * 0.35 : 0; // tilt the helix
      rings.forEach((r, n) => (r.rotation.z += (n ? -1 : 1) * 0.0015));
      dust.position.x = -pointer.x * 0.6;
      dust.position.y = pointer.y * 0.4;

      renderer.render(scene, camera);
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!document.hidden) render();
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", layout);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      geo.dispose();
      mat.dispose();
      dGeo.dispose();
      dMat.dispose();
      rings.forEach((r) => {
        r.geometry.dispose();
        r.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="scene" aria-hidden="true" />;
}
