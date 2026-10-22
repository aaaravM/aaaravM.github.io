import { FormationBuilder, gaussian } from "../builder";
import { densityOf } from "./core";

// ═════════════════════════════════════════════════════════════ awards
/** Award "stars" joined into a constellation over a faint celestial grid. */
export const CONSTELLATION = [
  { x: -1.02, y: 0.2, mag: 1.0 },
  { x: -0.68, y: 0.42, mag: 0.8 },
  { x: -0.34, y: 0.16, mag: 0.75 },
  { x: -0.02, y: 0.34, mag: 0.95 },
  { x: 0.3, y: 0.02, mag: 0.7 },
  { x: 0.62, y: 0.3, mag: 0.65 },
  { x: 0.92, y: -0.06, mag: 0.6 },
  { x: 0.5, y: -0.38, mag: 0.55 },
] as const;

export function buildConstellation(N: number) {
  const b = new FormationBuilder(N, 111);
  const r = b.rng;
  const k = densityOf(N);
  // celestial grid: declination arcs + right-ascension meridians
  for (let i = -3; i <= 3; i++) {
    const yc = i * 0.2;
    const steps = Math.round(320 * k);
    for (let s = 0; s <= steps; s++) {
      const x = -1.35 + (2.7 * s) / steps;
      b.add(x, yc + 0.06 * (1 - (x / 1.35) ** 2) * Math.sign(i || 1), -0.2, 0.85, 0, -1, -1);
    }
  }
  for (let i = -6; i <= 6; i++) {
    const steps = Math.round(110 * k);
    for (let s = 0; s <= steps; s++) {
      const y = -0.68 + (1.36 * s) / steps;
      const x = i * 0.22 + i * 0.04 * (y * y);
      b.add(x, y, -0.2, 0.8, 0, -1, -1);
    }
  }
  // constellation lines (pulses travel star to star)
  let flow = 0;
  for (let i = 0; i < CONSTELLATION.length - 1; i++) {
    const p = CONSTELLATION[i];
    const q = CONSTELLATION[i === 5 ? 6 : i + 1];
    flow += b.line(p.x, p.y, 0, q.x, q.y, 0, { spacing: 0.012 / k, size: 1.2, flowStart: flow, aux: -1 });
  }
  b.line(CONSTELLATION[4].x, CONSTELLATION[4].y, 0, CONSTELLATION[7].x, CONSTELLATION[7].y, 0, { spacing: 0.012 / k, size: 1.2, flowStart: 1.6, aux: -1 });
  // the stars themselves
  CONSTELLATION.forEach((s, i) => {
    const rad = 0.014 + s.mag * 0.022;
    const heat = i === 0 ? 1 : i === 3 ? 0.8 : 0.2;
    b.disk(s.x, s.y, 0, rad, Math.round((30 + s.mag * 60) * k * k), { size: 2.6, heat, aux: -1, sizeFalloff: 0.5 });
    b.circle(s.x, s.y, rad * 2.4, { spacing: 0.008 / k, size: 1.1, heat: heat * 0.6, aux: -1 });
    const spike = rad * 3.6;
    b.line(s.x - spike, s.y, 0, s.x + spike, s.y, 0, { spacing: 0.006 / k, size: 1.15, heat, aux: -1 });
    b.line(s.x, s.y - spike, 0, s.x, s.y + spike, 0, { spacing: 0.006 / k, size: 1.15, heat, aux: -1 });
  });
  // dust
  const dust = Math.round(2600 * k * k);
  for (let i = 0; i < dust; i++) {
    const s = r();
    b.add((r() * 2 - 1) * 1.4, (r() * 2 - 1) * 0.7, -0.3 + r() * 0.2, 0.7 + s * s * 2.2, 0, -1, -1);
  }
  return b.finish();
}

// ═════════════════════════════════════════════════════════════ stack
/**
 * Skills as an embedding space: one cluster per résumé category, sized by how many
 * skills it holds. Every point carries its cluster id (aux = CLUSTER_TAG + k) so the
 * shader can light one cluster up while the DOM hovers its category.
 */
