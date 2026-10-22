import type Lenis from "lenis";

import { prefersReducedMotion } from "./reduced-motion";

// One Lenis instance for the page; anything can ask it to travel.
let lenis: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  lenis = l;
}

export function getLenis() {
  return lenis;
}

/** `#id` → element, without CSS-selector parsing (so odd hashes like `#2026` can't throw) */
function resolve(hash: string): HTMLElement | null {
  if (hash === "#top") return document.body;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

/** Moves keyboard focus to where we scrolled, so the next Tab continues from there. */
function focusTarget(el: HTMLElement) {
  const target = el === document.body ? (document.getElementById("top") ?? el) : el;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

export function scrollToTarget(target: string | number, opts: { immediate?: boolean; focus?: boolean } = {}) {
  const immediate = opts.immediate || prefersReducedMotion();
  if (typeof target === "string") {
    if (!target.startsWith("#")) return;
    const el = resolve(target);
    if (!el) return;
    if (lenis) lenis.scrollTo(target === "#top" ? 0 : el, { duration: 1.8, immediate, easing: easeInOutQuart });
    else el.scrollIntoView({ behavior: immediate ? "auto" : "smooth" });
    if (opts.focus) focusTarget(el);
    return;
  }
  if (lenis) lenis.scrollTo(target, { duration: 1.8, immediate, easing: easeInOutQuart });
  else window.scrollTo({ top: target, behavior: immediate ? "auto" : "smooth" });
}

function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}
