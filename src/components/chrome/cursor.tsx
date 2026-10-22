"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { CursorPrimitive, CursorProvider } from "@/components/ui/cursor";

/** A small crosshair reticle (Watermelon UI cursor primitives) that rotates and opens over anything clickable. */
export function SiteCursor() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const set = () => setEnabled(mq.matches && !reduce);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("has-cursor", enabled);
  }, [enabled]);

  if (!enabled) return null;
  return (
    <CursorProvider global className="contents">
      <Reticle />
    </CursorProvider>
  );
}

function Reticle() {
  const [active, setActive] = useState(false);
  const [down, setDown] = useState(false);

  useEffect(() => {
    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("a, button, [role='button'], input, label, [data-cursor]");
      setActive(!!el);
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", dn, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    return () => {
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", dn);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <CursorPrimitive asChild>
      <div className="mix-blend-difference">
        <motion.div
          className="relative size-10"
          animate={{ rotate: active ? 45 : 0, scale: down ? 0.8 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
        >
          <span className="absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          <motion.span
            className="absolute inset-0"
            animate={{ scale: active ? 1.35 : 0.8, opacity: active ? 1 : 0.85 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <span className="absolute top-0 left-1/2 h-2 w-px -translate-x-1/2 bg-white" />
            <span className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-white" />
            <span className="absolute top-1/2 left-0 h-px w-2 -translate-y-1/2 bg-white" />
            <span className="absolute top-1/2 right-0 h-px w-2 -translate-y-1/2 bg-white" />
          </motion.span>
          <motion.span
            className="absolute inset-[6px] rounded-full border border-white"
            animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.4 }}
          />
        </motion.div>
      </div>
    </CursorPrimitive>
  );
}
