import { FormationBuilder, GOLDEN_ANGLE, MODE, PHI, gaussian } from "../builder";

/** Density helper: formations are authored for 24 576 points and thin out gracefully below that. */
export function densityOf(N: number) {
  return Math.sqrt(N / 24576);
}

// ───────────────────────────────────────────────────────────── t = 1000
/** Pure noise — the diffusion starting point. Fills the whole viewport. */
export function buildNoise(N: number) {
  const b = new FormationBuilder(N, 3);
  const r = b.rng;
  const count = Math.floor(N * 0.92);
  for (let i = 0; i < count; i++) {
    const s = r();
    b.add((r() * 2 - 1) * 2.6, (r() * 2 - 1) * 1.25, (r() * 2 - 1) * 0.6, 0.8 + s * s * 3.4, r() < 0.03 ? 0.7 : 0, -1, -1);
  }
  return b.finish();
}

// ───────────────────────────────────────────────────────────── backdrop
/** Just the sky: every point returns to the starfield, with a few slow motes up close. */
export function buildDust(N: number) {
  const b = new FormationBuilder(N, 5);
  const r = b.rng;
  const motes = Math.round(700 * densityOf(N) ** 2);
  for (let i = 0; i < motes; i++) {
    const s = r();
    b.add((r() * 2 - 1) * 2.3, (r() * 2 - 1) * 1.15, -0.4 + r() * 0.7, 0.8 + s * s * 1.6, r() < 0.05 ? 0.5 : 0);
  }
  return b.finish();
}

// ───────────────────────────────────────────────────────────── hero
/**
 * A halftone globe on a screen-fixed dot grid (the planet turns beneath the
 * grid, like a print), wrapped in golden-ratio construction lines: the square
 * that holds the sphere, the φ-rectangle below it and the spiral that winds
 * through both.
 */
