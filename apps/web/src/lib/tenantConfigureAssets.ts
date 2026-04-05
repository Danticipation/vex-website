import type { TenantCinematic3d } from "@vex/shared";
import { DEFAULT_PUBLIC_VEHICLE_GLB } from "@/lib/vehicle3d/defaults";

/** Demo map: production resolves slug → tenant CDN GLB via API / env. */
const TENANT_CONFIGURE_GLB: Record<string, string> = {
  vex: DEFAULT_PUBLIC_VEHICLE_GLB,
  demo: DEFAULT_PUBLIC_VEHICLE_GLB,
};

/** Demo white-label cinematic JSON — production loads from tenant API / edge config. */
const TENANT_CINEMATIC_DEMO: Record<string, Partial<TenantCinematic3d>> = {
  vex: {
    heroEnvPreset: "city",
    flakeDensity: 0.88,
    iridescenceAngle: 1.05,
    clearCoatRefraction: 0.55,
    anisotropyStrength: 1,
  },
  demo: {
    heroEnvPreset: "night",
    flakeDensity: 0.92,
    iridescenceStrength: 0.55,
    clearCoatRefraction: 0.48,
  },
};

export function resolveTenantConfigureGlb(tenantSlug: string): string {
  const key = tenantSlug.trim().toLowerCase();
  return TENANT_CONFIGURE_GLB[key] ?? DEFAULT_PUBLIC_VEHICLE_GLB;
}

export function resolveTenantCinematic3d(tenantSlug: string): Partial<TenantCinematic3d> {
  const key = tenantSlug.trim().toLowerCase();
  return TENANT_CINEMATIC_DEMO[key] ?? {};
}
