import * as THREE from "three";

import { setStageState } from "@/lib/stage-store";

import { type FormationData, hash01 } from "./builder";
import { FORMATIONS, type FormationDef } from "./registry";
import { fragmentShader, vertexShader } from "./shaders";

type Layout = { x: number; y: number; s: number };

/** a box in the page flow (document px) that a formation rides along with on narrow screens */
type Slot = { top: number; h: number };

type Anchor = {
  id: string;
  y: number; // scroll position at which this formation is fully formed
  desktop: Layout;
  mobile: Layout;
  /** desktop: the formation's right edge stays left of this (same units as fx), clear of text beside it */
  xmax: number;
  slot: Slot | null;
};

/** a formation on screen: its resting layout, and where it is drawn right now */
type Shown = { id: string; base: Layout; at: Layout };

/** a timed morph that ignores scroll: the intro, a page change, an interactive switch */
type Transition = {
  from: Shown;
  to: Anchor;
  toLayout: Layout;
  start: number;
  dur: number;
  noise: number;
};

const FOV = 30;
const CAM_DIST = 1 / Math.tan(((FOV / 2) * Math.PI) / 180); // z=0 plane spans y ∈ [-1, 1]
const INTRO_MS = 2300;
const SWITCH_MS = 1500;
const ORIGIN: Layout = { x: 0, y: 0, s: 1 };
const NOISE: Shown = { id: "noise", base: ORIGIN, at: ORIGIN };

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function num(v: string | undefined, d: number) {
  if (v === undefined || v === "") return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

const sameLayout = (a: Layout, b: Layout) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.s - b.s) < 0.02;

export type StageOptions = {
  count: number;
  reducedMotion: boolean;
};

