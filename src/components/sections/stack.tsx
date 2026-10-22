"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { CLUSTER_TAG } from "@/components/canvas/engine/formations/misc";
import { Kicker } from "@/components/fx/kicker";
import { STACK } from "@/lib/content";
import { useReducedMotion } from "@/lib/reduced-motion";
import { highlightStage } from "@/lib/stage-store";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The résumé's skills, one group per cluster of the particle "embedding space" on
 * the right (above, on narrow screens). Pointing at (or tapping) a group lights its cluster up.
 */
export function Stack() {
  const [active, setActive] = useState<number | null>(null);

  // let go of the particles when the section unmounts (e.g. navigating away mid-hover)
  useEffect(() => () => highlightStage(null), []);

  const pick = (i: number | null) => {
    setActive(i);
    highlightStage(i === null ? null : CLUSTER_TAG + i);
  };

  return (
    <section
      id="stack"
      className="relative flex min-h-svh items-center px-5 py-[14svh] sm:px-8 lg:px-[3.2vw]"
      data-formation="clusters"
      data-fx="0.44"
      data-fs="0.85"
    >
      <div className="relative z-10 w-full wide:max-w-[52%]">
        <Kicker>Stack</Kicker>
        <h2 className="sr-only">Stack</h2>
        <div data-stage-slot aria-hidden className="mt-6 h-[min(60vw,44svh)] wide:hidden" />

        <ul className="mt-4 grid gap-x-10 gap-y-9 sm:grid-cols-2 wide:mt-10" onPointerLeave={() => pick(null)}>
          {STACK.map((g, i) => (
            <Group key={g.name} index={i} group={g} active={active === i} dimmed={active !== null && active !== i} onPick={pick} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Group({
  index,
  group: g,
  active,
  dimmed,
  onPick,
}: {
  index: number;
  group: (typeof STACK)[number];
  active: boolean;
  dimmed: boolean;
  onPick: (i: number | null) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={reduce ? { duration: 0 } : { duration: 1, delay: (index % 2) * 0.08 + Math.floor(index / 2) * 0.06, ease: EASE }}
    >
      <button
        type="button"
        aria-pressed={active}
        onPointerEnter={(e) => e.pointerType === "mouse" && onPick(index)}
        onFocus={() => onPick(index)}
        onBlur={() => onPick(null)}
        onClick={() => onPick(index)}
        className={cn("group block w-full text-left transition-opacity duration-500", dimmed && "opacity-45")}
      >
        <span className="flex items-center gap-2.5 border-b border-hair pb-3">
          <span
            aria-hidden
            className={cn("size-1.5 rounded-full transition-all duration-500", active ? "scale-150 bg-signal" : "bg-fg-faint group-hover:bg-fg-dim")}
          />
          <span className={cn("hud transition-colors duration-500", active ? "text-fg" : "text-fg-dim")}>{g.name}</span>
        </span>
        <span className="mt-3.5 flex flex-wrap gap-1.5">
          {g.items.map((item, k) => (
            <span
              key={item}
              className={cn(
                "inline-flex items-center rounded-full border bg-ink/80 px-2.5 py-1 text-[12.5px] leading-none transition-all duration-500",
                active ? "border-signal/45 text-fg" : "border-hair text-fg-dim",
              )}
              style={{ transitionDelay: active ? `${k * 22}ms` : "0ms" }}
            >
              {item}
            </span>
          ))}
        </span>
        {g.note ? <span className="mt-3 block text-[12.5px] leading-snug text-fg-faint">{g.note}</span> : null}
      </button>
    </motion.li>
  );
}
