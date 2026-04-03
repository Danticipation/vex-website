# VEX Project Space (Single Operating Hub)

Use this file as the primary command center for execution.

## Current Focus

- Ship dealer-facing revenue path in a tight loop.
- Keep tenant isolation + RBAC + Stripe idempotency non-negotiable.
- Convert pilots to paid usage, not feature sprawl.
- Execute competitive plan: `docs/VEX_COMPETITIVE_EXECUTION_PLAN_2026-04-02.md`.

## 14-Day Beachhead Sprint

### Must Ship

- [ ] Multi-tenant enforcement audit complete on all API routes.
- [ ] Stripe checkout + webhook + billing portal verified in staging.
- [ ] Inventory/orders/appraisals dealer flows stable end-to-end.
- [ ] Pilot verification pass on deployed API (`pnpm run pilot:verify`).

### Go-To-Market

- [ ] Line up 3-5 luxury/exotic dealer pilot candidates.
- [ ] Demo script: private liquidity + public configurator.
- [ ] Pricing test: pay-per-deal-closed + usage overages.

## Source Of Truth Map

- Execution guardrails: `AGENTS.md`
- Delivery runbook: `docs/PILOT_SHIP.md`
- Ship gate details: `docs/SHIP.md`
- Tenant/RBAC details: `docs/TENANT_RBAC.md`
- Reality check memo: `docs/ENGINEERING_REALITY.md`
- Competitive execution system: `docs/VEX_COMPETITIVE_EXECUTION_PLAN_2026-04-02.md`

## Standard Commands

- Install: `pnpm install`
- Build all: `pnpm -w turbo run build`
- API E2E isolation: `pnpm --filter @vex/api run test:e2e`
- CI mirror: `pnpm run ship:gate`
- Deployed readiness: `PILOT_VERIFY_API_URL=https://... pnpm run pilot:verify`

## Workspace Organization Rules

- Start execution from this file first.
- Treat this file as the live sprint board and update checkboxes as work lands.
- Add new docs only if they are linked from this hub.
- Keep generated or local-only files out of git where possible.

## Daily Execution Cadence

- Morning: run `pnpm -w turbo run build` and `pnpm --filter @vex/api run test:e2e`.
- Before any pilot-facing release: run `pnpm run ship:gate`.
- After deploy: run `PILOT_VERIFY_API_URL=... pnpm run pilot:verify`.
- End of day: update KPI and checklist progress in the competitive execution plan.

## Day 1 Execution Checklist

- [x] Run gate commands in order (log 2026-04-03, this workspace):
  - [x] `pnpm -w turbo run build` — green (all 5 packages).
  - [x] `pnpm --filter @vex/api run test:e2e` — green after E2E scripts use `systemPrisma` + scoped `prisma` from `lib/tenant.ts` (raw `PrismaClient()` had no `$use` tenant merge).
  - [x] `DATABASE_URL=postgresql://vex:vex@127.0.0.1:5432/vex DIRECT_DATABASE_URL=postgresql://vex:vex@127.0.0.1:5432/vex pnpm run ship:gate` — green after Prisma migration ledger recovery (`migrate resolve`) and clean `migrate status`.
  - [x] `PILOT_VERIFY_API_URL=http://127.0.0.1:3001 pnpm run pilot:verify` — green (`pilot-verify: OK ... db=ok`).
- [x] If any command is red, fix gate blockers before feature work.
- [ ] Trust layer tasks:
  - [x] AsyncLocalStorage / tenant context wrapper in `apps/api/src/lib/tenantScope.ts` (delegates to `runWithTenant` / `getTenantId`).
  - [ ] Add route-level RBAC guard coverage using `docs/TENANT_RBAC.md` (ongoing audit; shim in `apps/api/src/middleware/rbac.ts`).
  - [ ] Ensure Prisma queries execute through tenant-scoped client paths (controllers + scripts; E2E now asserts scoped reads).
- [x] Pass/Fail target: `pnpm --filter @vex/api run test:e2e` green with zero cross-tenant leakage (appraisal + inventory isolation scripts).
- [ ] Pilot outreach: send one-line offer to 3 Cavin contacts and log status in this file.

## Realtime Scaling Sprint (Kickoff)

- [x] Add API WebSocket runtime at `WS /ws/auctions?token=<jwt>` with JWT tenant auth.
- [x] Add Redis Streams fan-out foundation for cross-instance room broadcasts (`vex:auction:{tenant}:{room}:events`).
- [x] Add 15s heartbeat/ping-pong and stale-connection termination.
- [x] Add premium-first broadcast ordering (STAFF/ADMIN/GROUP_ADMIN before CUSTOMER).
- [x] Add Prometheus telemetry: `vex_ws_active_connections`, `vex_auction_broadcast_latency_ms`, `vex_ws_messages_total`.
- [ ] Run horizontal proof with 2+ API pods + Redis and capture latency/throughput report.
- [ ] Wire web live salon UI (`Live Bidder Count` / energy meter / bid-reactive visuals) to WS stream.
