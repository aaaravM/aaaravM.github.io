"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LOG_APPS, logPoint } from "@/components/canvas/engine/formations/misc";
import { AGENT_GATE, AGENT_NODES } from "@/components/canvas/engine/formations/projects";
import { Arrow } from "@/components/fx/arrow-link";
import { Kicker } from "@/components/fx/kicker";
import { TextRoll } from "@/components/ui/skiper-ui/skiper58";
import { EXPERIENCE, type Role } from "@/lib/content";
import { useReducedMotion } from "@/lib/reduced-motion";
import { formationPoint, useFormed, useStage } from "@/lib/stage-store";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** where each role's formation sits on desktop (right half); narrow screens use the slot above the roles */
const PLACE: Record<string, { fx: number; fy: number; fs: number }> = {
  agents: { fx: 0.42, fy: 0.02, fs: 0.7 },
  log: { fx: 0.42, fy: -0.02, fs: 0.74 },
  field: { fx: 0.43, fy: 0, fs: 0.62 },
};

export function Experience() {
  const [active, setActive] = useState(0);
  const pending = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const role = EXPERIENCE[active];
  const place = PLACE[role.formation];

  // hovering across the list shouldn't thrash the particles: settle for a beat first
  const choose = (i: number, now = false) => {
    clearTimeout(pending.current);
    if (now) setActive(i);
    else pending.current = setTimeout(() => setActive(i), 110);
  };
  useEffect(() => () => clearTimeout(pending.current), []);

  return (
    <section
      id="experience"
      className="relative flex min-h-svh items-center px-5 py-[14svh] sm:px-8 lg:px-[3.2vw]"
      data-formation={role.formation}
      data-fx={place.fx}
      data-fy={place.fy}
      data-fs={place.fs}
    >
      <div className="relative z-10 w-full wide:max-w-[44%]">
        <Kicker>Experience</Kicker>
        <h2 className="sr-only">Experience</h2>
        {/* narrow screens: the formation gets its own room above the roles and scrolls with them */}
        <div data-stage-slot aria-hidden className="mt-6 h-[min(52vw,44svh)] wide:hidden" />

        <ul className="mt-4 wide:mt-10" onPointerLeave={() => clearTimeout(pending.current)}>
          {EXPERIENCE.map((r, i) => (
            <RoleRow key={r.id} role={r} open={i === active} onChoose={(now) => choose(i, now)} first={i === 0} />
          ))}
        </ul>
      </div>

      <Pins formation={role.formation} />
    </section>
  );
}

function RoleRow({ role: r, open, onChoose, first }: { role: Role; open: boolean; onChoose: (now: boolean) => void; first: boolean }) {
  const reduce = useReducedMotion();
  return (
    <li className={cn("relative border-b border-hair", first && "border-t")}>
      {open ? <motion.span layoutId="role-bar" className="absolute top-0 -left-3 h-full w-px bg-signal sm:-left-5" transition={{ duration: 0.6, ease: EASE }} /> : null}
      <button
        type="button"
        aria-expanded={open}
        onPointerEnter={(e) => e.pointerType === "mouse" && onChoose(false)}
        onFocus={() => onChoose(true)}
        onClick={() => onChoose(true)}
        className="group flex w-full items-baseline justify-between gap-4 py-6 text-left"
      >
        <span className="min-w-0">
          <span className={cn("block text-[clamp(24px,2.5vw,38px)] leading-[1.05] tracking-[-0.03em] transition-colors duration-500", open ? "text-fg" : "text-fg-dim group-hover:text-fg")}>
            {r.role}
          </span>
          <span className={cn("mt-1.5 block text-[15px] transition-colors duration-500", open ? "text-fg-dim" : "text-fg-faint")}>{r.org}</span>
        </span>
        <span className={cn("hud shrink-0 transition-colors duration-500", open ? "text-signal" : "text-fg-faint")}>{r.when}</span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pb-7">
              <p className="max-w-[46ch] text-[16px] leading-relaxed text-fg-dim">{r.line}</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {r.links.map((l) =>
                  l.internal ? (
                    <Link key={l.href} href={l.href} className="group/l flex h-10 items-center gap-2.5 rounded-full bg-fg px-4 text-[13.5px] text-ink transition-colors hover:bg-signal">
                      <TextRoll>{l.label}</TextRoll>
                      <Arrow external={false} className="-rotate-90" />
                    </Link>
                  ) : (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/l flex h-10 items-center gap-2.5 rounded-full border border-hair-strong px-4 text-[13.5px] text-fg transition-colors hover:border-fg"
                    >
                      <TextRoll>{l.label}</TextRoll>
                      <Arrow />
                    </a>
                  ),
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

// ───────────────────────────────────────────── labels pinned to the particles

type Pin = { x: number; y: number; text: string; place: "above" | "below"; tone?: "hot" };

const AGENT_PINS: Pin[] = [
  { x: -1.06, y: 0.34, text: "Job description", place: "above" },
  { x: -1.03, y: -0.43, text: "Résumés", place: "below" },
  ...AGENT_NODES.map((n): Pin => ({ x: n.x, y: n.y >= 0 ? n.y + (n.x === -0.17 ? 0.33 : 0.075) : n.y - 0.075, text: n.label, place: n.y >= 0 ? "above" : "below" })),
  { x: AGENT_GATE.x, y: 0.23, text: "Human approval", place: "above", tone: "hot" },
  { x: 1.15, y: -0.21, text: "Ranked shortlist", place: "below" },
];

const LOG_PINS: Pin[] = LOG_APPS.map((name, i) => {
  const [x, y] = logPoint(i);
  return { x, y: y + 0.06, text: name, place: "above" };
});

const PINS: Record<string, Pin[]> = { agents: AGENT_PINS, log: LOG_PINS, field: [] };

function Pins({ formation }: { formation: string }) {
  const formed = useFormed(formation);
  const layout = useStage((s) => s.layouts[formation]);
  const pins = PINS[formation] ?? [];
  if (!layout || !pins.length) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 hidden wide:block">
      <AnimatePresence>
        {formed
          ? pins.map((p, i) => {
              const pos = formationPoint(layout, p.x, p.y);
              if (!pos) return null;
              return (
                <div key={`${formation}-${p.text}`} className={cn("absolute -translate-x-1/2", p.place === "above" ? "-translate-y-full" : "")} style={pos}>
                  <motion.span
                    className={cn("hud-sm block whitespace-nowrap rounded-[3px] bg-ink/70 px-1.5 py-0.5", p.tone === "hot" ? "text-hot" : "text-fg-dim")}
                    initial={{ opacity: 0, y: p.place === "above" ? 6 : -6, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.7, delay: 0.05 + i * 0.06, ease: EASE }}
                  >
                    {p.text}
                  </motion.span>
                </div>
              );
            })
          : null}
      </AnimatePresence>
    </div>
  );
}