export class Stage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private geometry = new THREE.BufferGeometry();
  private material: THREE.ShaderMaterial;
  private points: THREE.Points;
  private attrs: Record<"aPosA" | "aPosB" | "aMetaA" | "aMetaB", THREE.BufferAttribute>;
  private cache = new Map<string, FormationData>();
  private anchors: Anchor[] = [];
  private pairA = "";
  private pairB = "";
  private raf = 0;
  private last = 0;
  private time = 0;
  private trans: Transition | null = null;
  /** what is on screen right now (the dominant formation and where it sits) */
  private shown: Shown = NOISE;
  private introPending = true;
  private mouse = new THREE.Vector2(9, 9);
  private mouseTarget = new THREE.Vector2(9, 9);
  private mouseActive = 0;
  private mouseActiveTarget = 0;
  private tilt = new THREE.Vector2();
  private tiltTarget = new THREE.Vector2();
  private lastScroll = 0;
  private parallax = 0;
  private hudAcc = 0;
  /** a formation was built since the DOM last heard where formations sit */
  private layoutsDirty = false;
  private hiTarget = 0;
  private aspect = 1;
  /** canvas height in CSS px (the canvas spans y from -1 to 1) */
  private viewH = 1;
  /** side-by-side desktop layout; must match the CSS `wide` variant in globals.css */
  private wide = true;
  private disposed = false;
  private ro?: ResizeObserver;
  private mo?: MutationObserver;
  private readonly N: number;
  private readonly opts: StageOptions;

  constructor(
    private canvas: HTMLCanvasElement,
    opts: StageOptions,
  ) {
    this.opts = opts;
    this.N = opts.count;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 40);
    this.camera.position.set(0, 0, CAM_DIST);

    const N = this.N;
    const mk = () => new THREE.BufferAttribute(new Float32Array(N * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.attrs = { aPosA: mk(), aPosB: mk(), aMetaA: mk(), aMetaB: mk() };
    for (const [k, a] of Object.entries(this.attrs)) this.geometry.setAttribute(k, a);

    const seed = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      seed[i * 4] = hash01(i, 101);
      seed[i * 4 + 1] = hash01(i, 102);
      seed[i * 4 + 2] = hash01(i, 103);
      seed[i * 4 + 3] = hash01(i, 104);
    }
    this.geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
    // `position` is required by three; the shader ignores it
    this.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);

    const accent = new THREE.Color(getCssVar("--accent-hex", "#ff5b1f"));
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uMix: { value: 0 },
        uMorphNoise: { value: 0 },
        uLayoutA: { value: new THREE.Vector4(0, 0, 1, 0) },
        uLayoutB: { value: new THREE.Vector4(0, 0, 1, 0) },
        uSpinA: { value: new THREE.Vector4(0, 1, 0, 0) },
        uSpinB: { value: new THREE.Vector4(0, 1, 0, 0) },
        uMouse: { value: new THREE.Vector2(9, 9) },
        uMouseActive: { value: 0 },
        uTilt: { value: new THREE.Vector2() },
        uViewH: { value: 1000 },
        uCamDist: { value: CAM_DIST },
        uParallax: { value: 0 },
        uSizeScale: { value: 1 },
        uFlowSpeed: { value: 0.32 },
        uHi: { value: -1 },
        uHiAmt: { value: 0 },
        uBase: { value: new THREE.Color(0.8, 0.8, 0.79) },
        uAccent: { value: accent },
        uHot: { value: new THREE.Color(1.0, 0.86, 0.66) },
        uGlobalAlpha: { value: 1 },
      },
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);

    this.resize();
    this.collectAnchors(false);
    if (opts.reducedMotion) {
      // no intro: start fully formed
      this.introPending = false;
      const a = this.anchors[0];
      const base = this.layoutFor(a, this.data(a.id));
      this.shown = { id: a.id, base, at: this.place(base, a, window.scrollY) };
      setStageState({ intro: 1, introDone: true, formation: a.id, next: a.id });
    }
    this.setPair("noise", "noise");

    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("pointerdown", this.onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onLeave);
    this.ro = new ResizeObserver(() => this.collectAnchors(true));
    this.ro.observe(document.body);
    // sections may swap their formation interactively (data-formation changes)
    this.mo = new MutationObserver(() => this.collectAnchors(true));
    this.mo.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-formation", "data-fx", "data-fy", "data-fs", "data-fxmax", "data-mfx", "data-mfy", "data-mfs"],
    });
  }

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      this.frame(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  /** noise → whatever the page is showing; once per visit */
  playIntro() {
    if (!this.introPending) return;
    this.introPending = false;
    const { anchor } = this.map(window.scrollY);
    this.begin(NOISE, anchor, INTRO_MS, 0.9);
  }

  /** re-read the page's anchors (after a client-side navigation) */
  refresh() {
    this.collectAnchors(true);
  }

  /** light up one tagged group of points (e.g. a stack cluster); null fades it back out */
  highlight(tag: number | null) {
    if (tag !== null) this.material.uniforms.uHi.value = tag;
    this.hiTarget = tag === null ? 0 : 1;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("pointerdown", this.onPointer);
    document.documentElement.removeEventListener("pointerleave", this.onLeave);
    this.ro?.disconnect();
    this.mo?.disconnect();
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }

  // ---------------------------------------------------------------- formations

  private def(id: string): FormationDef {
    return FORMATIONS[id] ?? FORMATIONS.sphere;
  }

  private data(id: string): FormationData {
    let d = this.cache.get(id);
    if (!d) {
      d = this.def(id).build(this.N);
      this.cache.set(id, d);
      this.layoutsDirty = true;
    }
    return d;
  }

  /** pre-builds every formation referenced on the page (spreads the cost across idle frames) */
  warm(onProgress?: (p: number) => void): Promise<void> {
    const ids = Array.from(new Set(["noise", ...this.anchors.map((a) => a.id)]));
    return new Promise((resolve) => {
      let i = 0;
      const step = () => {
        if (this.disposed) return resolve();
        const t0 = performance.now();
        while (i < ids.length && performance.now() - t0 < 12) {
          this.data(ids[i]);
          i++;
          onProgress?.(i / ids.length);
        }
        if (i < ids.length) setTimeout(step, 0);
        else {
          this.publishLayouts();
          resolve();
        }
      };
      step();
    });
  }

  private setPair(a: string, b: string) {
    if (a === this.pairA && b === this.pairB) return;
    const da = this.data(a);
    const db = this.data(b);
    if (a !== this.pairA) {
      (this.attrs.aPosA.array as Float32Array).set(da.pos);
      (this.attrs.aMetaA.array as Float32Array).set(da.meta);
      this.attrs.aPosA.needsUpdate = true;
      this.attrs.aMetaA.needsUpdate = true;
    }
    if (b !== this.pairB) {
      (this.attrs.aPosB.array as Float32Array).set(db.pos);
      (this.attrs.aMetaB.array as Float32Array).set(db.meta);
      this.attrs.aPosB.needsUpdate = true;
      this.attrs.aMetaB.needsUpdate = true;
    }
    this.pairA = a;
    this.pairB = b;
    this.setSpin(this.material.uniforms.uSpinA.value, this.def(a).spin);
    this.setSpin(this.material.uniforms.uSpinB.value, this.def(b).spin);
  }

  private setSpin(v: THREE.Vector4, spin: FormationDef["spin"]) {
    const ax = new THREE.Vector3(...(spin?.axis ?? [0, 1, 0])).normalize();
    v.set(ax.x, ax.y, ax.z, this.opts.reducedMotion ? (spin?.speed ?? 0) * 0.25 : (spin?.speed ?? 0));
  }

  // ------------------------------------------------------------------- anchors

  collectAnchors(transition: boolean) {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-formation]"));
    const vh = window.innerHeight;
    const sy = window.scrollY;
    const out: Anchor[] = [];
    for (const el of els) {
      const id = el.dataset.formation!;
      const def = this.def(id);
      const r = el.getBoundingClientRect();
      const top = r.top + sy;
      const lay = def.layout ?? { x: 0, y: 0, scale: 1 };
      const ds = el.dataset;
      const desktop = { x: num(ds.fx, lay.x), y: num(ds.fy, lay.y), s: num(ds.fs, lay.scale) };
      const mobile = { x: num(ds.mfx, 0), y: num(ds.mfy, desktop.y), s: num(ds.mfs, desktop.s) };
      // narrow screens have no room beside the text: a section can give its formation a slot in the flow instead
      const sr = this.wide ? null : el.querySelector<HTMLElement>("[data-stage-slot]")?.getBoundingClientRect();
      const slot = sr && sr.height > 0 ? { top: sr.top + sy, h: sr.height } : null;
      const align = ds.falign ?? "center";
      const y = slot ? slot.top + slot.h / 2 - vh / 2 : align === "top" ? top : top + r.height / 2 - vh / 2;
      out.push({ id, y: Math.max(0, y), desktop, mobile, xmax: num(ds.fxmax, Infinity), slot });
    }
    out.sort((a, b) => a.y - b.y);
    this.anchors = out.length ? out : [{ id: "dust", y: 0, desktop: ORIGIN, mobile: ORIGIN, xmax: Infinity, slot: null }];
    setStageState({ anchorCount: this.anchors.length });
    this.publishLayouts();

    // the page changed under us (navigation, a section swapped its formation):
    // glide from what is on screen to what should be there now
    if (transition && !this.introPending) {
      const { anchor } = this.map(window.scrollY);
      const layout = this.layoutFor(anchor, this.data(anchor.id));
      const tr = this.trans;
      if (tr) {
        if (tr.to.id === anchor.id) {
          tr.to = anchor;
          tr.toLayout = layout;
        } else {
          // keep the drawn mix continuous and finish within ~300ms
          const now = performance.now();
          const p = Math.min(1, Math.max(0, (now - tr.start) / tr.dur));
          const dur = 300 / Math.max(0.05, 1 - p);
          if (dur < tr.dur) {
            tr.dur = dur;
            tr.start = now - p * dur;
          }
        }
      } else if (anchor.id !== this.shown.id || !sameLayout(layout, this.shown.base)) {
        this.begin(this.shown, anchor, SWITCH_MS, anchor.id === this.shown.id ? 0.05 : 0.5);
      }
    }
  }

  private begin(from: Shown, to: Anchor, dur: number, noise: number) {
    if (this.opts.reducedMotion) {
      dur = Math.min(dur, 500);
      noise = 0;
    }
    this.trans = { from, to, toLayout: this.layoutFor(to, this.data(to.id)), start: performance.now(), dur, noise };
  }

  /** tells the DOM where each (already built) formation lands, for labels pinned to particles */
  private publishLayouts() {
    this.layoutsDirty = false;
    const layouts: Record<string, { x: number; y: number; s: number }> = {};
    for (const a of this.anchors) {
      const d = this.cache.get(a.id);
      if (!d || layouts[a.id]) continue;
      const l = this.layoutFor(a, d);
      layouts[a.id] = { x: l.x, y: l.y, s: l.s };
    }
    setStageState({ layouts });
  }

  /** Places a formation and shrinks it, if needed, so it stays inside the viewport (or its slot). */
  private layoutFor(a: Anchor, data: FormationData): Layout {
    const narrow = !this.wide;
    const L = narrow ? a.mobile : a.desktop;
    // a slotted formation sits centred in its slot; place() adds where the slot currently is
    const cx = a.slot ? 0 : L.x * this.aspect;
    const cy = a.slot ? 0 : L.y;
    const b = data.bounds;
    const mx = this.aspect * (narrow ? 0.96 : 0.965);
    const my = a.slot ? a.slot.h / this.viewH : 0.95;
    const hi = narrow ? mx : Math.min(mx, a.xmax * this.aspect);
    let s = L.s;
    if (b.maxX > 0) s = Math.min(s, (hi - cx) / b.maxX);
    if (b.minX < 0) s = Math.min(s, (mx + cx) / -b.minX);
    if (b.maxY > 0) s = Math.min(s, (my - cy) / b.maxY);
    if (b.minY < 0) s = Math.min(s, (my + cy) / -b.minY);
    return { x: cx, y: cy, s: Math.max(0.2, s) };
  }

  /** where a layout is drawn at scroll position sy: slotted formations travel with their slot */
  private place(l: Layout, a: Anchor, sy: number): Layout {
    if (!a.slot) return l;
    return { x: l.x, y: l.y + 1 - (2 * (a.slot.top - sy + a.slot.h / 2)) / this.viewH, s: l.s };
  }

  /** scroll → the two anchors around it, how far between them, and the dominant one */
  private map(sy: number) {
    const A = this.anchors;
    let ia = 0;
    let ib = 0;
    let t = 0;
    if (A.length > 1 && sy > A[0].y) {
      if (sy >= A[A.length - 1].y) {
        ia = ib = A.length - 1;
      } else {
        let i = 0;
        while (i < A.length - 2 && sy >= A[i + 1].y) i++;
        ia = i;
        ib = i + 1;
        const span = Math.max(1, A[ib].y - A[ia].y);
        t = smoothstep(0.18, 0.82, (sy - A[ia].y) / span);
      }
    }
    return { ia, ib, t, anchor: A[t < 0.5 ? ia : ib] };
  }

  // -------------------------------------------------------------------- frame

  private frame(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const rm = this.opts.reducedMotion;
    this.time += dt * (rm ? 0.3 : 1);
    const u = this.material.uniforms;
    u.uTime.value = this.time;

    const sy = window.scrollY;
    const vel = (sy - this.lastScroll) / Math.max(dt, 1e-3);
    this.lastScroll = sy;
    this.parallax += (vel / window.innerHeight) * dt * 0.35 * (rm ? 0 : 1);
    u.uParallax.value = this.parallax;

    const A = this.anchors;
    const m = this.map(sy);
    const a = A[m.ia];
    const b = A[m.ib];
    let formation = m.anchor.id;
    let next = b.id;
    let mix = m.t;

    if (this.introPending) {
      // waiting for the intro: pure noise
      this.setPair("noise", "noise");
      u.uLayoutA.value.set(0, 0, 1, 0);
      u.uLayoutB.value.set(0, 0, 1, 0);
      u.uMix.value = 0;
      u.uMorphNoise.value = 0;
      formation = next = "noise";
      mix = 0;
    } else if (this.trans) {
      const tr = this.trans;
      const p = Math.min(1, Math.max(0, (now - tr.start) / tr.dur));
      const e = 1 - Math.pow(1 - p, 2.2);
      const from = tr.from.at;
      const to: Shown = { id: tr.to.id, base: tr.toLayout, at: this.place(tr.toLayout, tr.to, sy) };
      this.setPair(tr.from.id, to.id);
      u.uLayoutA.value.set(from.x, from.y, from.s, 0);
      u.uLayoutB.value.set(to.at.x, to.at.y, to.at.s, 0);
      u.uMix.value = e;
      u.uMorphNoise.value = tr.noise * (1 - p * 0.6);
      formation = e < 0.5 ? tr.from.id : to.id;
      next = to.id;
      mix = e;
      this.shown = e < 0.5 ? tr.from : to;
      if (p >= 1) {
        this.trans = null;
        this.shown = to;
        if (tr.from.id === "noise") setStageState({ intro: 1, introDone: true });
        // the reader kept scrolling during the morph: chain on to where they are now
        const target = m.anchor;
        const tl = this.layoutFor(target, this.data(target.id));
        if (target.id !== to.id || !sameLayout(tl, tr.toLayout)) this.begin(to, target, 1100, 0.4);
      } else if (tr.from.id === "noise") {
        setStageState({ intro: p });
      }
    } else {
      this.setPair(a.id, b.id);
      const la = this.layoutFor(a, this.data(a.id));
      const lb = this.layoutFor(b, this.data(b.id));
      const pa = this.place(la, a, sy);
      const pb = this.place(lb, b, sy);
      u.uLayoutA.value.set(pa.x, pa.y, pa.s, 0);
      u.uLayoutB.value.set(pb.x, pb.y, pb.s, 0);
      u.uMix.value = m.t;
      // the same formation at two anchors just glides between layouts
      u.uMorphNoise.value = rm ? 0 : a.id === b.id ? 0.04 : (this.def(b.id).morphNoise ?? 0.5);
      this.shown = m.t < 0.5 ? { id: a.id, base: la, at: pa } : { id: b.id, base: lb, at: pb };
    }

    // pointer: smoothed, plus a gentle global tilt
    const k = 1 - Math.pow(0.0008, dt);
    this.mouse.lerp(this.mouseTarget, k);
    this.mouseActive += (this.mouseActiveTarget - this.mouseActive) * k;
    this.tilt.lerp(this.tiltTarget, 1 - Math.pow(0.05, dt));
    u.uHiAmt.value += (this.hiTarget - u.uHiAmt.value) * (1 - Math.pow(0.002, dt));
    u.uMouse.value.copy(this.mouse);
    u.uMouseActive.value = rm ? 0 : this.mouseActive;
    u.uTilt.value.copy(this.tilt);

    this.renderer.render(this.scene, this.camera);
    if (this.layoutsDirty) this.publishLayouts();

    this.hudAcc += dt;
    if (this.hudAcc > 0.12) {
      this.hudAcc = 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setStageState({ ready: true, formation, next, mix, progress: Math.min(1, sy / maxScroll), anchorIndex: m.t < 0.5 ? m.ia : m.ib });
    }
  }

  // ------------------------------------------------------------------- events

  private onResize = () => {
    this.resize();
    this.collectAnchors(false);
  };

  private resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.aspect = w / h;
    this.viewH = h;
    this.wide = window.matchMedia("(min-width: 1024px) and (min-aspect-ratio: 19/20)").matches;
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    this.material.uniforms.uViewH.value = h * dpr;
    // slightly larger dots on small screens so the matrix still reads
    this.material.uniforms.uSizeScale.value = h < 700 ? 1.15 : 1;
  }

  private onPointer = (e: PointerEvent) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const nx = (e.clientX / w) * 2 - 1;
    const ny = -((e.clientY / h) * 2 - 1);
    this.mouseTarget.set(nx * this.aspect, ny);
    this.mouseActiveTarget = e.pointerType === "touch" ? 0.6 : 1;
    this.tiltTarget.set(nx * 0.16, -ny * 0.1);
  };

  private onLeave = () => {
    this.mouseActiveTarget = 0;
    this.tiltTarget.set(0, 0);
  };
}

function getCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
