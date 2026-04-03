# VEX Competitive Execution Plan (April 2, 2026)

This document converts the Cavin Industries market analysis into a tactical execution system.

## Strategic Thesis

- Win the luxury/exotic dealer wedge with a dual-marketplace operating model.
- Compete on liquidity and speed, not generic feature parity.
- Use tenant safety + billing reliability as enterprise trust gates, then focus on dealer outcomes.

## Where VEX Wins

- Native private dealer flow + public configurator in one stack.
- Tenant isolation and RBAC architecture suited for multi-rooftop growth.
- Valuation + trade-in workflow can become a proprietary data moat.

## Where VEX Is Vulnerable

- Pilot count and paid usage lag product ambition.
- Implementation consistency (route-level role coverage, endpoint hardening) must stay strict.
- GTM motion can stall if engineering over-optimizes internal infrastructure.

## 14-Day Execution Sprints (Operational)

### Days 1-2: Enterprise Readiness Proof

- Verify full route-level role coverage on high-risk financial/deal endpoints.
- Re-run tenant isolation E2E and ship gate.
- Verify Stripe lifecycle path: checkout -> webhook -> subscription status -> usage log.

Exit criteria:

- `ship:gate` passing
- deployed `pilot:verify` passing
- no unresolved auth/scope gaps on billing routes

### Days 3-5: Liquidity Core

- Deliver private dealer inventory syndication workflow.
- Deliver dealer-to-dealer offer/intent flow with auditability.
- Ensure inventory visibility remains tenant-safe under all role permutations.

Exit criteria:

- At least one successful end-to-end private liquidity flow in staging
- audit logs present for critical actions

### Days 6-8: Public Pull Engine

- Tighten public configurator -> private deal desk handoff.
- Track lead origin and handoff latency.
- Ensure trade-in appraisal entry path is low-friction and role-safe.

Exit criteria:

- measurable public-to-private handoff events
- no cross-tenant exposure in public branding/configurator resolution

### Days 9-10: Revenue Activation

- Activate usage-linked billing signals for pay-per-close and overage tracking.
- Validate Stripe status transitions under retries and duplicate webhooks.
- Instrument core revenue telemetry for admin visibility.

Exit criteria:

- at least one complete billed lifecycle event recorded
- idempotent behavior verified under webhook replay

### Days 11-12: Pilot Conversion

- Onboard 3-5 target exotic independents through Cavin network motion.
- Use a fixed pilot onboarding runbook and collect friction points.
- Publish per-dealer go-live checklist completion.

Exit criteria:

- minimum 3 signed pilots
- onboarding SLA under 90 seconds for self-serve path where applicable

### Days 13-14: Proof Package

- Produce KPI summary for pilot investors/operators.
- Snapshot conversion funnel: inbound -> qualified -> active -> paid.
- Publish next-sprint backlog constrained to close-rate and margin impact.

Exit criteria:

- pilot KPI report published
- next sprint backlog ranked by revenue impact

## Competitive Counter-Positioning

- CDK/Reynolds: "Great OEM depth, weak modern dealer UX and agility."
- Tekion/DealerSocket: "Modern cloud tooling, but no native dual marketplace moat."
- Momentum CRM: "Luxury CRM fit, but not a full transactional liquidity stack."

Use this message in sales:

- "VEX is the luxury dealer operating system for moving inventory faster: private network liquidity plus public demand capture, with enterprise-safe tenant controls."

## Weekly KPI Block (Minimum)

- Active pilot rooftops
- Private liquidity transactions started/completed
- Public configurator leads handed into dealer flow
- Stripe billed events (count + amount)
- Appraisal valuation usage + cache hit rate
- Time-to-onboard and first-value time

## Rules Of Engagement (Execution Discipline)

- No roadmap expansion that does not increase close rate, speed-to-deal, or margin.
- No release to pilots unless tenant isolation and billing path checks pass.
- No feature accepted without owner, metric, and rollback posture.

## Command Cadence

Run daily before pushing pilot-facing changes:

```bash
pnpm -w turbo run build
pnpm --filter @vex/api run test:e2e
pnpm run ship:gate
```

Run on deployed environment after each release:

```bash
PILOT_VERIFY_API_URL=https://your-api-host pnpm run pilot:verify
```

