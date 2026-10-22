"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GLYPHS = "01#%&*+=<>/\\|_-:;[]{}?!$@";

/**
 * The same decode as fx/Scramble, but triggered from outside (e.g. hovering a
 * whole row). Returns the text to show and a function that replays the decode.
 */
export function useScramble(text: string, duration = 650) {
  // null → show the real text; a string → one frame of the decode
  const [frame, setFrame] = useState<string | null>(null);
  const raf = useRef(0);

  const run = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAnimationFrame(raf.current);
    const chars = Array.from(text);
    const n = chars.length;
    const start = performance.now();
    let last = -1;
    const tick = (now: number) => {
      const t = (now - start) / duration;
      if (now - last > 32 || t >= 1) {
        last = now;
        let s = "";
        for (let i = 0; i < n; i++) {
          const c = chars[i];
          s += c === " " || t >= (i / n) * 0.6 + 0.4 ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        setFrame(s);
      }
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setFrame(null);
    };
    raf.current = requestAnimationFrame(tick);
  }, [text, duration]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return [frame ?? text, run] as const;
}
