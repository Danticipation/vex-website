/**
 * @vex/3d-configurator — phased delivery.
 * Public exports stay minimal until VehicleCanvas + materials land.
 */

export const VEX_3D_CONFIGURATOR_VERSION = "0.1.0";

/** Documented perf targets for hero + configurator R3F scenes (enforcement = Chrome Performance + manual review). */
export const VEX_WEBGL_PERF = {
  /** Target max draw calls per frame after batching (instancing, merged meshes). */
  targetMaxDrawCalls: 100,
  /** Particle systems: cap total points before LOD / throttle. */
  targetMaxParticlePoints: 512,
  /** Prefer WebGL2; WebGPU is progressive enhancement (see `probeWebGPU`). */
  preferWebGL2: true,
} as const;

/** Sync probe: WebGL2 or WebGL1 context creation (client only). */
export function shouldUseWebGL(): boolean {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mq.matches) return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Optional progressive enhancement — does not replace WebGL2 path today.
 * Call from client after user gesture or idle if you need to branch materials.
 */
export async function probeWebGPU(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
  if (!gpu?.requestAdapter) return false;
  try {
    const adapter = await gpu.requestAdapter();
    return adapter != null;
  } catch {
    return false;
  }
}
