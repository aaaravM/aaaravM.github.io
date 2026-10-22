"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Kicker } from "@/components/fx/kicker";
import { Reveal } from "@/components/fx/reveal";
import { Scramble } from "@/components/fx/scramble";
import { AWARDS, RECOGNITION_LINE } from "@/lib/content";
import { useReducedMotion } from "@/lib/reduced-motion";
import { useFormationPoint, useFormed, useStage } from "@/lib/stage-store";
import { cn } from "@/lib/utils";

import { DIRS, EDGES, FORMATION, RANK, STARS, leaderOf, starVh, trim, type StarVh } from "./recognition/geometry";

const EASE = [0.16, 1, 0.3, 1] as const;
const GLIDE = { type: "spring", stiffness: 70, damping: 17, mass: 1 } as const;
const HAIR = 0.12; // ≈ 1px in the overlay's vh units
const STEP = 0.16; // seconds between stars lighting

export function Recognition() {
  return (
    <section
      id="recognition"
      className="relative min-h-svh px-5 pt-[16svh] pb-[10svh] sm:px-8 lg:px-[3.2vw]"
      data-formation="constellation"
      data-fx="0"
      data-fy="-0.04"
      data-fs="0.82"
    >
      <div className="relative z-10">
        <Kicker>Recognition</Kicker>
        <h2 className="sr-only">Recognition</h2>
        <p className="mt-5 text-[clamp(20px,2vw,30px)] leading-tight tracking-[-0.02em] text-fg">{RECOGNITION_LINE}</p>
      </div>

      <div data-stage-slot aria-hidden className="mt-8 h-[min(52vw,40svh)] wide:hidden" />

      {/* phones / tablets: a plain grid */}
      <ul className="relative z-10 mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hair bg-hair sm:grid-cols-4 wide:sr-only">
        {AWARDS.map((a, i) => (
          <li key={a.title} className="bg-ink-2/90 p-4">
            <Reveal delay={(i % 2) * 0.06} y={14} blur={6}>
              <div className="font-pixel-circle text-[26px] leading-none text-fg">{a.rank}</div>
              <div className="mt-2.5 text-[14px] text-fg">{a.title}</div>
              <div className="mt-1 text-[12.5px] text-fg-faint">{a.note}</div>
            </Reveal>
          </li>
        ))}
      </ul>

      <Sky />
    </section>
  );
}

/** Desktop: the awards light up star by star over the particle constellation. */
function Sky() {
  const l = useStage((s) => s.layouts[FORMATION]);
  const formed = useFormed(FORMATION);
  const [hover, setHover] = useState<number | null>(null);
  if (!l) return null;
  const S = STARS.map((_, i) => starVh(l, i));
  const delayOf = (i: number) => 0.1 + RANK[i] * STEP;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 hidden wide:block">
      <AnimatePresence>
        {formed &&
          S.map((s, i) => (
            <motion.span
              key={`halo-${i}`}
              className="absolute top-1/2 left-1/2"
              style={{ x: `${s.x}vh`, y: `${s.y}vh` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.9, delay: delayOf(i) }}
            >
              <span className="absolute size-[9vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--accent-soft),transparent_58%)] opacity-70" />
              <motion.span
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-signal"
                style={{ width: `${s.ring * 2}vh`, height: `${s.ring * 2}vh` }}
                initial={{ scale: 0.85, opacity: 0.95 }}
                animate={{ scale: 2.9, opacity: 0 }}
                transition={{ duration: 1.5, delay: delayOf(i), ease: [0.2, 0.7, 0.3, 1] }}
              />
            </motion.span>
          ))}
      </AnimatePresence>

      <svg viewBox="-50 -50 100 100" fill="none" className="absolute top-1/2 left-1/2 size-[100vh] -translate-x-1/2 -translate-y-1/2 overflow-visible">
        <AnimatePresence>
          {formed &&
            EDGES.map(([a, b]) => {
              const later = RANK[a] < RANK[b] ? b : a;
              const t = later === b ? trim(S[a], S[b]) : trim(S[b], S[a]);
              return (
                <motion.line
                  key={`edge-${a}-${b}`}
                  {...t}
                  stroke="var(--accent)"
                  strokeOpacity={0.5}
                  strokeWidth={HAIR}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.9, delay: delayOf(later), ease: EASE }}
                />
              );
            })}
          {formed &&
            S.map((s, i) => {
              const L = leaderOf(s.ring, DIRS[i]);
              const pts = L.pts.map(([x, y]) => `${(s.x + x).toFixed(3)},${(s.y + y).toFixed(3)}`).join(" ");
              return (
                <motion.polyline
                  key={`leader-${i}`}
                  points={pts}
                  strokeWidth={HAIR}
                  className={cn("transition-[stroke] duration-500", hover === i ? "stroke-signal" : "stroke-fg-faint")}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.6, delay: delayOf(i) + 0.1, ease: EASE }}
                />
              );
            })}
        </AnimatePresence>
      </svg>

      <AnimatePresence>{formed && hover !== null ? <Reticle key="reticle" id={hover} s={S[hover]} /> : null}</AnimatePresence>

      {AWARDS.map((a, i) => (
        <StarLabel key={a.title} i={i} on={formed} active={hover === i} ring={S[i].ring} delay={delayOf(i)} onHover={setHover} />
      ))}
    </div>
  );
}

