import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * "Digital nervous system": a globe of data nodes linked to their nearest
 * neighbours, with signals travelling across the network, orbit rings and a
 * starfield. Reacts to pointer (parallax) and scroll (rotation / zoom).
 */
const NODE_COUNT = 260;
const LINKS_PER_NODE = 3;
const PULSES = 70;
const RADIUS = 2.2;

const TEAL = new THREE.Color("#2dd4bf");
const CYAN = new THREE.Color("#38bdf8");
const AMBER = new THREE.Color("#fbbf24");

function fibonacciSphere(n, r) {
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const t = phi * i;
    const jitter = 1 + (Math.random() - 0.5) * 0.08;
    pts.push(new THREE.Vector3(Math.cos(t) * rad * r * jitter, y * r * jitter, Math.sin(t) * rad * r * jitter));
  }
  return pts;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.6)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function NetworkScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) {
      mount.classList.add("scene--fallback");
      return undefined;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060b18, 0.06);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const root = new THREE.Group();
    scene.add(root);
    const globe = new THREE.Group();
    root.add(globe);

    const sprite = glowTexture();
    const disposables = [sprite];
    const track = (o) => {
      disposables.push(o);
      return o;
    };

    // --- nodes
    const nodes = fibonacciSphere(NODE_COUNT, RADIUS);
    const nodePos = new Float32Array(NODE_COUNT * 3);
    const nodeCol = new Float32Array(NODE_COUNT * 3);
    nodes.forEach((p, i) => {
      nodePos.set([p.x, p.y, p.z], i * 3);
      const c = Math.random() < 0.12 ? AMBER : TEAL.clone().lerp(CYAN, Math.random());
      nodeCol.set([c.r, c.g, c.b], i * 3);
    });
    const nodeGeo = track(new THREE.BufferGeometry());
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute("color", new THREE.BufferAttribute(nodeCol, 3));
    const nodeMat = track(
      new THREE.PointsMaterial({
        size: 0.13,
        map: sprite,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    globe.add(new THREE.Points(nodeGeo, nodeMat));

    // --- edges (nearest neighbours)
    const edges = [];
    const seen = new Set();
    nodes.forEach((a, i) => {
      const nearest = nodes
        .map((b, j) => ({ j, d: a.distanceToSquared(b) }))
        .filter((o) => o.j !== i)
        .sort((x, y) => x.d - y.d)
        .slice(0, LINKS_PER_NODE);
      nearest.forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([i, j]);
        }
      });
    });
    const edgePos = new Float32Array(edges.length * 6);
    edges.forEach(([i, j], k) => {
      edgePos.set([nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z], k * 6);
    });
    const edgeGeo = track(new THREE.BufferGeometry());
    edgeGeo.setAttribute("position", new THREE.BufferAttribute(edgePos, 3));
    const edgeMat = track(
      new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    globe.add(new THREE.LineSegments(edgeGeo, edgeMat));

    // --- inner core
    const coreGeo = track(new THREE.IcosahedronGeometry(RADIUS * 0.55, 1));
    const coreMat = track(new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.12 }));
    const core = new THREE.Mesh(coreGeo, coreMat);
    globe.add(core);

    // --- signals travelling along edges
    const pulseState = Array.from({ length: PULSES }, () => ({
      edge: Math.floor(Math.random() * edges.length),
      t: Math.random(),
      speed: 0.25 + Math.random() * 0.6,
    }));
    const pulsePos = new Float32Array(PULSES * 3);
    const pulseGeo = track(new THREE.BufferGeometry());
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
    const pulseMat = track(
      new THREE.PointsMaterial({
        size: 0.2,
        map: sprite,
        color: AMBER,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    globe.add(new THREE.Points(pulseGeo, pulseMat));

    // --- orbit rings
    const rings = [];
    [
      [RADIUS * 1.35, 0.9, 0.3, TEAL, 0.25],
      [RADIUS * 1.6, -0.5, 1.1, CYAN, 0.16],
      [RADIUS * 1.9, 1.3, -0.4, AMBER, 0.12],
    ].forEach(([r, rx, rz, color, opacity]) => {
      const g = track(new THREE.TorusGeometry(r, 0.006, 8, 200));
      const m = track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity }));
      const ring = new THREE.Mesh(g, m);
      ring.rotation.set(rx, 0, rz);
      root.add(ring);
      rings.push(ring);
    });

    // --- starfield
    const STARS = 900;
    const starPos = new Float32Array(STARS * 3);
    for (let i = 0; i < STARS; i++) {
      const r = 12 + Math.random() * 30;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)], i * 3);
    }
    const starGeo = track(new THREE.BufferGeometry());
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = track(new THREE.PointsMaterial({ size: 0.05, color: 0x9fb4d9, transparent: true, opacity: 0.55, depthWrite: false }));
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // --- layout / interaction
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollP = 0;

    const layout = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const wide = w / h > 1.1;
      root.position.x = wide ? 2.4 : 0;
      root.position.y = wide ? 0 : 1.1;
      root.scale.setScalar(wide ? 1 : 0.78);
    };
    const onPointer = (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollP = max > 0 ? window.scrollY / max : 0;
    };
    layout();
    onScroll();
    window.addEventListener("resize", layout);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;

    const render = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const speed = reduceMotion ? 0 : 1;

      pulseState.forEach((p, k) => {
        p.t += p.speed * dt * speed;
        if (p.t >= 1) {
          // hop to a neighbouring edge that shares the end node, else random
          const end = edges[p.edge][1];
          const next = edges.findIndex((e, idx) => idx !== p.edge && e[0] === end);
          p.edge = next >= 0 && Math.random() < 0.7 ? next : Math.floor(Math.random() * edges.length);
          p.t = 0;
        }
        const [i, j] = edges[p.edge];
        a.fromArray(nodePos, i * 3);
        b.fromArray(nodePos, j * 3);
        a.lerp(b, p.t);
        pulsePos.set([a.x, a.y, a.z], k * 3);
      });
      pulseGeo.attributes.position.needsUpdate = true;

      globe.rotation.y += 0.0016 * speed;
      core.rotation.x -= 0.002 * speed;
      core.rotation.y += 0.003 * speed;
      rings.forEach((r, i) => (r.rotation.z += (0.0008 + i * 0.0004) * speed * (i % 2 ? -1 : 1)));
      stars.rotation.y = t * 0.004 * speed;
      edgeMat.opacity = 0.18 + Math.sin(t * 1.4) * 0.05;

      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      root.rotation.x = pointer.y * 0.25 + scrollP * 0.9;
      root.rotation.y = pointer.x * 0.35 + scrollP * Math.PI;
      camera.position.z = 8 + scrollP * 3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (visible && !document.hidden) render();
    };
    loop();

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", layout);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      disposables.forEach((d) => d.dispose && d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="scene" aria-hidden="true" />;
}
