# VEX Elite Digital Presence v1 — North Star & Execution Plan

**Date:** 2026-04-04 (updated live snapshot)  
**Branch:** `elite-digital-presence-v1` (from `cursor/pilot-appraisal-loop` @ `1e84177`)  
**Status:** Active blueprint + **live partial implementation** (see §0). Phased work continues; this file is the **single stakeholder source of truth** — other repo markdown should **link here** rather than duplicate full specs.

**Reality check:** The items below describe the **target experience** plus **what is already shipped**. Shipping requires multiple sprints: 3D performance budgets, asset pipelines, a11y fallbacks, and load testing. Each phase must pass `pnpm -w turbo run build` and scoped quality gates.

---

## 0. Live implementation snapshot (apps/web + packages)

| Area | What is live now |
|------|------------------|
| **`HeroCinematicLayer`** | Optional **MP4/WebM** background when `NEXT_PUBLIC_HERO_VIDEO_URL` is set; **off** when `prefers-reduced-motion: reduce` or URL unset. **Not** WebGL. |
| **`DealerProgramHero`** | Full hero: ambient + overlay + vignette + **CSS vault sheen** (violet/gold blur, GPU `transform`, respects reduced motion) + headline shimmer (reduced motion disables). |
| **`@vex/3d-configurator`** | `shouldUseWebGL()`, **`VEX_WEBGL_PERF`** targets, async **`probeWebGPU()`** + **`useWebglEligible`** (respects **`NEXT_PUBLIC_ENABLE_HERO_WEBGL`**) on **`ConfiguratorVehicleCanvas`** / **`InventoryVehicleViewer`** → static finish-aware fallback when WebGL or motion policy blocks 3D. |
| **Design tokens** | `globals.css`: `--bg-elevated`, `--accent-violet*`, radii, shadows; body layered gradient; header/footer glass pass (see recent `style:` commits). |
| **CRM** | `Nav.module.css` glass nav; `globals.css` type smoothing + `main h1` baseline. |

**Not live yet:** particle systems in R3F on the marketing hero, scroll-synced post-FX on the **flat** hero layer, or 60 fps “locked” certification — measure with Chrome Performance + Lighthouse in CI when scheduled.

---

## 1. Vision (dual product)

| Surface | Role | Emotional target |
|--------|------|------------------|
| **apps/web** | Consumer + prospect | “$10M vault” — cinematic, scroll-stopping, trust + desire |
| **apps/crm** | Dealer staff / group admin | “Private jet cockpit” — density, clarity, zero ambiguity |
| **apps/api** | Invisible | Correctness, isolation, observability, cost caps |

---

## 2. apps/web — Component tree (target)

```
app/layout.tsx (fonts, AmbientShell, TenantTheme, Footer)
├── Header
├── / (home)
│   ├── DealerProgramHero (+ HeroCinematicLayer, WebGL optional layer)
│   ├── AutonomousAgentsShowcase
│   ├── PlatformEnginesSection
│   ├── MarketplaceSubletTeaser
│   ├── PaymentOrchestrationBar
│   ├── ScrollStorySection
│   ├── PrestigeMarquee
│   ├── ExoticPillars
│   ├── ConfiguratorPreview  → `ConfiguratorVehicleCanvas` + `@vex/3d-configurator` gating + static fallback
│   ├── FeaturedInventory
│   ├── PremiumServices
│   ├── TestDriveStrip
│   └── TrustStrip
├── /inventory, /inventory/[id]
├── /build (+ future full configurator route)
├── /checkout, /portal, /appraisal
└── /investor-deck (internal/ops)
```

**New / shared (phased):**

- `packages/3d-configurator` — `VehicleCanvas`, material presets, export hooks (360 / glTF), **Suspense** boundaries.
- `packages/ui` — luxury variants: glass panels, neon CTA, metric orbs (2D + optional R3F wrapper).

---

## 3. Visual language — tokens (proposal)

Map into `globals.css` / theme provider incrementally; avoid breaking existing `--accent` usage in one shot.

