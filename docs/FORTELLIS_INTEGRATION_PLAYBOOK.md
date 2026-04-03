# Fortellis Integration Playbook

## 1) Sandbox setup checklist

- Create ISV account at `https://developer.fortellis.io/`.
- Register app with CDK Drive scopes (inventory, sales, finance).
- Capture and store:
  - `FORTELLIS_CLIENT_ID`
  - `FORTELLIS_CLIENT_SECRET`
  - `FORTELLIS_SUBSCRIPTION_ID`
  - `FORTELLIS_TOKEN_URL`
  - `FORTELLIS_API_BASE_URL`
  - `FORTELLIS_WEBHOOK_SECRET`
- Set `FORTELLIS_SANDBOX=true` in non-production environments.
- Run token smoke test:
  - `pnpm --filter @vex/api exec tsx -e "import('./src/lib/fortellis.ts').then(async (m) => { console.log(await m.getFortellisAccessToken()); })"`

## 2) 1-click exotic dealer onboarding

- Dealer completes pilot onboarding in VEX (`/pilot` flow).
- Tenant admin enables Fortellis credentials in tenant integration settings.
- Trigger initial inventory sync from CRM:
  - POST `/integrations/inventory/sync`
- Verify first outbound sync:
  - `ExternalSync.status = SUCCESS`
  - `IntegrationLog.eventType = inventory.sync`

## 3) Webhook acceptance path

- Fortellis sends event to:
  - `POST /integrations/webhooks/fortellis`
- API verifies HMAC signature using `FORTELLIS_WEBHOOK_SECRET`.
- Event is deduplicated by `(tenantId, externalId, eventType)` in `IntegrationLog`.
- Async processing fans into BullMQ jobs (`fortellis-inventory-sync`).

## 4) KPI dashboard slice (minimum)

Track these per tenant:

- `integration_sync_success_rate_24h` = successful sync events / total sync events
- `integration_sync_failures_24h`
- `integration_sync_p95_latency_ms`
- `inventory_sync_jobs_queued`
- `appraisal_push_jobs_queued`

Data sources:

- `IntegrationLog` (status, eventType, processedAt)
- `ExternalSync` (status, syncedAt)
- `EventLog` (job-level diagnostics)

## 5) Pilot acceptance gate

- OAuth token retrieval succeeds.
- One inventory sync completes (`SUCCESS`).
- One appraisal push completes (`SUCCESS`).
- Webhook duplicate replay returns `duplicate: true` and no duplicate side-effects.
- Tenant isolation remains enforced on all integration-triggered writes.