export const CLUSTER_TAG = 10;
export const CLUSTERS = [
  { c: [-0.66, 0.34, 0.12], n: 6 },
  { c: [0.02, 0.42, -0.16], n: 12 },
  { c: [0.68, 0.3, 0.16], n: 7 },
  { c: [-0.6, -0.33, -0.18], n: 8 },
  { c: [0.0, -0.28, 0.22], n: 10 },
  { c: [0.66, -0.36, -0.1], n: 7 },
] as const;

export function buildClusters(N: number) {
  const b = new FormationBuilder(N, 121);
  const r = b.rng;
  const k = densityOf(N);
  // faint "similarity" links between related clusters, drawn first so clusters sit on top
  const links: [number, number][] = [
    [1, 4],
    [1, 5],
    [4, 5],
    [0, 1],
    [2, 3],
    [0, 2],
    [3, 4],
  ];
  for (const [a, q] of links) {
    const A = CLUSTERS[a].c;
    const B = CLUSTERS[q].c;
    b.line(A[0], A[1], A[2], B[0], B[1], B[2], { spacing: 0.02 / k, size: 0.95, flowStart: r() * 2 });
  }
  CLUSTERS.forEach((cl, ci) => {
    const tag = CLUSTER_TAG + ci;
    const spread = 0.07 + Math.sqrt(cl.n) * 0.028;
    const pts = Math.round(cl.n * 230 * k * k);
    for (let i = 0; i < pts; i++) {
      const g = [gaussian(r), gaussian(r), gaussian(r)];
      const d = Math.hypot(g[0], g[1], g[2]);
      b.add(cl.c[0] + g[0] * spread * 1.2, cl.c[1] + g[1] * spread * 0.85, cl.c[2] + g[2] * spread, 0.9 + Math.max(0, 1.7 - d * 0.6), 0, -1, tag);
    }
    b.ball(cl.c[0], cl.c[1], cl.c[2], 0.03, Math.round(50 * k * k), { size: 2.4, aux: tag });
  });
  // faint axes: it is a space, after all
  const ax = { spacing: 0.014 / k, size: 0.9 };
  b.line(-0.98, 0, 0, 0.98, 0, 0, ax);
  b.line(0, -0.66, 0, 0, 0.66, 0, ax);
  b.line(0, 0, -0.6, 0, 0, 0.6, ax);
  return b.finish();
}

// ═════════════════════════════════════════════════════════════ logrthm.ai
/** y = log(x): the studio's namesake, with its seven shipped apps riding the curve. */
export const LOG_APPS = ["MentoLab", "PathLearn", "NeuroFlow", "SmartFlow", "MindEcho", "ExoML", "Colorectal"] as const;

export function logPoint(i: number): [number, number] {
  const x = 0.12 + (i + 0.6) * 0.5;
  return [-1.05 + x * 0.6, -0.42 + Math.log(x / 0.12) * 0.24];
}

export function buildLog(N: number) {
  const b = new FormationBuilder(N, 131);
  const k = densityOf(N);
  const ox = -1.05;
  const oy = -0.42;
  // axes with arrowheads
  const ax = { spacing: 0.007 / k, size: 1.3, aux: -1 };
  b.line(ox, oy, 0, 1.15, oy, 0, ax);
  b.line(ox, oy, 0, ox, 0.62, 0, ax);
  b.line(1.15, oy, 0, 1.12, oy + 0.018, 0, ax);
  b.line(1.15, oy, 0, 1.12, oy - 0.018, 0, ax);
  b.line(ox, 0.62, 0, ox - 0.018, 0.59, 0, ax);
  b.line(ox, 0.62, 0, ox + 0.018, 0.59, 0, ax);
  // grid
  for (let i = 1; i <= 7; i++) {
    const x = ox + i * 0.3;
    b.line(x, oy, 0, x, 0.55, 0, { spacing: 0.03 / k, size: 0.85, aux: -1 });
  }
  for (let j = 1; j <= 4; j++) {
    const y = oy + j * 0.24;
    b.line(ox, y, 0, 1.1, y, 0, { spacing: 0.03 / k, size: 0.85, aux: -1 });
  }
  // the curve — dense, with a forward pulse
  const steps = Math.round(900 * k);
  let flow = 0;
  let prev: [number, number] | null = null;
  for (let s = 0; s <= steps; s++) {
    const x = 0.12 + (s / steps) * 3.45;
    const px = ox + x * 0.6;
    const py = oy + Math.log(x / 0.12) * 0.24;
    if (py > 0.62) break;
    if (prev) flow += Math.hypot(px - prev[0], py - prev[1]);
    prev = [px, py];
    b.add(px, py, 0, 2.1, 0.25, flow, -1);
  }
  // seven apps
  LOG_APPS.forEach((_, i) => {
    const [x, y] = logPoint(i);
    b.disk(x, y, 0, 0.02, Math.round(34 * k * k), { size: 2.5, heat: i === 0 ? 1 : 0.5, aux: -1 });
    b.circle(x, y, 0.042, { spacing: 0.006 / k, size: 1.1, heat: 0.4, aux: -1 });
    b.line(x, y - 0.045, 0, x, oy, 0, { spacing: 0.014 / k, size: 0.95, aux: -1 });
  });
  return b.finish();
}

