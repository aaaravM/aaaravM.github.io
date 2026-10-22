import { CONSTELLATION } from "@/components/canvas/engine/formations/misc";
import type { FormationLayout } from "@/lib/stage-store";

// Geometry for the awards star chart. Everything on screen is measured in vh
// from the viewport centre (y down) so DOM overlays line up with the WebGL
// stars at any desktop size: 1 world unit = 50vh.

export const FORMATION = "constellation";
export const STARS = CONSTELLATION;

/** star indices left → right: the order they light up */
export const ORDER = STARS.map((_, i) => i).sort((a, b) => STARS[a].x - STARS[b].x);
/** RANK[i] = when star i lights (0 = first) */
export const RANK = STARS.map((_, i) => ORDER.indexOf(i));

/** which way each label hangs off its star: [x, y] in screen space (y = 1 is down) */
export const DIRS = [
  [-1, 1], // 1st Sierra Hacks
  [1, -1], // 2nd Studiio Hacks
  [-1, 1], // Top 23 HackPad
  [1, -1], // Intl. ICSC
  [-1, 1], // 1/50 Stanford seeME
  [1, -1], // TEDx
  [1, 1], // Gold MOEMS
  [1, 1], // 6th Reach for the Stars
] as const satisfies readonly (readonly [1 | -1, 1 | -1])[];

/** the constellation's lines (same edges the particles draw) */
export const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [4, 7],
] as const;

export type StarVh = { x: number; y: number; ring: number };

/** star i in vh from the viewport centre, plus the radius of its particle ring */
export function starVh(l: FormationLayout, i: number): StarVh {
  const s = STARS[i];
  return {
    x: (l.x + s.x * l.s) * 50,
    y: -(l.y + s.y * l.s) * 50,
    ring: (0.014 + s.mag * 0.022) * 2.4 * l.s * 50,
  };
}

/** an elbow leader (diagonal off the ring, then a short run) and where its label sits — vh, relative to the star */
export function leaderOf(ring: number, dir: readonly [number, number]) {
  const [dx, dy] = dir;
  const a = (ring + 0.6) / Math.SQRT2;
  const b = ring / Math.SQRT2 + 3.1;
  const c = b + 2.4;
  return {
    pts: [
      [dx * a, dy * a],
      [dx * b, dy * b],
      [dx * c, dy * b],
    ] as const,
    label: { x: dx * (c + 0.9), y: dy * b },
  };
}

/** both ends pulled back to the rings so a line never crosses a star's core */
export function trim(p: StarVh, q: StarVh) {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const rp = p.ring + 0.7;
  const rq = q.ring + 0.7;
  return { x1: p.x + ux * rp, y1: p.y + uy * rp, x2: q.x - ux * rq, y2: q.y - uy * rq };
}
