"use client";

import { Arrow } from "@/components/fx/arrow-link";
import { TextRoll } from "@/components/ui/skiper-ui/skiper58";
import { PROFILE } from "@/lib/content";
import { scrollToTarget } from "@/lib/scroll";

// Skiper UI's free licence asks for attribution; Cult UI and Watermelon UI get the same courtesy.
const CREDITS = [
  { label: "Cult UI", href: "https://cult-ui.com" },
  { label: "Skiper UI", href: "https://skiper-ui.com" },
  { label: "Watermelon UI", href: "https://ui.watermelon.sh" },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative z-10 px-5 pt-6 pb-24 sm:px-8 lg:px-[3.2vw]">
      <div className="hairline-x" />
      <div className="mt-5 flex flex-col gap-3 text-[12.5px] text-fg-faint sm:flex-row sm:items-center sm:justify-between">
        <span className="text-fg-dim">© 2026 {PROFILE.name}</span>
        <span>
          UI from{" "}
          {CREDITS.map((c, i) => (
            <span key={c.href}>
              {i > 0 ? (i === CREDITS.length - 1 ? " and " : ", ") : null}
              <a href={c.href} target="_blank" rel="noopener noreferrer" className="text-fg-dim underline decoration-hair-strong underline-offset-4 transition-colors hover:text-fg hover:decoration-fg">
                {c.label}
              </a>
            </span>
          ))}
        </span>
        <button type="button" onClick={() => scrollToTarget("#top", { focus: true })} className="group flex items-center gap-2 text-fg-dim transition-colors hover:text-fg">
          <TextRoll>Back to top</TextRoll>
          <Arrow external={false} className="rotate-180" />
        </button>
      </div>
    </footer>
  );
}
