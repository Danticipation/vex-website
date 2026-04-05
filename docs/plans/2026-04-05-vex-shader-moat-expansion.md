# VEX shader moat expansion — GLSL luxury car + WebGPU roadmap

**Goal:** Hyper-realistic iridescent / flake / clear-coat / chrome materials that legacy DMS UIs cannot match.

## Phase 1 (shipped in repo)

| Deliverable | Location |
|---------------|----------|
| `MeshPhysicalMaterial` + `onBeforeCompile` body + chrome patches | `packages/cinematic/src/shaders/iridescentCarPaint.ts` |
| Scene apply + shared time uniform | `packages/cinematic/src/shaders/applyCinematicLuxuryPaint.ts` |
| `CinematicPaintTimeTicker` | `packages/cinematic/src/components/CinematicPaintTimeTicker.tsx` |
| Hero + configure integration | `@vex/ui` `HeroGltfCar`, `CinematicCarViewer`; `/configure` sliders |
| WebGPU detection (no native renderer yet) | `hasWebGPU()`, `WebGPUEngine` (WebGL2 + diagnostic log) |
| TSL / compute stubs | `iridescentCarPaintNode.ts`, `computeParticleVortexStub.ts` |

## KPI mapping (hypothesis)

| KPI | Shader lever |
|-----|----------------|
| Configurator engagement 3× | Live flake / iridescence sliders on `/configure` |
| Dwell +40% | Motion + fresnel iridescence on hero rotation |
| Stripe 2× | Same emotional peak before checkout |

## Acceptance

- Dynamic 3D remains `ssr: false` / client-only.
- `NEXT_PUBLIC_CINEMATIC_SHADERS_V3=0` disables GLSL patches (standard PBR only).
- 60 fps: validate on device; CI checks canvas size + a11y (not FPS).

## Phase 2 — WebGPU + TSL

- `WebGPURenderer` + async `init()` + postprocessing interop.
- Migrate `IridescentCarPaintNode` to `three/tsl` node graphs.
- Compute particle vortex (100k+ points) replacing CPU points.

## Phase 3 — CRM shader customizer

- Dealer JSON → `TenantCinematic3dSchema` uniforms → runtime `cinematicUniforms` prop.

## Asset pipeline

- GLTF + LOD; document custom `onBeforeCompile` injection per mesh group for dealer uploads.
