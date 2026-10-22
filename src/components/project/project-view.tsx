"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { Arrow } from "@/components/fx/arrow-link";
import { Kicker } from "@/components/fx/kicker";
import { Magnetic } from "@/components/fx/magnetic";
import { Reveal } from "@/components/fx/reveal";
import { PixelHeading } from "@/components/ui/pixel-heading-character";
import { TextRoll } from "@/components/ui/skiper-ui/skiper58";
import { ALL_PROJECTS, getProject } from "@/lib/content";
import { useReducedMotion } from "@/lib/reduced-motion";
import { useStage } from "@/lib/stage-store";

import { MediaPlate } from "./media-plate";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ProjectView({ slug }: { slug: string }) {
  const reduce = useReducedMotion();
  const p = getProject(slug)!;
  const i = ALL_PROJECTS.findIndex((q) => q.slug === slug);
  const next = ALL_PROJECTS[(i + 1) % ALL_PROJECTS.length];
  const ready = useStage((s) => s.unlocked || !s.webgl);

  const enter = (d: number) => ({
    initial: { opacity: 0, y: 24, filter: "blur(10px)" },
    animate: ready ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined,
    transition: reduce ? { duration: 0 } : { duration: 1.1, delay: 0.15 + d, ease: EASE },
  });

  return (
    <article>
      {/* ── hero: the project's formation on the right */}
      <section
        className="relative flex min-h-svh items-end px-5 pt-28 pb-[12svh] sm:px-8 lg:px-[3.2vw] wide:items-center wide:pb-0"
        data-formation={p.formation}
        data-fx="0.4"
        data-fy="0"
        data-fs="0.9"
        data-mfy="0.42"
        data-mfs="0.7"
      >
        <div className="relative z-10 w-full wide:max-w-[46%]">
          <motion.div {...enter(0)}>
            <Link href="/#work" className="group inline-flex items-center gap-2 text-[13.5px] text-fg-dim transition-colors hover:text-fg">
              <Arrow external={false} className="rotate-90" />
              <TextRoll>All work</TextRoll>
            </Link>
          </motion.div>

          <motion.div {...enter(0.08)} className="mt-10">
            <Kicker>{p.kind}</Kicker>
          </motion.div>

          {/* the wipe clips top and bottom only: a long one-word name (MindEcho.ai) may run past the column */}
          <motion.div
            initial={{ clipPath: "inset(-10% -50vw 100% 0%)", y: 30 }}
            animate={ready ? { clipPath: "inset(-10% -50vw -15% 0%)", y: 0 } : undefined}
            transition={reduce ? { duration: 0 } : { duration: 1.3, delay: 0.25, ease: EASE }}
            className="mt-6"
          >
            <PixelHeading
              as="h1"
              mode="wave"
              restFontIndex={2}
              tabIndex={-1}
              cycleInterval={80}
              staggerDelay={40}
              className="text-[clamp(56px,8.6vw,150px)] leading-[0.86] tracking-[-0.02em] text-fg"
            >
              {p.name}
            </PixelHeading>
          </motion.div>

          {p.award || p.team ? (
            <motion.div {...enter(0.35)} className="mt-6 flex flex-wrap gap-2">
              {p.award ? (
                <span className="hud-sm inline-flex items-center gap-1.5 rounded-full border border-signal/50 bg-signal-soft px-3 py-1.5 text-hot">
                  <span className="size-1 rounded-full bg-signal" />
                  {p.award}
                </span>
              ) : null}
              {p.team ? <span className="hud-sm inline-flex items-center rounded-full border border-hair-strong px-3 py-1.5 text-fg-dim">Team project</span> : null}
            </motion.div>
          ) : null}

          <motion.p {...enter(0.42)} className="mt-7 max-w-[44ch] text-[clamp(17px,1.35vw,20px)] leading-relaxed text-fg-dim">
            {p.summary}
          </motion.p>

          {p.links.length ? (
            <motion.div {...enter(0.5)} className="mt-9 flex flex-wrap gap-3">
              {p.links.map((l, k) => (
                <Magnetic key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      k === 0
                        ? "group flex h-12 items-center gap-3 rounded-full bg-signal px-6 text-[14px] font-medium text-black transition-colors hover:bg-fg"
                        : "group flex h-12 items-center gap-3 rounded-full border border-hair-strong px-6 text-[14px] text-fg transition-colors hover:border-fg"
                    }
                  >
                    <TextRoll>{l.label}</TextRoll>
                    <Arrow />
                  </a>
                </Magnetic>
              ))}
            </motion.div>
          ) : null}
        </div>
      </section>

      {/* ── details: the formation glides left, the facts sit on the right */}
      <section
        className="relative flex min-h-svh items-center px-5 py-[14svh] sm:px-8 lg:px-[3.2vw]"
        data-formation={p.formation}
        data-fx="-0.5"
        data-fy="0"
        data-fs="0.78"
        data-fxmax="-0.04"
      >
        <div className="relative z-10 w-full wide:ml-auto wide:max-w-[48%]">
          <div data-stage-slot aria-hidden className="mb-8 h-[min(62vw,46svh)] wide:hidden" />
          <Kicker>Highlights</Kicker>
          <ul className="mt-7">
            {p.points.map((pt, k) => (
              <li key={k} className="border-t border-hair last:border-b">
                <Reveal delay={k * 0.06} y={16} blur={6} className="flex gap-4 py-4">
                  <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-signal" />
                  <span className="text-[clamp(16px,1.25vw,18.5px)] leading-relaxed text-fg">{pt}</span>
                </Reveal>
              </li>
            ))}
          </ul>

          <Kicker className="mt-12">Built with</Kicker>
          <Reveal className="mt-5 flex flex-wrap gap-2" y={14} blur={6}>
            {p.models.map((m) => (
              <span key={m} className="hud-sm inline-flex items-center rounded-full border border-signal/40 px-3 py-1.5 text-hot">
                {m}
              </span>
            ))}
            {p.stack?.map((s) => (
              <span key={s} className="hud-sm inline-flex items-center rounded-full border border-hair-strong px-3 py-1.5 text-fg-dim">
                {s}
              </span>
            ))}
          </Reveal>

          {p.media ? (
            <Reveal className="mt-12" y={24}>
              <MediaPlate project={p} />
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* ── next: the cloud previews the next project before you click */}
      <section className="relative flex min-h-[85svh] flex-col items-center justify-center px-5 text-center sm:px-8" data-formation={next.formation} data-fx="0" data-fy="-0.05" data-fs="0.8">
        <Kicker className="justify-center">Next project</Kicker>
        <Link href={`/projects/${next.slug}/`} className="group mt-8 flex flex-col items-center">
          <span className="font-pixel-circle text-[clamp(52px,9vw,150px)] leading-[0.9] text-fg transition-colors duration-500 group-hover:text-signal">
            <TextRoll center>{next.name}</TextRoll>
          </span>
          <span className="mt-5 flex items-center gap-3 text-[15px] text-fg-dim transition-colors group-hover:text-fg">
            {next.kind}
            <span className="flex size-9 items-center justify-center rounded-full border border-hair-strong transition-all duration-500 group-hover:border-signal group-hover:bg-signal group-hover:text-black">
              <Arrow external={false} className="-rotate-90" />
            </span>
          </span>
        </Link>
      </section>
    </article>
  );
}
