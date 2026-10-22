"use client";

import type { ReactNode } from "react";

import { TextRoll } from "@/components/ui/skiper-ui/skiper58";
import { cn } from "@/lib/utils";

const isExternal = (href: string) => /^https?:|^mailto:/.test(href);

/** A link whose letters roll on hover (Skiper TextRoll) with a travelling ↗ arrow. */
export function ArrowLink({
  href,
  children,
  className,
  cursor = "open",
  arrow = true,
}: {
  href: string;
  children: string;
  className?: string;
  cursor?: string;
  arrow?: boolean;
}) {
  const ext = isExternal(href);
  return (
    <a
      href={href}
      target={ext && !href.startsWith("mailto:") ? "_blank" : undefined}
      rel={ext ? "noopener noreferrer" : undefined}
      data-cursor={cursor}
      className={cn("group inline-flex items-center gap-1.5", className)}
    >
      <TextRoll>{children}</TextRoll>
      {arrow ? <Arrow external={ext} /> : null}
    </a>
  );
}

export function Arrow({ external = true, className }: { external?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-block size-[0.8em] overflow-hidden", className)}>
      <svg
        viewBox="0 0 10 10"
        className={cn(
          "absolute inset-0 size-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          external ? "group-hover:translate-x-full group-hover:-translate-y-full" : "group-hover:translate-y-full",
        )}
        fill="none"
      >
        {external ? <path d="M1.5 8.5 8.5 1.5m0 0v6m0-6h-6" stroke="currentColor" strokeWidth="1.2" /> : <path d="M5 1v8m0 0 3-3M5 9 2 6" stroke="currentColor" strokeWidth="1.2" />}
      </svg>
      <svg
        viewBox="0 0 10 10"
        className={cn(
          "absolute inset-0 size-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          external ? "-translate-x-full translate-y-full group-hover:translate-0" : "-translate-y-full group-hover:translate-y-0",
        )}
        fill="none"
      >
        {external ? <path d="M1.5 8.5 8.5 1.5m0 0v6m0-6h-6" stroke="currentColor" strokeWidth="1.2" /> : <path d="M5 1v8m0 0 3-3M5 9 2 6" stroke="currentColor" strokeWidth="1.2" />}
      </svg>
    </span>
  );
}

export function Chip({ children, className, hot }: { children: ReactNode; className?: string; hot?: boolean }) {
  return (
    <span
      className={cn(
        "hud-sm inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        hot ? "border-signal/50 bg-signal-soft text-hot" : "border-hair-strong text-fg-dim",
        className,
      )}
    >
      {hot ? <span className="size-1 rounded-full bg-signal" /> : null}
      {children}
    </span>
  );
}
