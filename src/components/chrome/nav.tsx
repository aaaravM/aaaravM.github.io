"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Arrow } from "@/components/fx/arrow-link";
import { Magnetic } from "@/components/fx/magnetic";
import { TextRoll } from "@/components/ui/skiper-ui/skiper58";
import { LINKS, NAV, PROFILE } from "@/lib/content";
import { useReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";
import { useStage } from "@/lib/stage-store";

const EASE = [0.16, 1, 0.3, 1] as const;

/** same-page anchors stay plain <a> (Lenis glides to them); routes use next/link */
function NavLink({ href, className, children, onClick }: { href: string; className?: string; children: React.ReactNode; onClick?: () => void }) {
  if (href.startsWith("#"))
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

/** A 5×5 dot "A" — the mark. */
export function Mark({ className }: { className?: string }) {
  const rows = ["00100", "01010", "10001", "11111", "10001"];
  return (
    <svg viewBox="0 0 25 25" className={cn("size-5", className)} aria-hidden>
      {rows.flatMap((r, y) =>
        r.split("").map((c, x) => (
          <circle key={`${x}-${y}`} cx={x * 5 + 2.5} cy={y * 5 + 2.5} r={c === "1" ? 1.9 : 0.7} fill={c === "1" ? "currentColor" : "rgba(255,255,255,0.22)"} />
        )),
      )}
    </svg>
  );
}

export function Nav() {
  const unlocked = useStage((s) => s.unlocked);
  const pathname = usePathname();
  const home = pathname === "/";
  const href = (id: string) => (home ? `#${id}` : `/#${id}`);
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  // tuck the bar away while reading downwards, bring it back on the way up
  useMotionValueEvent(scrollY, "change", (v) => {
    const d = v - (scrollY.getPrevious() ?? v);
    if (v <= 240) setHidden(false);
    else if (d > 2) setHidden(true);
    else if (d < -4) setHidden(false);
  });
  const toggle = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => {
    setOpen(false);
    toggle.current?.focus();
  }, []);

  // close the menu on navigation (render-time reset, no effect needed)
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  return (
    <>
      <motion.header
        onFocus={() => setHidden(false)}
        className="fixed inset-x-0 top-0 z-[80] px-4 pt-4 sm:px-7 sm:pt-5"
        initial={{ y: -40, opacity: 0 }}
        animate={unlocked ? { y: hidden && !open ? -90 : 0, opacity: 1 } : { y: -40, opacity: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <nav className="flex items-center justify-between gap-4" aria-label="Primary">
          <NavLink href={home ? "#top" : "/"} className="group flex items-center gap-2.5 text-fg">
            <Mark className="transition-transform duration-700 group-hover:rotate-180" />
            <span className="font-pixel-square text-[15px] leading-none tracking-wide">
              <span className="sm:hidden">
                <TextRoll>AARAV M.</TextRoll>
              </span>
              <span className="hidden sm:inline">
                <TextRoll>{PROFILE.name.toUpperCase()}</TextRoll>
              </span>
            </span>
            <span className="sr-only"> — home</span>
          </NavLink>

          <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-[13.5px] lg:flex">
            {NAV.map((n) => (
              <li key={n.id}>
                <NavLink href={href(n.id)} className="text-fg-dim transition-colors hover:text-fg">
                  <TextRoll>{n.label}</TextRoll>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Magnetic strength={0.25}>
              <a
                href={LINKS.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-9 items-center gap-2 rounded-full bg-fg px-4 text-[13px] font-medium text-ink transition-colors hover:bg-signal"
              >
                <TextRoll>Résumé</TextRoll>
                <Arrow />
              </a>
            </Magnetic>
            <button
              ref={toggle}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="site-menu"
              className="flex h-9 items-center gap-2 rounded-full border border-hair-strong px-3.5 text-[13px] text-fg lg:hidden"
            >
              <span className="relative block h-2 w-3.5" aria-hidden>
                <span className={cn("absolute inset-x-0 top-0 h-px bg-current transition-transform duration-500", open && "translate-y-[3.5px] rotate-45")} />
                <span className={cn("absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-500", open && "-translate-y-[3.5px] -rotate-45")} />
              </span>
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </nav>
      </motion.header>

      <MobileMenu open={open} onClose={closeMenu} href={href} />
    </>
  );
}

function MobileMenu({ open, onClose, href }: { open: boolean; onClose: () => void; href: (id: string) => string }) {
  const reduce = useReducedMotion();
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const behind = [document.querySelector("main"), document.querySelector("footer")];
    behind.forEach((el) => el?.setAttribute("inert", ""));
    const t = setTimeout(() => list.current?.querySelector("a")?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      behind.forEach((el) => el?.removeAttribute("inert"));
      clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="site-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[75] flex flex-col justify-end bg-ink/95 px-5 pb-10 backdrop-blur-md sm:px-8 lg:hidden"
          initial={reduce ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
          animate={reduce ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
          exit={reduce ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <ul ref={list} className="flex flex-col gap-1">
            {NAV.map((n, i) => (
              <li key={n.id} className="overflow-hidden">
                <motion.div
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  exit={{ y: "110%" }}
                  transition={{ duration: 0.8, delay: 0.18 + i * 0.06, ease: EASE }}
                >
                  <NavLink href={href(n.id)} onClick={onClose} className="block py-1 font-pixel-circle text-[clamp(44px,13vw,80px)] leading-[1] text-fg">
                    {n.label}
                  </NavLink>
                </motion.div>
              </li>
            ))}
          </ul>
          <motion.div
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-fg-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
            exit={{ opacity: 0 }}
          >
            <a href={LINKS.email}>Email</a>
            <a href={LINKS.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href={LINKS.devpost} target="_blank" rel="noopener noreferrer">
              Devpost
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
