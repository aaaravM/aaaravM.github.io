"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Arrow } from "@/components/fx/arrow-link";

import { useScramble } from "./use-scramble";

const EASE = [0.16, 1, 0.3, 1] as const;

export type Channel = { readonly label: string; readonly value: string; readonly href: string };

/**
 * One contact row: label left (sans), value right (hud). The whole row is the
 * link (stretched), so the email row can hold a real copy <button>. Hover / focus
 * runs Skiper40 Link005's white wipe with mix-blend-difference across the row
 * and re-decodes the value.
 */
export function ChannelRow({
  channel,
  index,
  cursor = "open",
  copyValue,
}: {
  channel: Channel;
  index: number;
  cursor?: string;
  /** when set, the row offers a copy button for this text */
  copyValue?: string;
}) {
  const [shown, scramble] = useScramble(channel.value);
  const external = /^https?:/.test(channel.href);
  const d = index * 0.075;

  return (
    <motion.li
      className="group relative isolate"
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      onViewportEnter={() => scramble()}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") scramble();
      }}
      onFocus={() => scramble()}
    >
      {/* hairline, drawn left → right */}
      <motion.span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px origin-left bg-hair-strong"
        variants={{ hidden: { scaleX: 0 }, shown: { scaleX: 1, transition: { duration: 1.3, delay: d, ease: EASE } } }}
      />

      <div aria-hidden className="relative flex items-center gap-3 px-2 py-[17px] sm:gap-5 sm:px-3 sm:py-[1.2rem]">
        <span className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <span className="block overflow-hidden pb-[0.1em] pt-[0.04em] transition-[translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2.5">
            <motion.span
              className="block text-[clamp(22px,2.6vw,40px)] leading-[1.02] tracking-[-0.028em] text-fg"
              variants={{ hidden: { y: "112%" }, shown: { y: "0%", transition: { duration: 1.05, delay: d + 0.08, ease: EASE } } }}
            >
              {channel.label}
            </motion.span>
          </span>
          <motion.span
            className="hud tabular block min-w-0 truncate text-fg-dim transition-colors group-hover:text-fg"
            variants={{ hidden: { opacity: 0, x: 14 }, shown: { opacity: 1, x: 0, transition: { duration: 1, delay: d + 0.22, ease: EASE } } }}
          >
            {shown}
          </motion.span>
        </span>

        {/* action slot: on phones it rides the label line so the value gets the full width */}
        <span className="absolute right-2 top-[17px] flex h-[26px] items-center justify-end sm:static sm:h-auto sm:w-[92px] sm:shrink-0">
          {copyValue ? null : <Arrow className="size-[11px] text-fg-dim transition-colors group-hover:text-fg" />}
        </span>
      </div>

      {/* the row is the link */}
      <a
        href={channel.href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        data-cursor={cursor}
        className="absolute inset-0 z-[1]"
      >
        <span className="sr-only">
          {channel.label}: {channel.value}
          {external ? " (opens in a new tab)" : ""}
        </span>
      </a>

      {copyValue ? (
        <span className="absolute right-2 top-[14px] z-[2] flex items-center sm:inset-y-0 sm:top-0 sm:right-3">
          <CopyButton value={copyValue} />
        </span>
      ) : null}

      {/* the inversion wipe (Skiper40 Link005) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[3] origin-right scale-x-0 bg-white mix-blend-difference transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:origin-left group-hover:scale-x-100 group-has-[a:focus-visible]:origin-left group-has-[a:focus-visible]:scale-x-100"
      />
    </motion.li>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      // insecure context / denied permission → the old way
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch {
        ok = false;
      }
    }
    if (!ok) return;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1900);
  };

  return (
    <button
      type="button"
      onClick={copy}
      data-cursor={copied ? "copied" : "copy"}
      className="hud-sm relative inline-flex h-8 w-[74px] items-center justify-center overflow-hidden rounded-full border border-hair-strong text-fg-dim transition-colors hover:border-fg hover:text-fg sm:w-[88px]"
    >
      <span className="sr-only">Copy email address</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "copied" : "copy"}
          aria-hidden
          className="block whitespace-nowrap"
          initial={{ y: "130%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-130%", opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          {copied ? "copied ✓" : "copy"}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {copied ? "Email address copied" : ""}
      </span>
    </button>
  );
}