export function buildSphere(N: number) {
  const b = new FormationBuilder(N, 11);
  const k = densityOf(N);
  const R = 0.56;

  // 1 · globe
  const sp = 0.0118 / k;
  for (let y = -R; y <= R + 1e-6; y += sp) {
    for (let x = -R; x <= R + 1e-6; x += sp) {
      const r2 = x * x + y * y;
      if (r2 > R * R) continue;
      b.add(x, y, 0, 4.7, 0, -1, R, MODE.SURFACE);
    }
  }

  const fine = { spacing: 0.0062 / k, size: 1.25, aux: -1 };

  // 2 · limb + atmosphere rings
  b.circle(0, 0, R * 1.035, { ...fine, size: 1.1 });
  b.circle(0, 0, R * 1.11, { spacing: 0.016 / k, size: 1.0, aux: -1 });

  // 3 · orbit in the planet's (tilted) equatorial plane — the far half hides behind the globe
  {
    const tilt = 0.41;
    const steps = Math.round(1100 * k);
    const ro = R * 1.55;
    for (let s = 0; s < steps; s++) {
      const a = (s / steps) * Math.PI * 2;
      let x = Math.cos(a) * ro;
      let y = 0;
      let z = Math.sin(a) * ro;
      // tilt about X then a little about Z
      const y1 = y * Math.cos(tilt) - z * Math.sin(tilt);
      const z1 = y * Math.sin(tilt) + z * Math.cos(tilt);
      y = y1;
      z = z1;
      const c = Math.cos(-0.28);
      const sn = Math.sin(-0.28);
      const x2 = x * c - y * sn;
      const y2 = x * sn + y * c;
      x = x2;
      y = y2;
      if (z < 0 && x * x + y * y < R * R * 1.08) continue;
      b.add(x, y, z, z < 0 ? 0.9 : 1.35, 0, -1, -1);
    }
    // a satellite riding the orbit (static — the HUD tracks it)
    const a = 0.62;
    const x = Math.cos(a) * ro;
    let y = 0;
    let z = Math.sin(a) * ro;
    const y1 = y * Math.cos(tilt) - z * Math.sin(tilt);
    const z1 = y * Math.sin(tilt) + z * Math.cos(tilt);
    y = y1;
    z = z1;
    const c = Math.cos(-0.28);
    const sn = Math.sin(-0.28);
    b.disk(x * c - y * sn, x * sn + y * c, z, 0.018, Math.round(26 * k * k), { size: 2.2, heat: 1, aux: -1 });
  }

  // 4 · golden construction: square around the globe + φ-rectangle below
  const w = 2 * R;
  const x0 = -R;
  const x1 = R;
  const yTop = R;
  const yBot = R - w * PHI;
  b.line(x0, yTop, 0, x1, yTop, 0, fine);
  b.line(x1, yTop, 0, x1, yBot, 0, fine);
  b.line(x1, yBot, 0, x0, yBot, 0, fine);
  b.line(x0, yBot, 0, x0, yTop, 0, fine);
  // equator, overshooting the frame like a drafting line
  b.line(-R * 1.42, 0, 0, R * 1.42, 0, 0, { ...fine, spacing: 0.0075 / k });
  // tick marks on the equator
  for (let i = -6; i <= 6; i++) {
    const x = (i / 6) * R * 1.3;
    b.line(x, -0.012, 0, x, 0.012, 0, { ...fine, spacing: 0.006 / k, size: 1.1 });
  }

  // 5 · golden spiral: cut squares top → left → bottom → right, a quarter arc in each
  {
    let rx0 = x0;
    let rx1 = x1;
    let ry0 = yBot;
    let ry1 = yTop;
    let flow = 0;
    for (let n = 0; n < 9; n++) {
      const dir = n % 4;
      if (dir === 0) {
        const s = rx1 - rx0;
        const cy = ry1 - s;
        if (n > 0) b.line(rx0, cy, 0, rx1, cy, 0, fine);
        flow += b.arc(rx1, cy, s, Math.PI / 2, Math.PI, { ...fine, size: 1.45, flowStart: flow });
        ry1 = cy;
      } else if (dir === 1) {
        const s = ry1 - ry0;
        const cx = rx0 + s;
        b.line(cx, ry0, 0, cx, ry1, 0, fine);
        flow += b.arc(cx, ry1, s, Math.PI, Math.PI * 1.5, { ...fine, size: 1.45, flowStart: flow });
        rx0 = cx;
      } else if (dir === 2) {
        const s = rx1 - rx0;
        const cy = ry0 + s;
        b.line(rx0, cy, 0, rx1, cy, 0, fine);
        flow += b.arc(rx0, cy, s, Math.PI * 1.5, Math.PI * 2, { ...fine, size: 1.45, flowStart: flow });
        ry0 = cy;
      } else {
        const s = ry1 - ry0;
        const cx = rx1 - s;
        b.line(cx, ry0, 0, cx, ry1, 0, fine);
        flow += b.arc(cx, ry0, s, 0, Math.PI / 2, { ...fine, size: 1.45, flowStart: flow });
        rx1 = cx;
      }
    }
    // the eye of the spiral
    b.disk((rx0 + rx1) / 2, (ry0 + ry1) / 2, 0, 0.012, Math.round(18 * k * k), { size: 2.4, heat: 1, aux: -1 });
  }

  // 6 · registration crosshairs at the frame corners
  for (const [cx, cy] of [
    [x0, yTop],
    [x1, yTop],
    [x0, yBot],
    [x1, yBot],
  ]) {
    b.line(cx - 0.035, cy, 0, cx + 0.035, cy, 0, { ...fine, size: 1.5 });
    b.line(cx, cy - 0.035, 0, cx, cy + 0.035, 0, { ...fine, size: 1.5 });
  }

  return b.finish();
}

