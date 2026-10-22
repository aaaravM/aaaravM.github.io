"use client";

import { useCallback, useEffect, useRef, useState, type ElementType } from "react";

import { cn } from "@/lib/utils";
import { useStage } from "@/lib/stage-store";

const GLYPHS = "01#%&*+=<>/\\|_-:;[]{}?!$@";

type Props = {
  text: string;
  className?: string;
  as?: ElementType;
  /** when to decode: on first view, after the intro, or only on hover */
  trigger?: "view" | "intro" | "hover";
  duration?: number;
  delay?: number;
  /** re-run on hover */
  hover?: boolean;
};

/** Text that decodes out of noise — like a model sampling its way to an answer. */
export function Scramble({ text, className, as: Tag = "span", trigger = "view", duration = 900, delay = 0, hover = true }: Props) {
  const ref = useRef<HTMLElement>(null);
  // null → show the real text; a string → a frame of the decode animation
  const [frame, setFrame] = useState<string | null>(null);
  const raf = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const played = useRef(false);
  const introDone = useStage((s) => s.introDone || s.intro > 0.35);

  const run = useCallback(
    (wait = 0) => {
      if (typeof window === "undefined") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      cancelAnimationFrame(raf.current);
      clearTimeout(timer.current);
      const chars = Array.from(text);
      const n = chars.length;
      const scrambled = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      setFrame(chars.map((c) => (c === " " ? " " : scrambled())).join(""));
      timer.current = setTimeout(() => {
        const start = performance.now();
        let lastPaint = 0;
        const tick = (now: number) => {
          const t = (now - start) / duration;
          if (now - lastPaint > 32 || t >= 1) {
            lastPaint = now;
            let s = "";
            for (let i = 0; i < n; i++) {
              const c = chars[i];
              if (c === " ") s += " ";
              else s += t >= (i / n) * 0.65 + 0.35 ? c : scrambled();
            }
            setFrame(s);
          }
          if (t < 1) raf.current = requestAnimationFrame(tick);
          else setFrame(null);
        };
        raf.current = requestAnimationFrame(tick);
      }, wait);
    },
    [text, duration],
  );

  useEffect(() => {
    if (trigger !== "view") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !played.current) {
          played.current = true;
          run(delay);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trigger, run, delay]);

  useEffect(() => {
    if (trigger === "intro" && introDone && !played.current) {
      played.current = true;
      run(delay);
    }
  }, [trigger, introDone, run, delay]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(timer.current);
    },
    [],
  );

  return (
    <Tag
      ref={ref}
      className={cn("relative inline-block", className)}
      aria-label={text}
      onMouseEnter={hover ? () => run(0) : undefined}
    >
      <span aria-hidden>{frame ?? text}</span>
    </Tag>
  );
}
