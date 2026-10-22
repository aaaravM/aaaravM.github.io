"use client";

import { useSyncExternalStore } from "react";

// Tiny external store shared by the WebGL stage and the DOM (HUD, preloader,
// hero). The stage writes; components subscribe with a selector.

export type StageState = {
  /** shaders compiled and first frame drawn */
  ready: boolean;
  /** preloader finished and the page may scroll */
  unlocked: boolean;
  /** 0 → 1 while the intro denoises noise into the first formation */
  intro: number;
  introDone: boolean;
  /** formation currently dominating the screen */
  formation: string;
  /** formation being morphed toward */
  next: string;
  /** 0..1 morph progress between `formation` and `next` */
  mix: number;
  /** 0..1 whole-page scroll progress */
  progress: number;
  /** index of the section anchor closest to the viewport centre */
  anchorIndex: number;
  anchorCount: number;
  fps: number;
  webgl: boolean;
  /** 0..1 formation pre-build progress (feeds the preloader) */
  warm: number;
  /** where each formation actually lands on screen (world units; 1 unit = half the viewport height) */
  layouts: Record<string, FormationLayout>;
};

export type FormationLayout = { x: number; y: number; s: number };

let state: StageState = {
  ready: false,
  unlocked: false,
  intro: 0,
  introDone: false,
  formation: "noise",
  next: "noise",
  mix: 0,
  progress: 0,
  anchorIndex: 0,
  anchorCount: 1,
  fps: 60,
  webgl: true,
  warm: 0,
  layouts: {},
};

const listeners = new Set<() => void>();

export function getStageState() {
  return state;
}

export function setStageState(patch: Partial<StageState>) {
  let changed = false;
  for (const k in patch) {
    const key = k as keyof StageState;
    if (state[key] !== patch[key]) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const serverState = state;

/**
 * CSS position (inside a full-viewport box) of a point given in a formation's
 * local coordinates — lets DOM labels sit on top of particle structures.
 * Returns null until the stage has measured the layout.
 */
export function useFormationPoint(id: string, lx: number, ly: number): { left: string; top: string } | null {
  const l = useStage((s) => s.layouts[id]);
  if (!l) return null;
  return { left: `calc(50% + ${((l.x + lx * l.s) * 50).toFixed(3)}vh)`, top: `calc(50% - ${((l.y + ly * l.s) * 50).toFixed(3)}vh)` };
}

export function formationPoint(l: FormationLayout | undefined, lx: number, ly: number) {
  if (!l) return null;
  return { left: `calc(50% + ${((l.x + lx * l.s) * 50).toFixed(3)}vh)`, top: `calc(50% - ${((l.y + ly * l.s) * 50).toFixed(3)}vh)` };
}

/** true while the cloud actually holds formation `id` (not mid-morph) — gate labels pinned to it */
export function useFormed(id: string) {
  return useStage((s) => {
    if (s.next === id && s.formation !== id) return s.mix > 0.85;
    if (s.formation !== id) return false;
    return s.next === id ? s.mix === 0 || s.mix > 0.85 : s.mix < 0.15;
  });
}

// Components can ask the stage to re-read the page (e.g. after navigation).
let stageRefresh: (() => void) | null = null;

export function registerStageRefresh(fn: (() => void) | null) {
  stageRefresh = fn;
}

export function refreshStage() {
  stageRefresh?.();
}

let stageHighlight: ((tag: number | null) => void) | null = null;

export function registerStageHighlight(fn: ((tag: number | null) => void) | null) {
  stageHighlight = fn;
}

/** light one tagged group of particles (see CLUSTER_TAG); null to release */
export function highlightStage(tag: number | null) {
  stageHighlight?.(tag);
}

// The page asks for the intro; the stage registers how to play it.
let introPlayer: (() => void) | null = null;
let introRequested = false;

export function registerIntroPlayer(fn: (() => void) | null) {
  introPlayer = fn;
  if (fn && introRequested) fn();
}

export function requestIntro() {
  introRequested = true;
  introPlayer?.();
}

export function useStage<T>(selector: (s: StageState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(serverState),
  );
}
