import { FormationBuilder, MODE, gaussian } from "../builder";
import { densityOf } from "./core";

type V2 = [number, number];

/** Dotted cubic bezier with horizontal tangents (graph edges). Returns its length. */
function curve(
  b: FormationBuilder,
  p: V2,
  q: V2,
  opts: { spacing?: number; size?: number; heat?: number; flowStart?: number; aux?: number; z?: number; bend?: number } = {},
) {
  const { spacing = 0.012, size = 1.1, heat = 0, flowStart = -1, aux = -1, z = 0, bend = 0.5 } = opts;
  const dx = (q[0] - p[0]) * bend;
  const c1: V2 = [p[0] + dx, p[1]];
  const c2: V2 = [q[0] - dx, q[1]];
  // sample densely to measure, then place dots at even arc-length
  const S = 64;
  const pts: V2[] = [];
  for (let i = 0; i <= S; i++) {
    const t = i / S;
    const mt = 1 - t;
    pts.push([
      mt * mt * mt * p[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t * t * t * q[0],
      mt * mt * mt * p[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t * t * t * q[1],
    ]);
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  const n = Math.max(2, Math.round(len / spacing));
  let j = 0;
  for (let s = 0; s <= n; s++) {
    const d = (s / n) * len;
    while (j < cum.length - 2 && cum[j + 1] < d) j++;
    const f = (d - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
    const x = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f;
    const y = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f;
    b.add(x, y, z, size, heat, flowStart >= 0 ? flowStart + d : -1, aux);
  }
  return len;
}

function rect(b: FormationBuilder, x0: number, y0: number, x1: number, y1: number, opts: Parameters<FormationBuilder["line"]>[6] = {}) {
  b.line(x0, y0, 0, x1, y0, 0, opts);
  b.line(x1, y0, 0, x1, y1, 0, opts);
  b.line(x1, y1, 0, x0, y1, 0, opts);
  b.line(x0, y1, 0, x0, y0, 0, opts);
}

/** Corner brackets — a detection box. */
function brackets(b: FormationBuilder, x0: number, y0: number, x1: number, y1: number, arm: number, opts: Parameters<FormationBuilder["line"]>[6] = {}) {
  const corners: [number, number, number, number][] = [
    [x0, y1, 1, -1],
    [x1, y1, -1, -1],
    [x0, y0, 1, 1],
    [x1, y0, -1, 1],
  ];
  for (const [x, y, sx, sy] of corners) {
    b.line(x, y, 0, x + arm * sx, y, 0, opts);
    b.line(x, y, 0, x, y + arm * sy, 0, opts);
  }
}

/** A node: thin ring + dense core. */
function node(b: FormationBuilder, x: number, y: number, r: number, k: number, heat = 0, z = 0) {
  b.circle(x, y, r, { spacing: 0.0065 / k, size: 1.2, heat, aux: -1, z });
  b.disk(x, y, z, r * 0.55, Math.round(46 * k * k), { size: 2.3, heat, aux: -1, sizeFalloff: 0.25 });
}

// ═════════════════════════════════════════════════════════════ smrthire
/** Node coordinates, shared with the DOM so labels sit on the graph. */
export const AGENT_NODES = [
  { label: "JD Analyzer", x: -0.6, y: 0.21 },
  { label: "Resume Parser", x: -0.6, y: -0.21 },
  { label: "Matcher / Scorer", x: -0.17, y: 0 },
  { label: "Gap Analyzer", x: 0.25, y: 0.2 },
  { label: "Interview Qs", x: 0.25, y: -0.2 },
  { label: "Recommender", x: 0.62, y: 0 },
] as const;
export const AGENT_GATE = { label: "Human approval", x: 0.86, y: 0 } as const;
export const AGENT_STATE_BUS_Y = -0.5;

export function buildAgents(N: number) {
  const b = new FormationBuilder(N, 31);
  const k = densityOf(N);
  const r = b.rng;
  const n = AGENT_NODES;
  const edge = { spacing: 0.0085 / k, size: 1.4 };

  // inputs: a pile of résumés + one job description
  const docs: V2[] = [];
  for (let d = 0; d < 5; d++) {
    const x = -1.12 + d * 0.018;
    const y = 0.3 - d * 0.14;
    docs.push([x + 0.11, y - 0.06]);
    rect(b, x, y - 0.13, x + 0.11, y, { spacing: 0.0065 / k, size: 1.15, aux: -1, heat: d === 0 ? 0.7 : 0 });
    for (let l = 0; l < 4; l++) {
      const len = 0.03 + r() * 0.05;
      b.line(x + 0.015, y - 0.03 - l * 0.026, 0, x + 0.015 + len, y - 0.03 - l * 0.026, 0, { spacing: 0.0075 / k, size: 1.25, aux: -1 });
    }
  }

  // edges (drawn before nodes so nodes sit on top)
  curve(b, docs[0], [n[0].x - 0.06, n[0].y], { ...edge, flowStart: 0 });
  for (let d = 1; d < 5; d++) curve(b, docs[d], [n[1].x - 0.06, n[1].y], { ...edge, flowStart: 0 });
  // map: fan out to parallel scorer lanes
  const lanes = [0.26, 0, -0.26];
  for (const src of [n[0], n[1]]) {
    for (const ly of lanes) curve(b, [src.x + 0.06, src.y], [n[2].x - 0.05, ly], { ...edge, flowStart: 0.5 });
  }
  for (const ly of lanes) {
    if (ly !== 0) node(b, n[2].x, ly, 0.032, k);
    curve(b, [n[2].x + 0.05, ly], [n[3].x - 0.06, n[3].y], { ...edge, flowStart: 0.95 });
    curve(b, [n[2].x + 0.05, ly], [n[4].x - 0.06, n[4].y], { ...edge, flowStart: 0.95 });
  }
  // reduce
  curve(b, [n[3].x + 0.06, n[3].y], [n[5].x - 0.06, n[5].y], { ...edge, flowStart: 1.4 });
  curve(b, [n[4].x + 0.06, n[4].y], [n[5].x - 0.06, n[5].y], { ...edge, flowStart: 1.4 });
  // to the human gate
  b.line(n[5].x + 0.06, 0, 0, AGENT_GATE.x - 0.03, 0, 0, { ...edge, flowStart: 1.8 });

  // agents
  n.forEach((a, i) => node(b, a.x, a.y, i === 2 ? 0.06 : 0.05, k, i === 5 ? 0.35 : 0));

  // human-in-the-loop gate: two posts with a gap
  const g = AGENT_GATE;
  b.line(g.x - 0.022, 0.2, 0, g.x - 0.022, 0.045, 0, { spacing: 0.006 / k, size: 2, heat: 1, aux: -1 });
  b.line(g.x - 0.022, -0.045, 0, g.x - 0.022, -0.2, 0, { spacing: 0.006 / k, size: 2, heat: 1, aux: -1 });
  b.line(g.x + 0.022, 0.2, 0, g.x + 0.022, 0.045, 0, { spacing: 0.006 / k, size: 2, heat: 1, aux: -1 });
  b.line(g.x + 0.022, -0.045, 0, g.x + 0.022, -0.2, 0, { spacing: 0.006 / k, size: 2, heat: 1, aux: -1 });

  // output: the ranked shortlist
  const lens = [0.34, 0.28, 0.22, 0.16, 0.1];
  lens.forEach((len, i) => {
    const y = 0.16 - i * 0.08;
    const x0 = g.x + 0.12;
    b.line(g.x + 0.03, 0, 0, x0 - 0.01, y, 0, { spacing: 0.012 / k, size: 1, flowStart: 2.05, aux: -1 });
    for (let row = 0; row < 3; row++) {
      b.line(x0, y - 0.012 + row * 0.012, 0, x0 + len, y - 0.012 + row * 0.012, 0, {
        spacing: 0.0085 / k,
        size: 1.7,
        heat: i === 0 ? 1 : 0,
        aux: -1,
      });
    }
  });

  // typed state + Postgres checkpoints: a bus under everything
  const busY = AGENT_STATE_BUS_Y;
  b.line(-0.8, busY, 0, 0.8, busY, 0, { spacing: 0.007 / k, size: 1.3, aux: -1, flowStart: 0 });
  for (const a of n) b.line(a.x, a.y - 0.07, 0, a.x, busY, 0, { spacing: 0.016 / k, size: 0.95, aux: -1 });
  for (let i = 0; i <= 16; i++) {
    const x = -0.8 + i * 0.1;
    b.line(x, busY - 0.014, 0, x, busY + 0.014, 0, { spacing: 0.007 / k, size: 1.1, aux: -1 });
  }
  return b.finish();
}

// ═════════════════════════════════════════════════════════════ MentoLab
/** Learner communities in a GNN similarity graph; "you" bridge them, messages pass along edges. */
export function buildGraph(N: number) {
  const b = new FormationBuilder(N, 41);
  const r = b.rng;
  const k = densityOf(N);
  const centers: [number, number, number][] = [
    [-0.62, 0.3, 0.15],
    [0.58, 0.34, -0.2],
    [-0.5, -0.36, -0.25],
    [0.6, -0.3, 0.22],
  ];
  const nodes: { p: [number, number, number]; c: number }[] = [];
  centers.forEach((c, ci) => {
    for (let i = 0; i < 11; i++) {
      nodes.push({ p: [c[0] + gaussian(r) * 0.15, c[1] + gaussian(r) * 0.11, c[2] + gaussian(r) * 0.15], c: ci });
    }
  });
  const you: [number, number, number] = [0, 0.02, 0];
  const dist = (a: number[], q: number[]) => Math.hypot(a[0] - q[0], a[1] - q[1], a[2] - q[2]);
  const seg = (a: number[], q: number[], heat: number, flow: number, size = 1.25, spacing = 0.012) =>
    b.line(a[0], a[1], a[2], q[0], q[1], q[2], { spacing: spacing / k, size, heat, flowStart: flow });

  // intra-community: k-nearest neighbours
  nodes.forEach((a, i) => {
    const near = nodes
      .map((q, j) => ({ j, d: dist(a.p, q.p) }))
      .filter((o) => o.j !== i && nodes[o.j].c === a.c)
      .sort((x, y) => x.d - y.d)
      .slice(0, 2);
    for (const o of near) if (o.j > i) seg(a.p, nodes[o.j].p, 0, r() * 2);
  });
  // bridges between communities (transferred learning paths)
  for (let t = 0; t < 7; t++) {
    const a = nodes[Math.floor(r() * nodes.length)];
    const q = nodes[Math.floor(r() * nodes.length)];
    if (a.c !== q.c) seg(a.p, q.p, 0, r() * 2, 1, 0.02);
  }
  // you ↔ each community
  centers.forEach((_, ci) => {
    const target = nodes.filter((o) => o.c === ci).sort((x, y) => dist(x.p, you) - dist(y.p, you))[0];
    seg(you, target.p, 0.55, 0, 1.45, 0.011);
  });
  // nodes
  for (const o of nodes) b.ball(o.p[0], o.p[1], o.p[2], 0.026, Math.round(44 * k * k), { size: 2.2 });
  b.ball(you[0], you[1], you[2], 0.042, Math.round(90 * k * k), { size: 2.6, heat: 1 });
  b.circle(you[0], you[1], 0.075, { spacing: 0.007 / k, size: 1.1, heat: 0.6 });
  // dust: the embedding space they live in
  const dust = Math.round(800 * k * k);
  for (let i = 0; i < dust; i++) b.add(gaussian(r) * 0.42, gaussian(r) * 0.26, gaussian(r) * 0.3, 0.8 + r() * 0.8);
  return b.finish();
}

// ═════════════════════════════════════════════════════════════ PathLearn
/** A curriculum tree; one personalised path lights up from course → career. */
export function buildTree(N: number) {
  const b = new FormationBuilder(N, 51);
  const r = b.rng;
  const k = densityOf(N);
  type T = { x: number; y: number; depth: number; kids: T[]; hot: boolean };
  const levels = 4;
  const dx = 0.5;
  const root: T = { x: -0.95, y: 0, depth: 0, kids: [], hot: true };
  const grow = (t: T, spread: number) => {
    if (t.depth >= levels) return;
    const n = t.depth === 0 ? 3 : t.depth === 1 && r() < 0.5 ? 3 : 2;
    const hotKid = Math.floor(r() * n);
    for (let i = 0; i < n; i++) {
      const y = t.y + (i / (n - 1) - 0.5) * spread;
      const kid: T = { x: t.x + dx, y: y + gaussian(r) * 0.015, depth: t.depth + 1, kids: [], hot: t.hot && i === hotKid };
      t.kids.push(kid);
      grow(kid, spread * (n === 3 ? 0.4 : 0.5));
    }
  };
  grow(root, 1.0);

  const walk = (t: T, flow: number) => {
    for (const c of t.kids) {
      const len = curve(b, [t.x + 0.02, t.y], [c.x - 0.02, c.y], {
        spacing: (c.hot ? 0.0075 : 0.013) / k,
        size: c.hot ? 1.7 : 1.05,
        heat: c.hot ? 0.95 : 0,
        flowStart: c.hot ? flow : -1,
        bend: 0.55,
      });
      walk(c, flow + len);
    }
    const leaf = t.kids.length === 0;
    if (t.hot && leaf) {
      // the career at the end of the path
      b.circle(t.x, t.y, 0.05, { spacing: 0.006 / k, size: 1.4, heat: 1, aux: -1 });
      b.circle(t.x, t.y, 0.08, { spacing: 0.012 / k, size: 1.1, heat: 0.7, aux: -1 });
      b.disk(t.x, t.y, 0, 0.026, Math.round(40 * k * k), { size: 2.4, heat: 1, aux: -1 });
    } else {
      b.disk(t.x, t.y, 0, t.hot ? 0.022 : 0.014, Math.round((t.hot ? 30 : 14) * k * k), { size: t.hot ? 2.3 : 1.8, heat: t.hot ? 0.9 : 0, aux: -1 });
    }
  };
  walk(root, 0);

  // the course you start from: a stack of "unit" bars
  for (let i = 0; i < 4; i++) {
    b.line(-1.2, 0.09 - i * 0.06, 0, -1.04, 0.09 - i * 0.06, 0, { spacing: 0.008 / k, size: 1.6, aux: -1, heat: i === 1 ? 0.6 : 0 });
  }
  curve(b, [-1.03, 0.03], [root.x - 0.02, root.y], { spacing: 0.008 / k, size: 1.5, heat: 0.9, flowStart: 0, bend: 0.5 });
  // depth rulers
  for (let d = 0; d <= levels; d++) {
    const x = root.x + d * dx;
    b.line(x, -0.62, 0, x, -0.58, 0, { spacing: 0.006 / k, size: 1.2, aux: -1 });
  }
  b.line(root.x, -0.6, 0, root.x + levels * dx, -0.6, 0, { spacing: 0.012 / k, size: 1, aux: -1 });
  return b.finish();
}

// ═════════════════════════════════════════════════════════════ NeuroFlow
/** An eye under a vision model: detection box, landmarks, a turning iris and feature maps. */
export function buildEye(N: number) {
  const b = new FormationBuilder(N, 61);
  const r = b.rng;
  const k = densityOf(N);
  const ex = -0.25;
  const W = 0.62;
  const Hh = 0.27;
  const lid = (x: number) => Hh * Math.pow(Math.max(0, 1 - ((x - ex) / W) ** 2), 0.9);
  const insideEye = (x: number, y: number) => (y >= 0 ? y < lid(x) * 0.95 : -y < lid(x) * 0.88 * 0.95);

  // lids
  const steps = Math.round(260 / 1.0);
  for (let s = 0; s <= steps; s++) {
    const x = ex - W + (2 * W * s) / steps;
    b.add(x, lid(x), 0, 1.6, 0, -1, -1);
    b.add(x, -lid(x) * 0.88, 0, 1.6, 0, -1, -1);
  }
  // iris fibres (they turn slowly — aux 0 spins with the formation about Z)
  const ir = 0.2;
  const pr = 0.075;
  const rays = Math.round(150 * k);
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + gaussian(r) * 0.01;
    const dots = Math.round(11 * k);
    for (let d = 0; d < dots; d++) {
      const rr = pr + ((ir - pr) * (d + r() * 0.6)) / dots;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (!insideEye(x + ex, y)) continue;
      b.add(x + ex, y, 0.01, 1.1 + (1 - (rr - pr) / (ir - pr)) * 1.4, 0, -1, 0);
    }
  }
  // iris rim, hidden where the lids cover it
  const rim = Math.round(240 * k);
  for (let s = 0; s < rim; s++) {
    const a = (s / rim) * Math.PI * 2;
    const x = ex + Math.cos(a) * ir;
    const y = Math.sin(a) * ir;
    if (insideEye(x, y)) b.add(x, y, 0.01, 1.5, 0, -1, -1);
  }
  b.circle(ex, 0, pr, { spacing: 0.005 / k, size: 1.5, aux: -1 });
  b.disk(ex - 0.028, 0.03, 0.02, 0.016, Math.round(20 * k * k), { size: 2.2, heat: 0.0, aux: -1 });

  // detection box + landmarks
  const box = { spacing: 0.006 / k, size: 1.6, heat: 1, aux: -1 };
  brackets(b, ex - 0.78, -0.42, ex + 0.78, 0.42, 0.12, box);
  for (const [x, y] of [
    [ex - W, 0],
    [ex + W, 0],
    [ex, 0],
    [ex, Hh],
    [ex, -Hh * 0.88],
  ] as V2[]) {
    b.line(x - 0.018, y, 0, x + 0.018, y, 0, { spacing: 0.006 / k, size: 1.3, heat: 0.8, aux: -1 });
    b.line(x, y - 0.018, 0, x, y + 0.018, 0, { spacing: 0.006 / k, size: 1.3, heat: 0.8, aux: -1 });
  }

  // CNN feature maps stacked in depth, fed by the receptive-field cone
  const maps = 3;
  for (let m = 0; m < maps; m++) {
    const cx = 0.78 + m * 0.15;
    const cy = 0.05 - m * 0.02;
    const z = -m * 0.12;
    const g = 8 - m * 2;
    const s = 0.34 - m * 0.07;
    for (let gy = 0; gy < g; gy++) {
      for (let gx = 0; gx < g; gx++) {
        const act = Math.max(0, Math.sin(gx * 1.3 + m) * Math.cos(gy * 1.1 - m * 0.7));
        b.add(cx - s / 2 + (gx + 0.5) * (s / g), cy - s / 2 + (gy + 0.5) * (s / g), z, 1.2 + act * 4.5, act > 0.8 ? 0.9 : 0, -1, -1);
      }
    }
    b.line(cx - s / 2, cy + s / 2, z, cx + s / 2, cy + s / 2, z, { spacing: 0.008 / k, size: 1, aux: -1 });
    b.line(cx - s / 2, cy - s / 2, z, cx + s / 2, cy - s / 2, z, { spacing: 0.008 / k, size: 1, aux: -1 });
  }
  for (const y of [0.42, -0.42]) b.line(ex + 0.78, y, 0, 0.61, 0.05 + y * 0.4, 0, { spacing: 0.012 / k, size: 1, aux: -1, flowStart: 0 });

  // live focus signal under the eye
  const sig = Math.round(240 * k);
  for (let s = 0; s <= sig; s++) {
    const x = ex - 0.7 + (1.4 * s) / sig;
    b.add(x, -0.6, 0, 1.6, s / sig > 0.8 ? 0.8 : 0, x + 1, 0.03, MODE.WAVE);
  }
  return b.finish();
}

// ═════════════════════════════════════════════════════════════ ExoML
/** A star, the shadow of a transiting planet, and the light-curve dip the model learns to find. */
export function buildTransit(N: number) {
  const b = new FormationBuilder(N, 71);
  const r = b.rng;
  const k = densityOf(N);
  const sx = -0.55;
  const sy = 0.2;
  const R = 0.36;
  const px = sx + 0.14;
  const py = sy - 0.07;
  const pr = 0.075;
  // limb-darkened stellar disk, with the planet's silhouette cut out
  const sp = 0.0122 / k;
  for (let y = -R; y <= R; y += sp) {
    for (let x = -R; x <= R; x += sp) {
      const d2 = x * x + y * y;
      if (d2 > R * R) continue;
      if ((x + sx - px) ** 2 + (y + sy - py) ** 2 < pr * pr) continue;
      const mu = Math.sqrt(1 - d2 / (R * R));
      const limb = 1 - 0.62 * (1 - mu);
      b.add(sx + x, sy + y, 0, 1 + limb * 3.6, 0.2 * mu, -1, -1);
    }
  }
  b.circle(px, py, pr, { spacing: 0.006 / k, size: 1.2, aux: -1 });
  // orbit (front half only)
  const os = Math.round(520 * k);
  for (let s = 0; s < os; s++) {
    const a = (s / os) * Math.PI * 2;
    const x = sx + Math.cos(a) * 0.62;
    const y = sy - 0.07 + Math.sin(a) * 0.075 + Math.cos(a) * 0.02;
    const behind = Math.sin(a) > 0;
    if (behind && (x - sx) ** 2 + (y - sy) ** 2 < R * R) continue;
    b.add(x, y, behind ? -0.1 : 0.1, behind ? 0.8 : 1.15, 0, -1, -1);
  }

  // the light curve: flux vs time with photometric scatter
  const x0 = -0.15;
  const x1 = 1.28;
  const y0 = -0.42;
  const tc = 0.66;
  const wHalf = 0.13;
  const depth = 0.1;
  const flux = (x: number) => {
    const u = Math.abs(x - tc) / wHalf;
    if (u >= 1) return 0;
    if (u > 0.7) return -depth * (1 - (u - 0.7) / 0.3);
    return -depth * (1 - 0.15 * u * u);
  };
  const samples = Math.round(1100 * k);
  for (let s = 0; s < samples; s++) {
    const x = x0 + (x1 - x0) * r();
    b.add(x, y0 + flux(x) + gaussian(r) * 0.011, 0, 1.3 + r() * 0.8, 0, x - x0, -1);
  }
  // fitted model
  const fit = Math.round(420 * k);
  for (let s = 0; s <= fit; s++) {
    const x = x0 + ((x1 - x0) * s) / fit;
    b.add(x, y0 + flux(x), 0, 1.2, Math.abs(x - tc) < wHalf ? 0.9 : 0, -1, -1);
  }
  // detection box around the dip
  brackets(b, tc - wHalf - 0.05, y0 - depth - 0.06, tc + wHalf + 0.05, y0 + 0.07, 0.045, { spacing: 0.006 / k, size: 1.6, heat: 1, aux: -1 });
  // axes + ticks
  b.line(x0, y0 - 0.2, 0, x1, y0 - 0.2, 0, { spacing: 0.009 / k, size: 1, aux: -1 });
  b.line(x0, y0 - 0.2, 0, x0, y0 + 0.12, 0, { spacing: 0.009 / k, size: 1, aux: -1 });
  for (let i = 0; i <= 12; i++) {
    const x = x0 + ((x1 - x0) * i) / 12;
    b.line(x, y0 - 0.215, 0, x, y0 - 0.185, 0, { spacing: 0.006 / k, size: 1.1, aux: -1 });
  }
  // the star's shadow projected onto the curve
  b.line(px, py - pr - 0.02, 0, tc, y0 + 0.08, 0, { spacing: 0.016 / k, size: 0.95, aux: -1, flowStart: 0 });
  return b.finish();
}

// ═════════════════════════════════════════════════════════════ MindEcho
/** A terrain of feeling over time; the LSTM's memory trace rides above it. */
export function buildWave(N: number) {
  const b = new FormationBuilder(N, 81);
  const r = b.rng;
  const k = densityOf(N);
  const nx = Math.round(110 * k);
  const nz = Math.round(30 * k);
  const tilt = 0.62;
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const bump = (x: number, z: number) =>
    0.16 * Math.exp(-((x + 0.45) ** 2 + (z - 0.1) ** 2) / 0.06) -
    0.1 * Math.exp(-((x - 0.15) ** 2 + (z + 0.12) ** 2) / 0.05) +
    0.13 * Math.exp(-((x - 0.72) ** 2 + z ** 2) / 0.04);
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const x = -1.15 + (2.3 * i) / (nx - 1);
      const z = -0.48 + (0.96 * j) / (nz - 1);
      const y = bump(x, z) - 0.12;
      const y1 = y * ct - z * st;
      const z1 = y * st + z * ct;
      const heat = Math.max(0, (x - 0.35) / 0.8) * 0.85;
      b.add(x, y1, z1, 1.1 + (j / nz) * 1.4, heat, -1, 0.045, MODE.WAVE);
    }
  }
  // memory trace
  const tr = Math.round(380 * k);
  for (let s = 0; s <= tr; s++) {
    const x = -1.15 + (2.3 * s) / tr;
    const y = 0.42 + bump(x, 0) * 0.8 + Math.sin(x * 5) * 0.025;
    b.add(x, y, 0.1, 1.7, s / tr > 0.72 ? 1 : 0.15, x + 1.2, 0.02, MODE.WAVE);
  }
  // timeline ticks under the terrain
  for (let i = 0; i <= 23; i++) {
    const x = -1.15 + (2.3 * i) / 23;
    b.line(x, -0.62, 0, x, i % 6 === 0 ? -0.58 : -0.6, 0, { spacing: 0.006 / k, size: 1.1, aux: -1 });
  }
  const dust = Math.round(500 * k * k);
  for (let i = 0; i < dust; i++) b.add((r() * 2 - 1) * 1.2, 0.15 + r() * 0.5, (r() - 0.5) * 0.4, 0.8 + r() * 0.6, 0, -1, -1);
  return b.finish();
}

// ═════════════════════════════════════════════════════════════ SmartFlow
/** Copy here, paste there: messy text streams through the clipboard and lands formatted. */
export function buildFlow(N: number) {
  const b = new FormationBuilder(N, 91);
  const r = b.rng;
  const k = densityOf(N);
  const frame = { spacing: 0.0058 / k, size: 1.5, aux: -1 };
  const win = (x0: number, x1: number) => {
    rect(b, x0, -0.32, x1, 0.32, frame);
    b.line(x0, 0.25, 0, x1, 0.25, 0, frame);
    for (let i = 0; i < 3; i++) b.disk(x0 + 0.035 + i * 0.03, 0.285, 0, 0.008, Math.round(8 * k * k), { size: 1.8, aux: -1 });
  };
  // source: ragged plain text
  win(-1.15, -0.5);
  for (let l = 0; l < 8; l++) {
    const len = 0.22 + r() * 0.36;
    b.line(-1.11, 0.19 - l * 0.055, 0, -1.11 + len, 0.19 - l * 0.055, 0, { spacing: 0.0085 / k, size: 1.5, aux: -1 });
  }
  // destination: structured
  win(0.5, 1.15);
  b.line(0.54, 0.19, 0, 0.86, 0.19, 0, { spacing: 0.007 / k, size: 2.6, aux: -1, heat: 0.6 });
  for (let l = 0; l < 5; l++) {
    const y = 0.11 - l * 0.065;
    b.disk(0.56, y, 0, 0.009, Math.round(8 * k * k), { size: 1.9, heat: 0.9, aux: -1 });
    b.line(0.585, y, 0, 0.585 + 0.18 + r() * 0.3, y, 0, { spacing: 0.0085 / k, size: 1.5, aux: -1 });
  }
  // the clipboard
  rect(b, -0.1, -0.15, 0.1, 0.13, { ...frame, size: 1.5 });
  rect(b, -0.045, 0.12, 0.045, 0.16, { ...frame, size: 1.6, heat: 1 });
  for (let l = 0; l < 3; l++) b.line(-0.06, 0.06 - l * 0.05, 0, 0.06, 0.06 - l * 0.05, 0, { spacing: 0.008 / k, size: 1.4, aux: -1 });
  // streamlines
  for (let s = 0; s < 7; s++) {
    const y = 0.18 - s * 0.06;
    curve(b, [-0.5, y], [-0.1, -0.01 + (s - 3) * 0.02], { spacing: 0.008 / k, size: 1.35, flowStart: 0, bend: 0.6 });
    curve(b, [0.1, -0.01 + (s - 3) * 0.02], [0.5, 0.12 - s * 0.045], { spacing: 0.008 / k, size: 1.35, flowStart: 0.45, bend: 0.6 });
  }
  return b.finish();
}

// ═════════════════════════════════════════════════════════════ Colorectal
/** Histology: glands made of cells; a Grad-CAM hotspot marks what the CNN looked at. */
export function buildTissue(N: number) {
  const b = new FormationBuilder(N, 101);
  const r = b.rng;
  const k = densityOf(N);
  const hot = { x: 0.28, y: 0.08, s: 0.2 };
  const heatAt = (x: number, y: number) => Math.exp(-((x - hot.x) ** 2 + (y - hot.y) ** 2) / (2 * hot.s * hot.s));
  const cell = (x: number, y: number, rad: number) => {
    const h = heatAt(x, y);
    const m = Math.max(7, Math.round(rad * 520 * k));
    for (let i = 0; i < m; i++) {
      const a = (i / m) * Math.PI * 2;
      b.add(x + Math.cos(a) * rad, y + Math.sin(a) * rad * 0.85, 0, 1.05, h, -1, -1);
    }
    b.disk(x + gaussian(r) * rad * 0.15, y + gaussian(r) * rad * 0.15, 0, rad * 0.42, Math.round(9 * k * k), { size: 2.1, heat: h, aux: -1 });
  };
  // glands: rings of cells around an empty lumen
  const glands: [number, number, number][] = [
    [-0.72, 0.18, 0.15],
    [-0.35, -0.2, 0.17],
    [-0.1, 0.25, 0.13],
    [0.28, 0.08, 0.16],
    [0.62, -0.24, 0.14],
    [0.78, 0.25, 0.12],
    [-0.8, -0.32, 0.11],
  ];
  const centers: V2[] = [];
  for (const [gx, gy, gr] of glands) {
    const cells = Math.round(gr * 105);
    for (let i = 0; i < cells; i++) {
      const a = (i / cells) * Math.PI * 2;
      const x = gx + Math.cos(a) * gr;
      const y = gy + Math.sin(a) * gr * 0.82;
      centers.push([x, y]);
      cell(x, y, 0.021 + r() * 0.006);
    }
  }
  // stroma: scattered cells by dart-throwing (Poisson-ish)
  let tries = 0;
  while (tries++ < 2600) {
    const x = (r() * 2 - 1) * 1.05;
    const y = (r() * 2 - 1) * 0.5;
    if ((x / 1.08) ** 2 + (y / 0.52) ** 2 > 1) continue;
    if (glands.some(([gx, gy, gr]) => (x - gx) ** 2 + ((y - gy) / 0.82) ** 2 < (gr + 0.04) ** 2)) continue;
    if (centers.some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 < 0.048 * 0.048)) continue;
    centers.push([x, y]);
    cell(x, y, 0.014 + r() * 0.006);
  }
  // the CNN's patch on the hotspot
  brackets(b, hot.x - 0.27, hot.y - 0.25, hot.x + 0.27, hot.y + 0.25, 0.05, { spacing: 0.006 / k, size: 1.6, heat: 1, aux: -1 });
  b.line(hot.x + 0.27, hot.y + 0.25, 0, hot.x + 0.42, hot.y + 0.42, 0, { spacing: 0.008 / k, size: 1.1, heat: 0.8, aux: -1 });
  b.line(hot.x + 0.42, hot.y + 0.42, 0, hot.x + 0.7, hot.y + 0.42, 0, { spacing: 0.008 / k, size: 1.1, heat: 0.8, aux: -1 });
  return b.finish();
}