function Reticle({ id, s }: { id: number; s: StarVh }) {
  const pos = { x: `${s.x}vh`, y: `${s.y}vh` };
  return (
    <motion.div
      className="absolute top-1/2 left-1/2"
      initial={{ ...pos, opacity: 0 }}
      animate={{ ...pos, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      transition={{ x: GLIDE, y: GLIDE, opacity: { duration: 0.5 } }}
    >
      <motion.div
        key={id}
        className="absolute size-[10.5vh] -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 1.55, rotate: -45, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
      >
        <svg viewBox="-10 -10 20 20" fill="none" className="size-full overflow-visible">
          <path d="M-10 -5V-10H-5M5 -10H10V-5M10 5V10H5M-5 10H-10V5" stroke="var(--accent)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

function StarLabel({
  i,
  on,
  active,
  ring,
  delay,
  onHover,
}: {
  i: number;
  on: boolean;
  active: boolean;
  ring: number;
  delay: number;
  onHover: (i: number | null) => void;
}) {
  const reduce = useReducedMotion();
  const a = AWARDS[i];
  const at = useFormationPoint(FORMATION, STARS[i].x, STARS[i].y);
  if (!at) return null;
  const dir = DIRS[i];
  const left = dir[0] < 0;
  const L = leaderOf(ring, dir);
  return (
    <div className="absolute" style={at}>
      <div className={cn("absolute w-max -translate-y-1/2", left && "-translate-x-full text-right")} style={{ left: `${L.label.x}vh`, top: `${L.label.y}vh` }}>
        <AnimatePresence>
          {on ? (
            <motion.div
              key="label"
              className="pointer-events-auto"
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: left ? 16 : -16, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, transition: { duration: 0.3, ease: EASE } }}
              transition={{ duration: 0.9, delay: delay + 0.2, ease: EASE }}
              onPointerEnter={() => onHover(i)}
              onPointerLeave={() => onHover(null)}
            >
              <div className={cn("font-pixel-circle text-[clamp(20px,3.2vh,34px)] leading-[0.9] transition-colors duration-500", active ? "text-signal" : "text-fg")}>
                <Scramble text={a.rank} duration={800} delay={Math.round((delay + 0.2) * 1000)} />
              </div>
              <div className="mt-1.5 text-[clamp(12px,1.6vh,15px)] leading-tight text-fg">{a.title}</div>
              <div className="mt-0.5 text-[clamp(11px,1.35vh,13px)] text-fg-dim">{a.note}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
