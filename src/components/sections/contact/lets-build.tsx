"use client";

import { type MotionValue, useMotionValueEvent } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CharacterV1 } from "@/components/ui/skiper-ui/skiper31";
import { cn } from "@/lib/utils";

// noisy → resolved: each glyph denoises through the pixel family as it lands
const FONTS = ["font-pixel-line", "font-pixel-triangle", "font-pixel-grid", "font-pixel-square", "font-pixel-circle"] as const;
const REST = FONTS.length - 1;
const WORDS = ["LET’S", "BUILD"] as const;
const COUNT = WORDS[0].length + 1 + WORDS[1].length; // incl. the space between the words
const CENTER = (COUNT - 1) / 2; // the space

// hover / idle wave: fonts ripple out from the centre and settle back
const TICK_MS = 40;
const HOLD_MS = 68;
const STAGGER_MS = 46;
const WAVE_MS = CENTER * STAGGER_MS + FONTS.length * HOLD_MS;
const IDLE_MS = 5600;

function stageFor(c: number, lag: number) {
  const k = Math.min(1, Math.max(0, (c - lag) / (1 - lag)));
  if (k >= 0.985) return REST;
  return Math.min(REST - 1, Math.floor(k * REST));
}

/**
 * "LET'S BUILD" — Skiper31 CharacterV1 (characters converge from a spread as
 * you scroll) in Geist Pixel. `progress` drives the convergence over `range`.
 */
export function LetsBuild({
  progress,
  range,
  still = false,
  trigger = 0,
  className,
}: {
  progress: MotionValue<number>;
  range: readonly [number, number];
  /** reduced motion: glyphs rest in place */
  still?: boolean;
  /** bump to replay the font wave (e.g. on focus) */
  trigger?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [r0, r1] = range;
  const win = useMemo<[number, number]>(() => [r0, r1], [r0, r1]);

  // global indices across both words, so the space sits at the centre
  const words = useMemo(() => {
    let i = 0;
    return WORDS.map((w, wi) => {
      const glyphs = Array.from(w).map((char) => ({ char, index: i++ }));
      if (wi === 0) i++;
      return glyphs;
    });
  }, []);

  // ── scroll-driven font stage per glyph (re-renders only when a stage changes)
  const [stages, setStages] = useState<number[]>(() => Array(COUNT).fill(still ? REST : 0));
  const stagesRef = useRef(stages);
  const sync = useCallback(
    (v: number) => {
      if (still) return;
      const c = (v - r0) / (r1 - r0);
      const next = Array.from({ length: COUNT }, (_, i) => stageFor(c, (Math.abs(i - CENTER) / CENTER) * 0.24));
      if (next.some((s, i) => s !== stagesRef.current[i])) {
        stagesRef.current = next;
        setStages(next);
      }
    },
    [still, r0, r1],
  );
  useMotionValueEvent(progress, "change", sync);
  useEffect(() => sync(progress.get()), [sync, progress]);
  const settled = stages.every((s) => s === REST);

  // ── font wave (hover, focus, idle)
  const [waveMs, setWaveMs] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const wave = useCallback(() => {
    if (still || !stagesRef.current.every((s) => s === REST)) return;
    clearInterval(timer.current);
    const t0 = performance.now();
    setWaveMs(0);
    timer.current = setInterval(() => {
      const ms = performance.now() - t0;
      if (ms >= WAVE_MS) {
        clearInterval(timer.current);
        setWaveMs(null);
      } else setWaveMs(ms);
    }, TICK_MS);
  }, [still]);
  useEffect(() => () => clearInterval(timer.current), []);
  useEffect(() => {
    if (trigger) wave();
  }, [trigger, wave]);

  // idle ripple while it sits on screen
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || still) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [still]);
  useEffect(() => {
    if (!visible || !settled || still) return;
    const first = setTimeout(wave, 900);
    const id = setInterval(wave, IDLE_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [visible, settled, still, wave]);

  const fontOf = (i: number) => {
    if (waveMs === null) return stages[i];
    const local = waveMs - Math.abs(i - CENTER) * STAGGER_MS;
    if (local < 0) return REST;
    const step = Math.floor(local / HOLD_MS);
    return step >= REST ? REST : step;
  };

  return (
    <span
      ref={ref}
      aria-hidden
      onPointerEnter={wave}
      className={cn("flex select-none items-center justify-center gap-x-[0.38em] max-sm:flex-col", className)}
    >
      {words.map((word, wi) => (
        <span key={wi} className="flex" style={{ perspective: "560px" }}>
          {word.map((g) =>
            still ? (
              <span key={g.index} className={cn("inline-block", FONTS[REST])}>
                {g.char}
              </span>
            ) : (
              <CharacterV1
                key={g.index}
                char={g.char}
                index={g.index}
                centerIndex={CENTER}
                scrollYProgress={progress}
                range={win}
                spread={0.92}
                unit="em"
                twist={40}
                lift={-0.07}
                fade
                className={cn("will-change-transform", FONTS[fontOf(g.index)])}
              />
            ),
          )}
        </span>
      ))}
    </span>
  );
}