| Token | Value | Use |
|-------|--------|-----|
| `--vex-obsidian` | `#0A0A0A` | Page base |
| `--vex-violet` | `#A020F0` | Electric accent (sparingly) |
| `--vex-gold-foil` | `#FFD700` | Premium CTA foil / highlights |
| `--vex-glass` | `rgba(12,12,16,0.55)` + blur | Cards, nav orb |
| `--vex-noise` | SVG/CSS noise overlay | Luxury texture |

**Motion:** prefers-reduced-motion must disable particle trails, parallax, and cursor FX (see §6).

---

## 4. Animation — keyframes (conceptual)

| Name | Purpose | Tech |
|------|-----------|------|
| `hero-unveil` | Fleet reveal on scroll | GSAP timeline + Lenis |
| `orb-expand` | Nav orb → section anchors | CSS + optional R3F |
| `cta-shimmer` | Liquid metal on primary buttons | CSS gradient animation |
| `particle-exhaust` | Subtle GPU particles behind hero vehicle | drei `Points` + budget cap |

---

## 5. Accessibility matrix (non-negotiable)

| Area | Requirement |
|------|-------------|
| Color | WCAG 2.2 AA for body UI; decorative 3D exempt with text alternatives |
| Keyboard | All CTAs, nav, configurator controls tabbable |
| Motion | `prefers-reduced-motion: reduce` → static hero + no auto-play audio |
| WebGL | Fallback: static poster image / LQIP when WebGL unavailable |
| Audio | Engine hover: opt-in or mute by default with visible toggle |

---

## 6. Moodboard references (design intent)

- **Automotive craft:** Pininfarina, Rimac, Aston Martin — proportion, restraint, material honesty.
- **Product polish:** Linear, Vercel — typography rhythm, empty state quality, fast perceived performance.

---

## 7. User journeys

### 7.1 Consumer: hero → configurator → checkout

1. Land on `/` — hero establishes brand + proof (metrics, trust strip).
2. “Build / configure” → `/build` — PBR configurator, live price from API preview.
3. Stripe Checkout or deposit flow — tenant-scoped pricing; no client-trusted amounts.

### 7.2 Dealer: login → appraisal → deal desk close

1. CRM login → `/appraisals` queue.
2. Detail → PDF / valuation / deal desk actions (RBAC: STAFF, ADMIN, GROUP_ADMIN aligned on tenant + dealer routes).
3. Close → ERP order path (existing services); audit + notifications.

---

## 8. SEO / Open Graph / investor

- **Marketing:** Unique titles per route; `metadataBase` + OG image per major funnel (`/`, `/inventory`, `/build`).
- **Investor:** `/investor-deck` — token-gated package; live pilot metrics via `INTERNAL_PILOT_METRICS_KEY` proxy; no cross-tenant leakage in copy.

---

## 9. API — RBAC audit snapshot (2026-04-04)

**Finding:** Most tenant routes use `requireAuth` + `requireRole` / `requireStaffOrAbove` / `requireAnyAuthenticatedRole`. The latter is **intentional** for customer-inclusive routes (orders list scoped in controller, saved vehicles, etc.).

**Follow-up (next agent):**

- Grep `apps/api/src/routes` for handlers that are `requireAuth`-only without a second middleware — confirm controller enforces tenant + role.
- Do **not** add `requireRole` where product intent is “any authenticated user” with controller-side row scoping (e.g. `orders`, `savedVehicles`).

**Deal desk:** `GROUP_ADMIN` parity documented in `docs/TENANT_RBAC.md`; `isDealDeskAppraisalRole` aligns with `isDealerStaffRole`.

---

## 10. Strategic — revenue hooks (advisory)

| Tier | Price (illustrative) | Includes |
|------|----------------------|----------|
| **Apex** | $499/mo | White-label 3D embed, branded customer portal subdomain, priority valuation quota |
| **Pilot expansion** | — | On tenant create: seed 3D demo asset pack + demo inventory rows (idempotent job) |

**MRR narrative:** Position 3D configurator as **conversion lift** on qualified traffic (hypothesis for analytics — measure before claiming “42%”; use A/B or cohort once shipped).

---

## 11. Implementation phases (recommended)

