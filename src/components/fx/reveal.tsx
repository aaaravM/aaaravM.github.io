"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ElementType, ReactNode } from "react";

import { useReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Fades + un-blurs + lifts children into place the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  blur = 10,
  className,
  once = true,
  ...rest
}: { children: ReactNode; delay?: number; y?: number; blur?: number; className?: string; once?: boolean } & Omit<
  HTMLMotionProps<"div">,
  "children"
>) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: `blur(${blur}px)` }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "0px 0px -12% 0px" }}
      transition={reduce ? { duration: 0 } : { duration: 1.1, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Splits text into words that rise out of a mask, staggered. */
export function SplitReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.045,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  as?: ElementType;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <Tag className={cn("inline", className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className={cn("inline-block", wordClassName)}
            initial={{ y: "115%", rotate: 4 }}
            whileInView={{ y: "0%", rotate: 0 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={reduce ? { duration: 0 } : { duration: 1, delay: delay + i * stagger, ease: EASE }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
