/**
 * Phase 2 — TSL node graphs + WebGPURenderer (three.js WebGPU pipeline).
 * Production path uses `iridescentCarPaint.ts` (MeshPhysicalMaterial + onBeforeCompile, WebGL2).
 */
export const CINEMATIC_TSL_PHASE = 2 as const;

export type IridescentTslStub = {
  phase: typeof CINEMATIC_TSL_PHASE;
  note: "Wire tsl() nodes when migrating hero to WebGPU backend";
};

export function getIridescentTslStub(): IridescentTslStub {
  return {
    phase: CINEMATIC_TSL_PHASE,
    note: "Wire tsl() nodes when migrating hero to WebGPU backend",
  };
}
