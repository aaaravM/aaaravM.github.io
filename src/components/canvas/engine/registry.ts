import type { FormationData } from "./builder";
import { buildDust, buildLattice, buildNoise, buildSphere, buildSpiral } from "./formations/core";
import { buildClusters, buildConstellation, buildField, buildLog } from "./formations/misc";
import { buildAgents, buildEye, buildFlow, buildGraph, buildTissue, buildTransit, buildTree, buildWave } from "./formations/projects";

export type FormationDef = {
  /** short label for the HUD */
  label: string;
  build: (N: number) => FormationData;
  spin?: { axis: [number, number, number]; speed: number };
  /** desktop default: x as a fraction of the half-width, y in world units, scale */
  layout?: { x: number; y: number; scale: number };
  /** amplitude of the mid-morph noise burst when morphing *into* this formation */
  morphNoise?: number;
};

const TILT_23 = [Math.sin(0.41) * 0.55, Math.cos(0.41), Math.sin(0.41) * 0.84] as [number, number, number];

export const FORMATIONS: Record<string, FormationDef> = {
  noise: { label: "noise", build: buildNoise },
  dust: { label: "sky", build: buildDust, spin: { axis: [0, 1, 0], speed: 0.025 } },
  sphere: {
    label: "world_model",
    build: buildSphere,
    spin: { axis: TILT_23, speed: 0.16 },
    layout: { x: 0.4, y: 0.3, scale: 0.9 },
  },
  lattice: {
    label: "mlp.forward",
    build: buildLattice,
    spin: { axis: [1, 0, 0], speed: 0.22 },
    layout: { x: 0.42, y: 0, scale: 0.82 },
  },
  field: {
    label: "auto.path",
    build: buildField,
    layout: { x: 0.42, y: 0.0, scale: 0.62 },
  },
  agents: {
    label: "langgraph.state",
    build: buildAgents,
    layout: { x: 0.06, y: -0.06, scale: 0.9 },
    morphNoise: 0.6,
  },
  log: {
    label: "y = log(x)",
    build: buildLog,
    layout: { x: 0.36, y: 0, scale: 0.8 },
  },
  graph: {
    label: "gnn.message_pass",
    build: buildGraph,
    spin: { axis: [0, 1, 0], speed: 0.12 },
    layout: { x: 0.4, y: 0, scale: 0.85 },
  },
  tree: {
    label: "policy.path",
    build: buildTree,
    layout: { x: 0.4, y: 0, scale: 0.8 },
  },
  eye: {
    label: "cnn.attend",
    build: buildEye,
    spin: { axis: [0, 0, 1], speed: 0.12 },
    layout: { x: 0.38, y: 0.02, scale: 0.85 },
  },
  transit: {
    label: "lightcurve.fit",
    build: buildTransit,
    layout: { x: 0.36, y: 0.04, scale: 0.85 },
  },
  wave: {
    label: "lstm.memory",
    build: buildWave,
    layout: { x: 0.38, y: 0, scale: 0.82 },
  },
  flow: {
    label: "clipboard.route",
    build: buildFlow,
    layout: { x: 0.38, y: 0, scale: 0.78 },
  },
  tissue: {
    label: "gradcam.overlay",
    build: buildTissue,
    layout: { x: 0.38, y: 0, scale: 0.85 },
  },
  constellation: {
    label: "signal.map",
    build: buildConstellation,
    layout: { x: 0, y: 0.08, scale: 0.86 },
  },
  clusters: {
    label: "embedding space",
    build: buildClusters,
    spin: { axis: [0, 1, 0], speed: 0.07 },
    layout: { x: 0.44, y: 0, scale: 0.85 },
  },
  spiral: {
    label: "φ.galaxy",
    build: buildSpiral,
    spin: { axis: [0, Math.cos(-1.05), Math.sin(-1.05)], speed: 0.11 },
    layout: { x: 0, y: -0.02, scale: 0.92 },
  },
};
