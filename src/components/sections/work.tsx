"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

import { Arrow } from "@/components/fx/arrow-link";
import { Kicker } from "@/components/fx/kicker";
import { Scramble } from "@/components/fx/scramble";
import { PROJECTS, type Project } from "@/lib/content";
import { useReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** the two wide cards in the bento */
const WIDE: Record<string, string> = {
  mentolab: "sm:col-span-2",
  colorectal: "lg:col-span-2",
};

export function Work() {
  return (
    <section id="work" className="relative px-5 pt-[18svh] pb-[14svh] sm:px-8 lg:px-[3.2vw]" data-formation="dust">
      <div className="flex items-end justify-between gap-6">
        <div>
          <Kicker>Work</Kicker>
          <h2 className="mt-5 max-w-[16ch] text-[clamp(34px,4.4vw,68px)] leading-[1] tracking-[-0.04em] text-fg">
            Selected <span className="font-pixel-circle">models</span> &amp; products
          </h2>
        </div>
      </div>

      <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((p, i) => (
          <li key={p.slug} className={WIDE[p.slug]}>
            <ProjectCard project={p} index={i} wide={!!WIDE[p.slug]} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectCard({ project: p, index, wide }: { project: Project; index: number; wide: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 160, damping: 18 });
  const sry = useSpring(ry, { stiffness: 160, damping: 18 });

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * (wide ? 3 : 6));
    rx.set(-py * (wide ? 3 : 6));
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={reduce ? { duration: 0 } : { duration: 1.1, delay: (index % 3) * 0.08, ease: EASE }}
      style={{ perspective: 1200 }}
      className="h-full"
    >
      <motion.div style={{ rotateX: srx, rotateY: sry }} className="h-full will-change-transform">
        <Link
          ref={ref}
          href={`/projects/${p.slug}/`}
          onPointerMove={onMove}
          onPointerLeave={reset}
          className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hair bg-ink-2/80 backdrop-blur-[2px] transition-colors duration-500 hover:border-hair-strong"
        >
          {/* the formation still, dot for dot */}
          <div className={cn("relative overflow-hidden bg-ink", wide ? "aspect-[16/10] sm:aspect-[16/5]" : "aspect-[16/10]")}>
            <picture>
              {wide ? <source media="(min-width: 640px)" srcSet={p.thumb.replace(".webp", "-wide.webp")} /> : null}
              <img
                src={p.thumb}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-cover opacity-80 transition-[transform,opacity] duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] group-hover:opacity-100"
              />
            </picture>
            {/* scan line that sweeps the still on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/4 w-1/4 -translate-x-full bg-linear-to-r from-transparent via-signal/20 to-transparent opacity-0 transition-[transform,opacity] duration-[1.1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[620%] group-hover:opacity-100"
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink-2 via-transparent to-transparent" />
            {/* corner ticks */}
            <span aria-hidden className="pointer-events-none absolute top-3 left-3 size-2.5 border-t border-l border-fg/30 transition-colors group-hover:border-signal" />
            <span aria-hidden className="pointer-events-none absolute top-3 right-3 size-2.5 border-t border-r border-fg/30 transition-colors group-hover:border-signal" />
            {p.award ? (
              <span className="hud-sm absolute bottom-3 left-4 inline-flex items-center gap-1.5 rounded-full border border-signal/50 bg-ink/80 px-2.5 py-1 text-hot backdrop-blur">
                <span className="size-1 rounded-full bg-signal" />
                {p.award}
              </span>
            ) : null}
          </div>

          <div className="flex flex-1 items-end justify-between gap-5 p-5 sm:p-6">
            <div className="min-w-0">
              <h3 className="font-pixel-circle text-[clamp(26px,2.3vw,36px)] leading-none text-fg">
                <Scramble text={p.name} duration={700} />
              </h3>
              <p className="mt-3 max-w-[38ch] text-[14.5px] leading-snug text-fg-dim">{p.blurb}</p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-hair-strong text-fg-dim transition-all duration-500 group-hover:border-signal group-hover:bg-signal group-hover:text-black">
              <Arrow external={false} className="-rotate-90" />
            </span>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
