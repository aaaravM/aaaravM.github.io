"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Hydration-safe "prefers reduced motion". The server (and the hydration pass)
 * always sees `false`, so the HTML matches; the real preference applies right
 * after. Motion's own hook reads matchMedia during hydration, which made server
 * and client disagree about `initial` styles and left content invisible.
 */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}

/** Non-hook read for event handlers and imperative code. */
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}
