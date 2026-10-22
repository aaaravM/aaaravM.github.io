"use client";

import { motion, useMotionTemplate, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";

import { Kicker } from "@/components/fx/kicker";
import { CONTACT_LINKS, LINKS } from "@/lib/content";
import { useReducedMotion } from "@/lib/reduced-motion";

import { ChannelRow } from "./contact/channel-row";
import { LetsBuild } from "./contact/lets-build";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Contact() {
  const cta = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const [wave, setWave] = useState(0);

  // the letters converge as the panel rises into view
  const { scrollYProgress: p } = useScroll({ target: cta, offset: ["start end", "center center"] });
  const subClip = useTransform(p, [0.72, 0.96], [100, 0]);
  const subClipPath = useMotionTemplate`inset(-20% ${subClip}% -20% 0%)`;

  return (
    <section id="contact" className="relative overflow-x-clip">
      <div
        ref={cta}
        className="relative flex min-h-svh flex-col items-center justify-center px-4"
        data-formation="spiral"
        data-fx="0"
        data-fs="0.92"
      >
        <div className="absolute inset-x-0 top-[14svh] px-5 sm:px-8 lg:px-[3.2vw]">
          <Kicker>Contact</Kicker>
        </div>

        <h2 className="text-center">
          <a
            href={LINKS.email}
            onFocus={() => setWave((w) => w + 1)}
            className="block text-[length:min(30vw,15.5svh)] leading-[0.84] tracking-[-0.01em] text-fg sm:text-[length:min(12.2vw,19svh)] sm:leading-none"
          >
            <span className="sr-only">Let’s build something intelligent — email Aarav.</span>
            <LetsBuild progress={p} range={[0.15, 0.85]} still={reduce} trigger={wave} />
          </a>
        </h2>
        <motion.p
          aria-hidden
          style={reduce ? undefined : { clipPath: subClipPath }}
          className="mt-[3svh] whitespace-nowrap text-[clamp(19px,2.15vw,34px)] leading-none tracking-[-0.03em] text-fg-dim"
        >
          something <span className="text-fg">intelligent</span>
          <span className="text-signal">.</span>
        </motion.p>
      </div>

      <div className="relative px-5 pb-[8svh] sm:px-8 lg:px-[3.2vw]">
        <ul className="relative">
          {CONTACT_LINKS.map((c, i) => (
            <ChannelRow key={c.label} channel={c} index={i} copyValue={c.href === LINKS.email ? LINKS.emailLabel : undefined} />
          ))}
        </ul>
        <motion.span
          aria-hidden
          className="block h-px origin-left bg-hair-strong"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={reduce ? { duration: 0 } : { duration: 1.3, delay: CONTACT_LINKS.length * 0.075, ease: EASE }}
        />
      </div>
    </section>
  );
}
