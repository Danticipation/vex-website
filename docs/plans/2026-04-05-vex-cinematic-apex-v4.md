# VEX Cinematic Apex v4.0 — engagement electrification

**Status:** Phase 1 (GLSL foundation) complete. Phase 2 (Apex layer) in repo: scroll-orchestrated post-FX, particle logo formation, velocity streaks, `dev:apex` / `cinematic:apex` tasks.

## Strategic KPI targets (hypothesis — instrument in analytics)

| Metric | Target | Apex lever |
|--------|--------|------------|
| Hero dwell | +60% vs baseline | Logo formation, god-ray ramp, CTA flash |
| Configurator depth | 4× | Glass panel + live uniforms + “garage” intent |
| Stripe session start | 2.5× | Emotional peak before checkout funnel |
| White-label velocity | 6× | Tenant uniforms + env presets |
| Revenue | **Cinematic Ultra** tier | Custom flake HDRIs, compute floors, velocity-reactive lighting (Phase 3–4) |

## Phases

| Phase | Scope |
|-------|--------|
| **1** | GLSL moat (`@vex/cinematic`), configure sliders, tenant JSON |
| **2 (Apex)** | Scroll boost → Bloom/GodRays; particle VEX formation on load; speed streaks ∝ scroll velocity; `data-apex-hero`; `NEXT_PUBLIC_CINEMATIC_APEX` |
| **3** | CRM shader customizer, white-label engine |
| **4** | Autonomous visuals (MRR / valuation → glow + bursts) |

## Acceptance

- 60 fps on mid-range hardware (manual); CI: `quality:web` + canvas smoke.
- Lighthouse 98+ on marketing routes (existing budget).
- a11y: no duplicate `id`, landmarks preserved.
- Dynamic 3D: `ssr: false` / client-only Canvas.

## Verification

```bash
pnpm install --frozen-lockfile
pnpm --filter @vex/cinematic build
pnpm --filter @vex/shared build
pnpm -w turbo run build
pnpm --filter @vex/web run quality:web
pnpm dev:apex   # root — shaders + cinematic mode + apex
```

## Internal narrative

See [docs/internal/vex-cinematic-investor-narrative-v4.md](../internal/vex-cinematic-investor-narrative-v4.md).