// ───────────────────────────────────────────────────────────── manifesto
/** A 3D multilayer perceptron: layers are rings of neurons, a forward pass sweeps left → right. */
export function buildLattice(N: number) {
  const b = new FormationBuilder(N, 21);
  const k = densityOf(N);
  const layers = [4, 8, 12, 14, 12, 8, 3];
  const L = layers.length;
  const width = 2.0;
  const nodes: [number, number, number][][] = layers.map((n, li) => {
    const x = -width / 2 + (width * li) / (L - 1);
    const r = 0.08 + n * 0.03;
    return Array.from({ length: n }, (_, j) => {
      const a = (j / n) * Math.PI * 2 + li * 0.35;
      return [x, Math.cos(a) * r, Math.sin(a) * r] as [number, number, number];
    });
  });

  // synapses first so neurons draw on top of them
  for (let li = 0; li < L - 1; li++) {
    for (const p of nodes[li]) {
      for (const q of nodes[li + 1]) {
        if (b.rng() > 0.62) continue; // sparse-ish connectivity reads better
        b.line(p[0], p[1], p[2], q[0], q[1], q[2], {
          spacing: 0.024 / k,
          size: 1.0,
          flowStart: p[0] + width / 2,
        });
      }
    }
  }
  // neurons
  nodes.forEach((layer, li) => {
    for (const p of layer) {
      const out = li === L - 1;
      b.ball(p[0], p[1], p[2], out ? 0.034 : 0.024, Math.round((out ? 70 : 38) * k * k), {
        size: out ? 2.4 : 2.0,
        heat: out ? 0.85 : 0,
      });
    }
  });
  return b.finish();
}

// ───────────────────────────────────────────────────────────── finale
/** A two-armed galaxy whose arms are golden spirals (r grows by φ each quarter turn). */
export function buildSpiral(N: number) {
  const b = new FormationBuilder(N, 77);
  const r = b.rng;
  const k = densityOf(N);
  const growth = Math.log(PHI) / (Math.PI / 2);
  const tiltX = -1.05;
  const ct = Math.cos(tiltX);
  const st = Math.sin(tiltX);
  const put = (x: number, y: number, z: number, size: number, heat: number, aux: number) => {
    // incline the disk toward the viewer
    const y1 = y * ct - z * st;
    const z1 = y * st + z * ct;
    b.add(x, y1, z1, size, heat, -1, aux);
  };
  const rotSpeed = (rad: number) => 0.5 / (rad + 0.18) - 1; // aux: inner disk turns faster

  // arms
  const armPts = Math.round(9800 * k * k);
  for (let i = 0; i < armPts; i++) {
    const arm = i % 2;
    const t = Math.pow(r(), 0.8) * 3.4 * Math.PI;
    const rad = 0.035 * Math.exp(growth * t);
    if (rad > 1.25) continue;
    const a = t + arm * Math.PI;
    const spread = 0.01 + rad * 0.055;
    const x = Math.cos(a) * rad + gaussian(r) * spread;
    const z = Math.sin(a) * rad + gaussian(r) * spread;
    const y = gaussian(r) * 0.018;
    const hot = rad < 0.12 ? 0.7 : r() < 0.025 ? 0.6 : 0;
    put(x, y, z, 0.9 + r() * r() * 2.6, hot, rotSpeed(rad));
  }
  // bulge
  const bulge = Math.round(2600 * k * k);
  for (let i = 0; i < bulge; i++) {
    const rad = Math.abs(gaussian(r)) * 0.055;
    const a = r() * Math.PI * 2;
    put(Math.cos(a) * rad, gaussian(r) * 0.03, Math.sin(a) * rad, 1.1 + r() * 1.9, 0.55 + r() * 0.4, rotSpeed(rad));
  }
  // halo of faint stars
  const halo = Math.round(900 * k * k);
  for (let i = 0; i < halo; i++) {
    const rad = 0.2 + Math.pow(r(), 0.5) * 1.3;
    const a = r() * Math.PI * 2;
    put(Math.cos(a) * rad, gaussian(r) * 0.12, Math.sin(a) * rad, 0.8 + r() * 1.2, 0, rotSpeed(rad));
  }
  // a whisper of the hero's construction: φ rectangle around the galaxy
  const fine = { spacing: 0.009 / k, size: 1.0, aux: -1 };
  const W = 1.12;
  const H = W / PHI;
  b.line(-W, H, 0, W, H, 0, fine);
  b.line(W, H, 0, W, -H, 0, fine);
  b.line(W, -H, 0, -W, -H, 0, fine);
  b.line(-W, -H, 0, -W, H, 0, fine);
  b.line(-W + 2 * H, H, 0, -W + 2 * H, -H, 0, fine);
  return b.finish();
}

export { GOLDEN_ANGLE };
