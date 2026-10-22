"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

import { ParticleField } from "@/components/canvas/particle-field";

import { SiteCursor } from "./cursor";
import { Nav } from "./nav";
import { Overlays } from "./overlays";
import { SiteFooter } from "./site-footer";
import { SmoothScroll } from "./smooth-scroll";

/**
 * Everything that persists across pages: the particle model, smooth scrolling,
 * the cursor, the nav and the footer. Pages only bring their sections.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    // "user": transform/layout animations drop out for people who ask for reduced motion
    <MotionConfig reducedMotion="user">
      <SmoothScroll />
      <ParticleField />
      <Overlays />
      <SiteCursor />
      <Nav />
      <main className="relative z-10">{children}</main>
      <SiteFooter />
    </MotionConfig>
  );
}