| Phase | Scope | Gate |
|-------|--------|------|
| **P0** | Plan + `@vex/3d-configurator` stub + token docs | `turbo build` |
| **P1** | Configurator + inventory: `useWebglEligible` + finish-aware static fallback; hero video already gated on reduced motion (`HeroCinematicLayer`) | `turbo build`; Lighthouse incremental |
| **P2** | Configurator PBR + Stripe preview integration | E2E smoke on `/build` |
| **P3** | CRM glass variants + deal-desk kanban polish | Manual QA + a11y |

---

## 12. Success criteria (measurable)

- Build green on every merge (`pnpm -w turbo run build`).
- No regression on tenant isolation (`test:e2e` with Postgres).
- LCP / CLS tracked on `/` after hero changes (budget TBD).
- CRM task time for “appraisal → close” tracked in product analytics (baseline first).

---

## 13. Handoff — next agent checklist

1. `pnpm install` after pulling branch (new workspace package).
2. `pnpm -w turbo run build`.
3. With Postgres: `pnpm --filter @vex/api run test:e2e`.
4. Next visual: optional R3F hero strip (behind feature flag) **or** Lighthouse perf budget on `/`.

---

## 14. Documentation corpus policy

- **Do not** paste this entire blueprint into `AGENTS.md`, `SHIP.md`, or integration playbooks — it goes stale.
- **Do** add one line cross-links: “Elite digital presence north star: `docs/plans/2026-04-04-vex-ELITE-DIGITAL-PRESENCE-v1.md`.”
- Slide/deck markdown (if any) should **summarize** pillars and link here for depth.

---

## 15. Visual supremacy → revenue engine (hypotheses — measure)

| Lever | Hypothesis | Instrument |
|-------|------------|------------|
| Vault hero + configurator 3D | Higher **scroll depth** and **CTA click** on `/` and `/build` vs flat baseline | PostHog / GA4 events + cohort |
| Static fallback | **No** conversion penalty vs 3D when fallback copy is clear (A/B optional) | Same + funnel |
| CRM glass nav | Faster **time-to-task** for staff (qualitative + session replay) | Product analytics |

**Conversion-lift numbers** are **not** claimed until an experiment ships; use pre/post or A/B.

---

## 16. BullMQ — auto-provision 3D demo assets (job spec)

- **Queue name:** `tenant-3d-demo-seed` (example).
- **Trigger:** Idempotent hook after tenant provisioning (paid pilot / admin create) — **once per tenant**.
- **Payload:** `{ tenantId }`.
- **Worker steps:** (1) copy bundled glTF + poster URLs into tenant-scoped storage or reference public demo URLs; (2) insert `Inventory` / `Vehicle` demo rows with `source=DEMO`; (3) `AuditLog` entry `TENANT_3D_DEMO_SEEDED`.
- **Failure:** Retry with backoff; DLQ after N tries; never block HTTP response path.

---

## 17. Apex tier — feature matrix (illustrative $499/mo)

