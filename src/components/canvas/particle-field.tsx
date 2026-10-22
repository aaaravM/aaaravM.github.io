"use client";

import { useEffect, useRef } from "react";

import { registerStageHighlight, registerStageRefresh, setStageState, useStage } from "@/lib/stage-store";

import { Stage } from "./engine/stage";

/**
 * The fixed full-screen WebGL layer. One point cloud lives here for the whole
 * visit (it survives page navigations); sections declare which formation they
 * want with `data-formation`.
 */
export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const webgl = useStage((s) => s.webgl);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    const count = small ? 16384 : 24576;

    let stage: Stage;
    try {
      stage = new Stage(canvas, { count, reducedMotion });
    } catch {
      // no WebGL: keep the page usable and fall back to a static dot lattice
      setStageState({ webgl: false, ready: true, warm: 1, intro: 1, introDone: true, unlocked: true });
      return;
    }
    let alive = true;
    stage.warm((p) => setStageState({ warm: p })).then(() => {
      if (!alive) return;
      stage.start();
      stage.playIntro();
      setStageState({ unlocked: true });
      registerStageRefresh(() => stage.refresh());
      registerStageHighlight((tag) => stage.highlight(tag));
    });
    return () => {
      alive = false;
      registerStageRefresh(null);
      registerStageHighlight(null);
      stage.dispose();
    };
  }, []);

  if (!webgl) return <div aria-hidden className="dot-paper pointer-events-none fixed inset-0 z-0 opacity-60" />;
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh w-full" />;
}
