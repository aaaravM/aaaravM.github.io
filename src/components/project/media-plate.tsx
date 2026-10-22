"use client";

import { useState } from "react";

import {
  DitherImageContent,
  DitherImageFrame,
  DitherImageOverlay,
  DitherImageReveal,
  DitherImageSweepLine,
} from "@/components/ui/dither-image";
import type { Project } from "@/lib/content";
import { cn } from "@/lib/utils";

const SWEEP = 950;

/*
 * The dither screens a Bayer matrix over the image and crushes it with contrast; ~0.56
 * brightness maps dark UI chrome to sparse dots and keeps text bright. Light screenshots
 * are inverted first so every plate reads the same.
 */
const TONE: Record<string, { invert?: boolean; bright?: number }> = {
  smartflow: { invert: true },
  smrthire: { invert: true, bright: 0.62 },
};

/**
 * The project's screenshot as a 1-bit dither plate (Cult UI DitherImage). Hover, keyboard
 * focus or a tap sweeps the real interface in.
 */
export function MediaPlate({ project: p, className }: { project: Project; className?: string }) {
  const [revealed, setRevealed] = useState(false);
  if (!p.media) return null;
  const tone = TONE[p.slug] ?? {};
  return (
    <figure className={className}>
      <button
        type="button"
        aria-pressed={revealed}
        aria-label={`${p.name} screenshot — ${revealed ? "showing the real interface" : "show the real interface"}`}
        data-revealed={revealed}
        onClick={() => setRevealed((v) => !v)}
        className="group block w-full text-left"
      >
        <DitherImageReveal className="rounded-lg border border-hair-strong bg-ink text-signal">
          <DitherImageFrame size="lg" rounded={false} aspectRatio="16 / 10" contrast={160} brightness={tone.bright ?? 0.56} style={{ "--dither-cell": "32px" }}>
            <DitherImageContent src={p.media} alt="" fill sizes="(min-width: 1024px) 44vw, 92vw" className={cn("object-left-top", tone.invert && "invert")} />
          </DitherImageFrame>
          <span aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-[#b9b8b3] mix-blend-multiply" />
          <DitherImageOverlay src={p.media} alt="" fill sizes="(min-width: 1024px) 44vw, 92vw" sweep={SWEEP} className="z-[1] object-left-top" />
          <DitherImageSweepLine duration={SWEEP} />
          <span aria-hidden className="pointer-events-none absolute top-2 left-2 z-[3] size-2.5 border-t border-l border-fg/40" />
          <span aria-hidden className="pointer-events-none absolute right-2 bottom-2 z-[3] size-2.5 border-r border-b border-fg/40" />
        </DitherImageReveal>
      </button>
      <figcaption className="mt-3 text-[12.5px] text-fg-faint">
        <span className="[@media(hover:none)]:hidden">Hover to see the real interface.</span>
        <span className="hidden [@media(hover:none)]:inline">Tap to see the real interface.</span>
      </figcaption>
    </figure>
  );
}
