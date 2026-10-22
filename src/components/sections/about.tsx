"use client";

import { motion } from "motion/react";

import { Kicker } from "@/components/fx/kicker";
import { ABOUT } from "@/lib/content";
import { useReducedMotion } from "@/lib/reduced-motion";

import { Manifesto } from "./about/manifesto";

const EASE = [0.16, 1, 0.3, 1] as const;

export function About() {
  const reduce = useReducedMotion();
  return (
    <section
      id="about"
      className="relative flex min-h-svh items-center px-5 py-[14svh] sm:px-8 lg:px-[3.2vw]"
      data-formation="lattice"
      data-fx="0.42"
      data-fs="0.8"
    >
      <div className="relative z-10 w-full wide:max-w-[46%]">
        <Kicker>About</Kicker>
        <div data-stage-slot aria-hidden className="mt-6 h-[min(50vw,40svh)] wide:hidden" />
        <Manifesto text={ABOUT.statement} className="mt-6 wide:mt-8" />

        <dl className="mt-12 max-w-xl">
          {ABOUT.facts.map((f, i) => (
            <motion.div
              key={f.k}
              className="group relative grid grid-cols-[7.5rem_1fr] items-baseline gap-4 border-t border-hair py-4 last:border-b"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={reduce ? { duration: 0 } : { duration: 0.9, delay: i * 0.08, ease: EASE }}
            >
              {/* a highlight that sweeps the row on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-white/[0.035] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
              />
              <dt className="hud relative text-fg-faint">{f.k}</dt>
              <dd className="relative flex flex-wrap items-baseline justify-between gap-x-4 text-[clamp(18px,1.6vw,24px)] tracking-[-0.02em] text-fg">
                <span className="transition-transform duration-500 group-hover:translate-x-1.5">{f.v}</span>
                {f.note ? <span className="text-[13.5px] tracking-normal text-fg-faint">{f.note}</span> : null}
              </dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
}
