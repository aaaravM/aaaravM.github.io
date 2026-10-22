"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { Arrow } from "@/components/fx/arrow-link";
import { Magnetic } from "@/components/fx/magnetic";
import { Scramble } from "@/components/fx/scramble";
import { PixelHeading } from "@/components/ui/pixel-heading-character";
import { TextRoll } from "@/components/ui/skiper-ui/skiper58";
import { LINKS, PROFILE } from "@/lib/content";
import { useReducedMotion } from "@/lib/reduced-motion";
import { useStage } from "@/lib/stage-store";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const intro = useStage((s) => s.intro);
  const introDone = useStage((s) => s.introDone);
  const webgl = useStage((s) => s.webgl);
  const show = introDone || intro > 0.28 || !webgl;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -160]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const enter = (d: number) => ({
    initial: { opacity: 0, y: 26, filter: "blur(10px)" },
    animate: show ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined,
    transition: { duration: 1.2, delay: d, ease: EASE },
  });

  return (
    <section
      id="top"
      ref={ref}
      className="relative h-svh min-h-[620px] w-full overflow-hidden"
      data-formation="sphere"
      data-fx="0.4"
      data-fy="0.3"
      data-fs="0.9"
      data-mfy="0.42"
      data-mfs="0.62"
    >
      <h1 className="sr-only">
        {PROFILE.name} — {PROFILE.roles.join(", ")}
      </h1>

      <motion.div style={{ y, opacity: fade }} className="relative z-10 flex h-full flex-col justify-end px-5 pb-[14vh] sm:px-8 wide:justify-center wide:pb-0 wide:pl-[3.2vw]">
        <div aria-hidden className="select-none">
          <motion.div
            initial={{ clipPath: "inset(0% 0% 100% 0%)", y: 40 }}
            animate={show ? { clipPath: "inset(0% 0% 0% 0%)", y: 0 } : undefined}
            transition={{ duration: 1.4, delay: 0.05, ease: EASE }}
          >
            <PixelHeading
              as="div"
              mode="wave"
              restFontIndex={2}
              tabIndex={-1}
              cycleInterval={85}
              staggerDelay={45}
              className="text-[clamp(88px,15.8vw,268px)] leading-[0.78] tracking-[-0.03em] text-fg"
            >
              {PROFILE.first}
            </PixelHeading>
          </motion.div>
          <motion.div {...enter(0.25)} className="mt-[0.6vw] font-pixel-grid text-[clamp(28px,5.35vw,90px)] leading-[0.9] tracking-[0.01em] text-fg-dim">
            <Scramble text={PROFILE.last} trigger="intro" delay={350} duration={1300} hover />
          </motion.div>
        </div>

        <motion.p {...enter(0.45)} className="mt-8 max-w-[30rem] text-[clamp(18px,1.55vw,23px)] leading-[1.35] text-balance text-fg">
          {PROFILE.tagline} <span className="text-fg-dim">{PROFILE.taglineDim}</span>
        </motion.p>

        <motion.div {...enter(0.55)} className="hud mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-fg-dim">
          {PROFILE.roles.map((r, i) => (
            <span key={r} className="flex items-center gap-3">
              {i > 0 ? <span className="text-fg-faint">/</span> : null}
              <span className={i === 0 ? "text-fg" : undefined}>{r}</span>
            </span>
          ))}
        </motion.div>

        <motion.div {...enter(0.68)} className="mt-9 flex flex-wrap items-center gap-3">
          <Magnetic>
            <a
              href={LINKS.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-12 items-center gap-3 rounded-full bg-signal px-6 text-[14px] font-medium text-black transition-colors hover:bg-fg"
            >
              <TextRoll>Résumé</TextRoll>
              <Arrow />
            </a>
          </Magnetic>
          <Magnetic>
            <a href="#work" className="group flex h-12 items-center gap-3 rounded-full border border-hair-strong px-6 text-[14px] text-fg transition-colors hover:border-fg">
              <TextRoll>View work</TextRoll>
              <Arrow external={false} />
            </a>
          </Magnetic>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={show ? { opacity: 1 } : undefined}
        transition={{ delay: 1.4, duration: 1 }}
        style={{ opacity: fade }}
        className="absolute bottom-10 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1.5 md:flex"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="size-1 rounded-full bg-fg"
            animate={reduce ? undefined : { opacity: [0.15, 1, 0.15] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </section>
  );
}
