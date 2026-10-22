"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { getLenis, scrollToTarget, setLenis } from "@/lib/scroll";
import { refreshStage } from "@/lib/stage-store";

/** Lenis smooth scrolling, gliding in-page anchors, and a reset on every page change. */
export function SmoothScroll() {
  const pathname = usePathname();
  const first = useRef(true);
  const popped = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({
      lerp: reduced ? 1 : 0.085,
      smoothWheel: !reduced,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
    });
    setLenis(lenis);
    if (process.env.NODE_ENV !== "production") {
      // test hook for screenshot scripts
      (window as unknown as { __scrollTo: typeof scrollToTarget }).__scrollTo = scrollToTarget;
    }

    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // same-page anchors glide instead of jumping
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      e.preventDefault();
      scrollToTarget(href, { focus: true });
      // keep the router's own history state; only the URL fragment changes
      history.replaceState(history.state, "", href === "#top" ? location.pathname : href);
    };
    document.addEventListener("click", onClick);
    // back / forward: the browser restores the old scroll position — keep it
    const onPop = () => (popped.current = true);
    window.addEventListener("popstate", onPop);

    // a deep link (/#work) lands after the layout settles
    const deep = location.hash ? setTimeout(() => scrollToTarget(location.hash, { immediate: true }), 300) : undefined;

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(deep);
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  // client-side navigation: start the new page at its top (or its hash), then let the particles re-read it
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const lenis = getLenis();
    lenis?.resize();
    if (popped.current) popped.current = false;
    else if (location.hash) scrollToTarget(location.hash, { immediate: true });
    else lenis?.scrollTo(0, { immediate: true, force: true });
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => refreshStage());
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [pathname]);

  return null;
}
