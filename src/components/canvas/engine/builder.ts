// Formation builder: every formation is a fixed-size cloud of N points.
// Structure points fill indices [0, used); the rest become a deterministic
// starfield (same star for the same index in every formation), so morphs pull
// points out of / back into the sky.
//
// World units: the viewport is 2 units tall (y ∈ [-1, 1] at z = 0) and
// 2·aspect wide. A formation is authored around the origin; the stage applies
// its layout (offset + scale) at render time.
//
// Per point we store
//   pos  = [x, y, z, size]           size ≈ dot diameter in px on a 1000px-tall viewport
//   meta = [heat, flow, aux, mode]
//     heat  0..1  accent tint (attention / saliency)
//     flow  ≥0 → distance along a path in world units; pulses travel along it. <0 → none
//     aux   mode-specific: RIGID → spin multiplier (final spin = spin·(1+aux), so -1 = static)
//                           WAVE  → wave amplitude
//     mode  MODE.*

export const MODE = {
  RIGID: 0,
  SURFACE: 1, // halftone sphere surface: grid is screen-fixed, a procedural texture rotates beneath it
  WAVE: 2, // vertical sine undulation, amplitude = aux
  STAR: 3,
  HIDDEN: 4,
} as const;

export type FormationData = {
  pos: Float32Array;
  meta: Float32Array;
  used: number;
  /** robust (1st–99th percentile) bounds of the structure, used to fit it on screen */
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  extentX: number;
  extentY: number;
};

export type Rng = () => number;