| Feature | Included |
|---------|----------|
| White-label **3D embed** (iframe / signed URL) for dealer site | Yes |
| Branded **customer portal** subdomain | Yes |
| **CRM** premium theme + priority support lane | Yes |
| Valuation **quota** bump vs Pro | Yes (exact # TBD pricing) |
| Custom **domain** + SSL | Yes (ops checklist) |

---

## 18. 90-second self-serve pilot onboarding (playbook)

1. **0:00–0:30** — Stripe checkout → tenant provision (idempotent).
2. **0:30–0:60** — Demo inventory + CRM login email; optional BullMQ demo 3D seed (§16).
3. **0:60–0:90** — Link to `/appraisals` + “first appraisal” checklist; `Tenant.onboardedAt` completion.

---

## 19. Investor attention magnet

- **Live site** as pitch: screen-record **hero sheen + optional video** + **configurator** (WebGL or graceful fallback) + **investor-deck** metrics proxy.
- **Narrative:** “Tenant-safe dealer OS + consumer-grade discovery — same product, two surfaces.”
- **Data room:** Token-gated `RaisePackage` + pilot network metrics — already API-backed.

---

## 20. Stakeholder “feel” description (QA script)

The first viewport should read as an **obsidian vault**: soft **violet–gold** light bleeding at the floor line, **champagne headline** shimmer (stops cold under reduced motion), optional **cinema-grade loop** behind the fold when env video is configured, and a **glass cockpit** column that sells enterprise depth. Scroll feels **layered**, not flat marketing.

---

*This document is the north star; execution remains incremental and reversible.*

---

## 21. WebGL performance budget (2026 — single source of truth)

| Metric | Target | Notes |
|--------|--------|--------|
| Frame budget | **60 fps** on mid-range laptop + flagship mobile | Chrome Performance panel; throttle particles under load |
| Draw calls | **&lt;100 / frame** after batching | Instancing for fleets/particles; merge static meshes; avoid per-frame material churn |
| Particles | **≤512 points** default hero vortex (tunable); LOD when off-screen | Throttle `useFrame` work; Apex formation already eased |
| Textures | **Mipmaps on**; atlases for trim sheets | Worker/async decode for glTF (roadmap: `THREE.LoadingManager` + `KTX2Loader` where applicable) |
| Post-processing | **Efficient stack** — bloom + vignette + DOF via `@react-three/postprocessing`; **no** full deferred rewrite until profiling proves need | `VortexPostFXStack` scales with `apexScrollBoost` |
| WebGPU | **Progressive enhancement** — `probeWebGPU()` in `@vex/3d-configurator`; **WebGL2 remains canonical** until TSL parity path ships | Feature-detect only; do not branch user-visible contracts |

**Feature flags:** `NEXT_PUBLIC_ENABLE_HERO_WEBGL` — when `0` / `false`, `useWebglEligible` forces **static** previews (configurator + inventory 3D off). Documented in `apps/web/.env.local.example`.

**Live — home hero gate (`DynamicHeroShell`):** `useHeroWebglDisplayMode()` composes the same flag + eligibility:

| Mode | UI |
|------|-----|
| `legacy` | **`DealerProgramHero`** — CSS vault sheen, optional **`HeroCinematicLayer`** video, **`VaultNeonCursorSheen`** (violet radial follow-cursor, **off** under `prefers-reduced-motion`), existing **`HeroParticleField`** |
| `pending` | Full-viewport `#0a0a0a` placeholder until client measures WebGL |
| `vortex` | **`ApexHeroScene`** → `@vex/ui/3d` **`VortexHeroScene`** — GLTF digital twin, **`ParticleVortex`** (≤**180** points today; **≤512** budget in `VEX_WEBGL_PERF` for fleet/hero iterations), **`VortexPostFXStack`** bloom/god-rays, **`useApexHeroOrchestration`** scroll velocity |

**Lighthouse CI:** `apps/web/lighthouserc.json` asserts performance ≥0.8, a11y ≥0.9 (URLs `/`, `/inventory`, `/build`). **100/100** is a **stretch goal** on production hardware + tuned assets — raise assertions only after baselines are green in CI.

---

## 22. 2026 luxury automotive UX trend matrix → VEX components

| Trend (§21 master plan) | VEX mapping (live or phased) |
|-------------------------|------------------------------|
| **Phygital / digital twins** | `ConfiguratorVehicleCanvas` + `InventoryVehicleViewer` WebGL with **static** graceful fallback; roadmap: AR placement embed, signed 360 export |
| **Bespoke personalization** | Tenant `TenantCinematic3d` + CRM theme tokens; mood = **CSS vault** + optional cinematic shaders (`NEXT_PUBLIC_CINEMATIC_*`) |
| **Expressive yet accessible** | `prefers-reduced-motion` gates video (`HeroCinematicLayer`), WebGL (`shouldUseWebGL`), hero shimmer; **WCAG** via Lighthouse a11y gate |
| **Glanceable / safe UI** | Large tap targets on configurator toolbar; CRM glass **metric** patterns (`@vex/ui` enterprise widgets) |
| **AI-first / multimodal** | Phased: AI co-pilot strings in configurator copy; voice — product backlog (no blocking ship) |

---

## 23. Component tree — Hero + Configurator + CRM orbs (reference)

```
apps/web
├── HomeHero
│   └── (NEXT_PUBLIC_CINEMATIC_HERO_V2 ≠ 0) DynamicHeroShell
│         ├── useHeroWebglDisplayMode()
│         ├── legacy → DealerProgramHero (HeroCinematicLayer video + VaultNeonCursorSheen + HeroParticleField)
│         └── vortex → ApexHeroScene → VortexHeroScene (@vex/ui/3d)
│   └── (CINEMATIC_HERO_V2 off) DealerProgramHero only
├── ConfiguratorPreview / ConfiguratorVehicleCanvas → VehicleScene
│     └── useWebglEligible (+ NEXT_PUBLIC_ENABLE_HERO_WEBGL) → Canvas | StaticVehicleFallback
└── InventoryVehicleViewer (same gating)

apps/crm
├── Dashboard / analytics — glass KPI cards, `EnterpriseWidgetCard` (@vex/ui) “metric orbs”
└── globals.css — cinematic void + `--cinematic-void-marketing` anchor (brand parity)
```

---

## 24. Animation, reduced motion, phygital roadmap

| Layer | Reduced motion = `reduce` | Full motion |
|-------|-----------------------------|-------------|
| Hero video | **Off** (`HeroCinematicLayer`) | Loop MP4/WebM |
| WebGL configurator | **Off** (`useWebglEligible`) | Orbit + PBR |
| Cinematic Apex (web) | Respect R3F + CSS hooks | Particles, god-rays, streaks |
| CRM | No infinite CSS shimmer on critical paths | Glass hover allowed |

**Phygital roadmap (ordered):** (1) stable WebGL + static fallback everywhere; (2) tenant HDR + uniforms live; (3) optional AR Quick Look / USDZ export from API; (4) BullMQ demo asset job (§16) + pilot checklist.

---

## 25. Documentation corpus — cross-links (policy)

- **Entry points** carrying a one-line pointer to this file: `PROJECT_SPACE.md`, `AGENTS.md`, `README.md` (Docs section), and §14 of this document.
- **Do not** duplicate §21–§25 into playbooks; **link** here for WebGL + luxury UX supremacy specs.

---

## 26. WebGL supremacy → revenue engine v3 (one-pager)

| Pillar | Tie to performance |
|--------|---------------------|
| **Conversion** | Hypothesis: **60 fps** **digital-twin hero** (`vortex` mode) + configurator ↑ scroll depth, CTA intent, and `/build` sessions vs **legacy** CSS vault baseline — instrument PostHog/GA4 (no hard % until A/B). |
| **Provisioning** | **BullMQ** `tenant-3d-demo-seed` (§16): on tenant create, enqueue once — copy demo glTF URLs to tenant storage or reference CDN; seed demo `Inventory` rows; `AuditLog` `TENANT_3D_DEMO_SEEDED`; retry + DLQ on failure. |
| **Apex tier (~$499/mo illustrative)** | White-label **3D portal** + **iframe/signed embed**, **AR-ready** configurator export (roadmap), **branded CRM** glass cockpit, **custom domain** + SSL, valuation quota bump vs Pro. |
| **Pilot** | **90 s** self-serve (§18): Stripe → tenant → email → **`DynamicHeroShell`** vault first paint + optional **AI personalization** teaser copy on `/portal` (roadmap). |

---

## 27. Investor attention magnet v2

- **Optimized WebGL hero** (`vortex`) is the **live Series A asset**: screen-record **≤60 fps** — scroll → god-ray ramp → particle formation → **LiquidMetalCTA** burst; second clip with **`NEXT_PUBLIC_ENABLE_HERO_WEBGL=0`** showing **legacy** vault + neon sheen to prove **zero** broken layouts.
- **Pitch deck embed:** Use **full-screen** `https://<deployed-web>/` in deck tools that support live iframe, or **OBS / mmhmm** browser source; for **data room**, token-gated **read-only** tenant demo subdomain (same isolation narrative as API).
- **Narrative:** “Luxury commerce = **perceived performance** + trust; VEX ships both in one monorepo.”

---

**Visual QA script (one paragraph):** The visitor lands in an **obsidian vault** with **violet–gold** GPU sheen; optional **cinema loop** or **R3F hero** (when flags allow) reads as a **private hypercar gallery** — not a template dealer site. Configurator **orbits** feel **heavy and smooth** (60 fps target); reduced motion users get **instant clarity** without shimmer or spinning metal. CRM echoes the **same void** so staff never context-switch brands.
