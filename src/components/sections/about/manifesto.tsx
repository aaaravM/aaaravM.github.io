"use client";

import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { splitTextByPixelWords } from "@/components/ui/pixel-paragraph-words";
import { useReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

const PIXEL_WORDS = ["multi-agent", "retrieval", "interface"] as const;
const FONTS = ["font-pixel-square", "font-pixel-grid", "font-pixel-circle", "font-pixel-triangle", "font-pixel-line"] as const;
const REST = 2; // circle — the site's signature dot face

type Token = { text: string; pixel: boolean };

/** Words (pixel phrases kept whole); a lone dash rides with the word before it so no line opens on "—". */
function tokenize(text: string): Token[] {
  const out: Token[] = [];
  for (const seg of splitTextByPixelWords(text, PIXEL_WORDS)) {
    if (seg.type === "pixel") {
      out.push({ text: seg.text, pixel: true });
      continue;
    }
    const glued = !/^\s/.test(seg.text);
    seg.text.split(/\s+/).forEach((w, i) => {
      if (!w) return;
      const prev = out[out.length - 1];
      if (prev && i === 0 && glued) prev.text += w;
      else if (prev && /^[—–]$/.test(w)) prev.text += ` ${w}`;
      else out.push({ text: w, pixel: false });
    });
  }
  return out;
}

/**
 * The manifesto streams in like tokens off a model: each word goes from faint to
 * full as you scroll, an accent caret rides the frontier, and the three key words
 * denoise from a faint pixel grid into the dot face.
 */
export function Manifesto({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduce = !!useReducedMotion();
  const tokens = useMemo(() => tokenize(text), [text]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.88", "end 0.7"] });
  const n = tokens.length;

  return (
    <h2
      ref={ref}
      id="about-title"
      className={cn(
        "font-sans text-[clamp(32px,3.9vw,60px)] leading-[1.03] font-normal tracking-[-0.038em] text-pretty",
        className,
      )}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {tokens.map((t, i) => (
          <Fragment key={i}>
            <Word token={t} progress={scrollYProgress} from={i / n} to={(i + 1) / n} last={i === n - 1} reduce={reduce} />
            {i < n - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </h2>
  );
}

function Word({
  token,
  progress,
  from,
  to,
  last,
  reduce,
}: {
  token: Token;
  progress: MotionValue<number>;
  from: number;
  to: number;
  last: boolean;
  reduce: boolean;
}) {
  const slot = to - from;
  // each word lights over a window a little wider than its slot, so neighbours overlap
  const lit = useTransform(progress, [from - slot * 0.7, to], [0, 1]);
  const dim = useTransform(lit, [0, 1], [0.34, 1]);
  const ghost = useTransform(lit, [0, 1], [1, 0]);
  // the caret hops word to word (a near-instant hand-off, never two at once)
  const e = slot * 0.04;
  const caret = useTransform(progress, last ? [from, from + e] : [from, from + e, to, to + e], last ? [0, 1] : [0, 1, 1, 0]);

  return (
    <span className="relative inline-block whitespace-nowrap">
      {token.pixel ? (
        <>
          <motion.span className="font-pixel-grid text-fg-faint" style={{ opacity: reduce ? 0 : ghost }}>
            {token.text}
          </motion.span>
          <motion.span className="absolute inset-0 text-fg" style={{ opacity: reduce ? 1 : lit }}>
            <PixelChars text={token.text} progress={progress} at={from + slot * 0.25} reduce={reduce} />
          </motion.span>
        </>
      ) : (
        <motion.span className="text-fg" style={{ opacity: reduce ? 1 : dim }}>
          {token.text}
        </motion.span>
      )}
      {reduce ? null : (
        <motion.span
          className="pointer-events-none absolute top-[0.17em] left-full ml-[0.09em] h-[0.76em] w-[0.075em]"
          style={{ opacity: caret }}
        >
          <span className="block size-full animate-blink bg-signal" />
        </motion.span>
      )}
    </span>
  );
}

/** Per-character pixel faces that cascade through the family once, then settle on the dot face. */
function PixelChars({ text, progress, at, reduce }: { text: string; progress: MotionValue<number>; at: number; reduce: boolean }) {
  const chars = useMemo(() => Array.from(text), [text]);
  const [fonts, setFonts] = useState<number[]>(() => chars.map(() => REST));
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const on = useRef(false);

  const play = useCallback(() => {
    if (reduce) return;
    clearInterval(timer.current);
    const t0 = performance.now();
    const tick = () => {
      const t = performance.now() - t0;
      let busy = false;
      const next = chars.map((_, i) => {
        const cycles = Math.floor(Math.max(0, t - i * 34) / 64);
        if (cycles >= 6) return REST;
        busy = true;
        return (i + cycles + 3) % FONTS.length;
      });
      setFonts(next);
      if (!busy) clearInterval(timer.current);
    };
    tick();
    timer.current = setInterval(tick, 40);
  }, [chars, reduce]);

  useMotionValueEvent(progress, "change", (v) => {
    const next = v >= at;
    if (next === on.current) return;
    on.current = next;
    if (next) play();
  });

  useEffect(() => () => clearInterval(timer.current), []);

  return (
    <span onMouseEnter={play}>
      {chars.map((c, i) => (
        <span key={i} className={FONTS[fonts[i]]}>
          {c}
        </span>
      ))}
    </span>
  );
}
