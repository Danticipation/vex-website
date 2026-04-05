/**
 * Default glTF when no listing `modelGlbUrl` (demo / fallback).
 * Khronos ToyCar — compact real-world proportions; sheen + transmission + clearcoat (reads well in WebGL).
 *
 * **Free sources for production-quality assets (no cost, run locally or self-host):**
 * - **Khronos glTF Sample Assets** — https://github.com/KhronosGroup/glTF-Sample-Assets (CC-BY / public domain varies per model)
 * - **Poly Haven** — https://polyhaven.com (HDRIs, textures, some models; CC0)
 * - **Blender** — import CAD / photogrammetry, export GLB with PBR; run offline
 * - **Meshroom** / **COLMAP** — open-source photogrammetry from photo sets → mesh → Blender → GLB
 *
 * Host large `.glb` / HDR on your CDN or `apps/web/public/models/` (keep repo lean; prefer CDN).
 * Stage large binaries under `packages/3d-configurator/assets/models/` (LFS/CDN), then **copy** or **upload** to
 * `apps/web/public/models/` or a CDN — Next only serves static files from `public/`.
 */
export const DEFAULT_PUBLIC_VEHICLE_GLB =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb";

/**
 * Vortex / marketing hero GLB: optional **`NEXT_PUBLIC_HERO_VEHICLE_GLB`** (HTTPS or site-relative `/models/…`).
 * When unset, uses {@link DEFAULT_PUBLIC_VEHICLE_GLB} (Khronos ToyCar).
 */
export function resolveHeroVehicleGlbUrl(): string {
  const v = process.env.NEXT_PUBLIC_HERO_VEHICLE_GLB?.trim();
  if (v) return v;
  return DEFAULT_PUBLIC_VEHICLE_GLB;
}
