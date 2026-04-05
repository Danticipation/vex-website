import type { TenantCinematic3d } from "../schemas/tenant3d.js";

/** Numeric shader uniforms only — merge into `CinematicPaintUniforms` on the client (`@vex/cinematic`). */
export type TenantCinematicUniformPatch = {
  flakeDensity?: number;
  iridescenceStrength?: number;
  clearCoatIntensity?: number;
  anisotropicChrome?: number;
  iridescenceAngle?: number;
  clearCoatRefraction?: number;
  anisotropyStrength?: number;
  iridescenceLUTBlend?: number;
};

/** Strip undefined; safe to spread into `Partial<CinematicPaintUniforms>` in `@vex/ui/3d`. */
export function tenantCinematicUniformPatch(t: Partial<TenantCinematic3d>): Partial<TenantCinematicUniformPatch> {
  const out: Partial<TenantCinematicUniformPatch> = {};
  const keys = [
    "flakeDensity",
    "iridescenceStrength",
    "clearCoatIntensity",
    "anisotropicChrome",
    "iridescenceAngle",
    "clearCoatRefraction",
    "anisotropyStrength",
    "iridescenceLUTBlend",
  ];
  for (const k of keys) {
    const v = t[k as keyof TenantCinematic3d];
    if (typeof v === "number") (out as Record<string, number>)[k] = v;
  }
  return out;
}
