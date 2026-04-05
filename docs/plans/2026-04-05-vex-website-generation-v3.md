# VEX website generation v3 — cinematic + WebGPU strategy

## Phase 1.1 — Cinematic shaders (WebGL2)

- `@vex/cinematic` package: GLSL luxury paint, configure sliders, tenant JSON hooks (`TenantCinematic3dSchema`).

## Phase 1.2 — WebGPU (this document)

- **Renderer:** `WebGPUEngine` currently uses **WebGL2** + advanced materials; native `WebGPURenderer` deferred until three.js WebGPU + post stack are stable in our stack.
- **Detection:** `hasWebGPU()` for UI badges and future gating.
- **TSL:** `iridescentCarPaintNode.ts` stub — wire when migrating hero Canvas.

## Phase 1.3 — Advanced GLSL (modular moat)

| Module | Role |
|--------|------|
| `IridescentPaintGLSL.ts` | Thin-film hue shift (angle-dependent phase) |
| `MetallicFlakeLayer.ts` | FBM + directional sparkle |
| `MultiLayerClearCoat.ts` | Dual Fresnel clear-coat boost |
| `AnisotropicChromeGLSL.ts` | Stretched specular on wheels / chrome |
| `VortexCarMaterialGLSL` | Declarative apply + time ticker |

- **Uniforms:** `flakeDensity`, `iridescenceStrength`, `clearCoatIntensity`, `anisotropicChrome`, `iridescenceAngle` — tenant JSON via `TenantCinematic3dSchema`.
- **Acceptance:** WebGL2 only in production Canvas; 60 fps device-tested; CI: TS build + Playwright (no GPU shader compile in Node).

## Phase 2

- Compute-shader particles; low-code CRM shader editor.

## Phase 3

- White-label WebGPU asset pipeline (GLTF + JSON TSL metadata).

## Acceptance (non-negotiable)

- All 3D routes use dynamic import / `ssr: false` where applicable.
- Fallback: WebGL2 when `navigator.gpu` is missing.
- Turbo build + `quality:web` green.