// ═════════════════════════════════════════════════════════════ FTC
/** A 6×6-tile FTC field seen from above, with an autonomous spline and the robot riding it. */
export function buildField(N: number) {
  const b = new FormationBuilder(N, 141);
  const k = densityOf(N);
  const S = 1.08; // field half-size
  const tile = (2 * S) / 6;
  // tile seams (pre-tilted toward the viewer for a perspective read)
  const tilt = 0.9;
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  // far edge of the field leans away from the camera
  const put = (x: number, y: number, size: number, heat = 0, flow = -1, aux = -1) => {
    b.add(x, y * st * 0.55, -y * ct * 0.55, size, heat, flow, aux);
  };
  for (let i = 0; i <= 6; i++) {
    const v = -S + i * tile;
    const n = Math.round(240 * k);
    for (let s = 0; s <= n; s++) {
      const u = -S + (2 * S * s) / n;
      const edge = i === 0 || i === 6;
      put(v, u, edge ? 1.5 : 1.0);
      put(u, v, edge ? 1.5 : 1.0);
    }
  }
  // the autonomous path: a smooth Catmull-Rom spline through waypoints
  const wp: [number, number][] = [
    [-0.9, -0.9],
    [-0.5, -0.35],
    [-0.62, 0.3],
    [0.05, 0.62],
    [0.55, 0.2],
    [0.35, -0.45],
    [0.85, -0.78],
  ];
  const cr = (p0: number, p1: number, p2: number, p3: number, t: number) =>
    0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  let flow = 0;
  let prev: [number, number] | null = null;
  for (let i = 0; i < wp.length - 1; i++) {
    const p0 = wp[Math.max(0, i - 1)];
    const p1 = wp[i];
    const p2 = wp[i + 1];
    const p3 = wp[Math.min(wp.length - 1, i + 2)];
    const n = Math.round(110 * k);
    for (let s = 0; s < n; s++) {
      const t = s / n;
      const x = cr(p0[0], p1[0], p2[0], p3[0], t);
      const y = cr(p0[1], p1[1], p2[1], p3[1], t);
      if (prev) flow += Math.hypot(x - prev[0], y - prev[1]);
      prev = [x, y];
      put(x, y, 2.0, 0.9, flow);
    }
  }
  // waypoints
  for (const [x, y] of wp) {
    const n = Math.round(40 * k);
    for (let s = 0; s < n; s++) {
      const a = (s / n) * Math.PI * 2;
      put(x + Math.cos(a) * 0.045, y + Math.sin(a) * 0.045, 1.2, 0.5);
    }
  }
  // the robot: an 18-inch square with a heading line, parked at the end
  const [rx, ry] = wp[wp.length - 1];
  const h = 0.085;
  const n = Math.round(60 * k);
  for (let s = 0; s <= n; s++) {
    const u = -h + (2 * h * s) / n;
    put(rx + u, ry - h, 1.8, 1);
    put(rx + u, ry + h, 1.8, 1);
    put(rx - h, ry + u, 1.8, 1);
    put(rx + h, ry + u, 1.8, 1);
  }
  for (let s = 0; s <= 20; s++) put(rx + (s / 20) * 0.16, ry + (s / 20) * 0.1, 1.5, 1);
  return b.finish();
}