/** mulberry32 — small, fast, deterministic */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic per-index hash in [0,1) — used for the shared starfield. */
export function hash01(i: number, salt: number): number {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(salt + 0x27d4eb2f, 0xc2b2ae35);
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function gaussian(rng: Rng): number {
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export const PHI = (1 + Math.sqrt(5)) / 2;
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const STAR_VISIBLE_RATIO = 0.17;

/** Writes the shared star for index i into the arrays. */
export function writeStar(pos: Float32Array, meta: Float32Array, i: number) {
  const o = i * 4;
  const visible = hash01(i, 7) < STAR_VISIBLE_RATIO;
  pos[o] = (hash01(i, 1) * 2 - 1) * 5.4;
  pos[o + 1] = (hash01(i, 2) * 2 - 1) * 3.4;
  pos[o + 2] = -1.0 - hash01(i, 3) * 5.5;
  const s = hash01(i, 4);
  pos[o + 3] = visible ? 1.3 + s * s * 3.4 : 0;
  meta[o] = hash01(i, 5) < 0.04 ? 0.55 : 0; // a few warm stars
  meta[o + 1] = -1;
  meta[o + 2] = hash01(i, 6); // twinkle phase
  meta[o + 3] = visible ? MODE.STAR : MODE.HIDDEN;
}

export class FormationBuilder {
  readonly N: number;
  readonly pos: Float32Array;
  readonly meta: Float32Array;
  readonly rng: Rng;
  n = 0;

  constructor(N: number, seed = 1) {
    this.N = N;
    this.pos = new Float32Array(N * 4);
    this.meta = new Float32Array(N * 4);
    this.rng = makeRng(seed);
  }

  get remaining() {
    return this.N - this.n;
  }

  get full() {
    return this.n >= this.N;
  }

  /** Adds one point. Returns false (and drops it) when the budget is exhausted. */
  add(
    x: number,
    y: number,
    z: number,
    size: number,
    heat = 0,
    flow = -1,
    aux = 0,
    mode: number = MODE.RIGID,
  ): boolean {
    if (this.n >= this.N) return false;
    const o = this.n * 4;
    this.pos[o] = x;
    this.pos[o + 1] = y;
    this.pos[o + 2] = z;
    this.pos[o + 3] = size;
    this.meta[o] = heat;
    this.meta[o + 1] = flow;
    this.meta[o + 2] = aux;
    this.meta[o + 3] = mode;
    this.n++;
    return true;
  }

  /** Dotted straight line. `flowStart` (≥0) makes pulses travel from a → b. */
  line(
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    opts: { spacing?: number; size?: number; heat?: number; flowStart?: number; aux?: number; mode?: number; jitter?: number } = {},
  ) {
    const { spacing = 0.008, size = 1.3, heat = 0, flowStart = -1, aux = 0, mode = MODE.RIGID, jitter = 0 } = opts;
    const len = Math.hypot(bx - ax, by - ay, bz - az);
    const steps = Math.max(1, Math.round(len / spacing));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const j = jitter ? (this.rng() - 0.5) * jitter : 0;
      this.add(
        ax + (bx - ax) * t + j,
        ay + (by - ay) * t + j,
        az + (bz - az) * t,
        size,
        heat,
        flowStart >= 0 ? flowStart + len * t : -1,
        aux,
        mode,
      );
    }
    return len;
  }

  /** Dotted circular arc in the XY plane (angles in radians, counter-clockwise). */
  arc(
    cx: number,
    cy: number,
    r: number,
    a0: number,
    a1: number,
    opts: { spacing?: number; size?: number; heat?: number; flowStart?: number; aux?: number; mode?: number; z?: number } = {},
  ) {
    const { spacing = 0.008, size = 1.3, heat = 0, flowStart = -1, aux = 0, mode = MODE.RIGID, z = 0 } = opts;
    const len = Math.abs(a1 - a0) * r;
    const steps = Math.max(2, Math.round(len / spacing));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const a = a0 + (a1 - a0) * t;
      this.add(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z, size, heat, flowStart >= 0 ? flowStart + len * t : -1, aux, mode);
    }
    return len;
  }

  circle(cx: number, cy: number, r: number, opts: Parameters<FormationBuilder["arc"]>[5] = {}) {
    return this.arc(cx, cy, r, 0, Math.PI * 2, opts);
  }

  /** Filled disk (sunflower / golden-angle packing), facing the camera. */
  disk(cx: number, cy: number, cz: number, r: number, count: number, opts: { size?: number; heat?: number; aux?: number; mode?: number; sizeFalloff?: number } = {}) {
    const { size = 2.2, heat = 0, aux = 0, mode = MODE.RIGID, sizeFalloff = 0.35 } = opts;
    for (let k = 0; k < count; k++) {
      const rr = Math.sqrt((k + 0.5) / count);
      const a = k * GOLDEN_ANGLE;
      this.add(cx + Math.cos(a) * rr * r, cy + Math.sin(a) * rr * r, cz, size * (1 - sizeFalloff * rr), heat, -1, aux, mode);
    }
  }

  /** Ball of points on a Fibonacci sphere (reads as a solid node from any angle). */
  ball(cx: number, cy: number, cz: number, r: number, count: number, opts: { size?: number; heat?: number; aux?: number; mode?: number } = {}) {
    const { size = 2, heat = 0, aux = 0, mode = MODE.RIGID } = opts;
    for (let k = 0; k < count; k++) {
      const y = 1 - (2 * (k + 0.5)) / count;
      const rr = Math.sqrt(1 - y * y);
      const a = k * GOLDEN_ANGLE;
      this.add(cx + Math.cos(a) * rr * r, cy + y * r, cz + Math.sin(a) * rr * r, size, heat, -1, aux, mode);
    }
  }

  /** Shuffles the structure points (organic morphs) and fills the rest with the shared starfield. */
  finish({ shuffle = true }: { shuffle?: boolean } = {}): FormationData {
    const used = this.n;
    if (shuffle) {
      const p = this.pos;
      const m = this.meta;
      for (let i = used - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        for (let c = 0; c < 4; c++) {
          const a = i * 4 + c;
          const b = j * 4 + c;
          let t = p[a];
          p[a] = p[b];
          p[b] = t;
          t = m[a];
          m[a] = m[b];
          m[b] = t;
        }
      }
    }
    const xs = new Float32Array(used);
    const ys = new Float32Array(used);
    for (let i = 0; i < used; i++) {
      xs[i] = this.pos[i * 4];
      ys[i] = this.pos[i * 4 + 1];
    }
    xs.sort();
    ys.sort();
    const pick = (a: Float32Array, q: number) => (a.length ? a[Math.min(a.length - 1, Math.max(0, Math.round(q * (a.length - 1))))] : 0);
    const bounds = { minX: pick(xs, 0.005), maxX: pick(xs, 0.995), minY: pick(ys, 0.005), maxY: pick(ys, 0.995) };
    for (let i = used; i < this.N; i++) writeStar(this.pos, this.meta, i);
    return {
      pos: this.pos,
      meta: this.meta,
      used,
      bounds,
      extentX: Math.max(Math.abs(bounds.minX), Math.abs(bounds.maxX)) || 1,
      extentY: Math.max(Math.abs(bounds.minY), Math.abs(bounds.maxY)) || 1,
    };
  }
}

/**
 * Samples text (or any canvas drawing) onto a regular dot grid — gives crisp
 * dot-matrix lettering. Browser-only (uses a 2D canvas).
 */
export function sampleCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  opts: { width: number; height: number; cols: number },
): { x: number; y: number; v: number }[] {
  const { width, height, cols } = opts;
  const rows = Math.round((cols * height) / width);
  const cvs = document.createElement("canvas");
  cvs.width = cols;
  cvs.height = rows;
  const ctx = cvs.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cols, rows);
  draw(ctx, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;
  const out: { x: number; y: number; v: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = data[(r * cols + c) * 4] / 255;
      if (v > 0.08) out.push({ x: (c / (cols - 1) - 0.5) * width, y: (0.5 - r / (rows - 1)) * height, v });
    }
  }
  return out;
}
