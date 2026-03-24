# Vehicle 3D — follow-up: realism, polish, and “real car” fidelity

The viewer (ACES tone mapping, HDR env, PBR tuning, showroom floor, fog, post-FX) only reveals what the **asset and pipeline** provide. Use this list to push toward showroom-grade results using **free/local** tooling where possible.

---

## 1. Assets (biggest lever)

- **Replace the demo GLB** (`DEFAULT_PUBLIC_VEHICLE_GLB` in `defaults.ts`) with **listing-specific** `Inventory.modelGlbUrl` pointing to high-quality PBR GLBs (per VIN/stock photo workflow).
- **Source or build PBR glTF 2.0**: base color, metallic-roughness, normals; optional clearcoat if the DCC export supports it. Avoid flat shading or missing tangents on curved body panels.
- **Consistent scale**: export in **meters** (glTF convention). If models come in arbitrary units, normalize once in Blender (or document a single scale factor in CRM and apply in the viewer).
- **Compression for web**: [glTF-Transform](https://gltf-transform.dev/) or Blender export with **Draco** / **meshopt**; keep textures **≤2K** for hero, **1K** for secondary unless you gate by connection quality.
- **KTX2 / BasisU** for textures when the pipeline allows — smaller downloads, faster GPU upload.

**Free references:** Khronos sample models (variety), Poly Haven (HDRIs, materials), Blender (authoring), Meshroom/COLMAP (photos → mesh → GLB).

---

## 2. Lighting and environment

- **Self-host or CDN an HDR** you like (studio or subtle outdoor); match the brand mood (luxury = softer, controlled speculars). Tune `Environment` intensity in `VehicleScene` / config to avoid blown highlights.
- **Rotate the env** (or the model) so primary reflections read on hood and shoulder lines — often a few degrees of Y rotation fixes a “plastic” look.
- **Ground contact**: keep contact shadows subtle; with `MeshReflectorMaterial`, avoid doubling dark blobs — adjust opacity and light angles if the car looks “floating.”

---

## 3. Camera and presentation

- **Per-model framing**: optional saved camera targets (bounding sphere center + distance) if body proportions differ (truck vs supercar). Today presets are generic; listing metadata could store `cameraPreset` or `orbitTarget` later.
- **Turntable / idle motion**: optional slow Y rotation only when **not** `prefers-reduced-motion` — reads “premium” without fighting user control.

---

## 4. Performance and quality tiers

- **DPR cap** is already a lever on the canvas; extend with explicit **quality presets** (e.g. low: no bloom, simpler floor, lower shadow map; high: current premium path).
- **LOD**: if GLBs are large, ship **two URLs** (hero + thumbnail orbit) or one GLB with multiple LODs — load distant LOD first, swap when idle (future API: `modelGlbUrlLow` or query param).
- **Lazy load** the 3D chunk on inventory detail (dynamic import) if bundle size becomes an issue on first paint.

---

## 5. Photo → 3D (real listing geometry)

- **Operational capture**: fixed angles, diffuse lighting, overlap between shots — improves photogrammetry more than viewer code.
- **Pipeline**: photos → Meshroom/COLMAP or a hosted API → mesh → **retopo + PBR bake in Blender** → GLB. Raw scans often look “lumpy”; a light retopo + baked maps sells better than raw vertex color.
- **API**: PATCH inventory with `modelGlbUrl`, `modelSource: GENERATED_FROM_PHOTOS`, `modelSourcePhotoIds` (see `pipelineContract.ts`). Same viewer path; no duplicate UI.

---

## 6. Product and QA

- **Loading state**: skeleton or blurred poster until GLB + env are ready; avoid layout jump.
- **Error state**: if `modelGlbUrl` fails (404, CORS), fall back to procedural/concept car + message for staff.
- **Cross-browser**: verify tone mapping + postprocessing on Safari and mobile GPUs; dial down FX if frame time spikes.

---

## 7. Optional “even more real” (when budget allows)

- **Studio backplate** (equirectangular or matched photo) behind the car for marketing pages — separate from the glTF, composited in scene or as CSS layer (careful with HDR mismatch).
- **Interior cuts** or **open doors** require separate meshes or morph targets — usually a second GLB or variant id.

Work through **§1–2** first; they dominate perceived quality. **§5** ties the 3D to the **actual** vehicle; **§4** keeps it smooth on real devices.
