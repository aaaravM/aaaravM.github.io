"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

/** A section's small label: an accent dot, the word, and a hairline that draws in. */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("hud flex items-center gap-3 text-fg-dim", className)}>
      <span className="size-1.5 rounded-full bg-signal" aria-hidden />
      <span className="text-fg">{children}</span>
      <motion.span
        aria-hidden
        className="h-px w-16 origin-left bg-hair-strong"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0 : 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
