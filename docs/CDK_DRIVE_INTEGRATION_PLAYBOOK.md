# CDK Drive Integration Playbook

## 1) Fortellis app + CDK scopes

- Ensure Fortellis ISV app is approved for:
  - CDK Drive API scopes
  - Async API / Neuron event subscriptions
- Configure:
  - `FORTELLIS_CLIENT_ID`
  - `FORTELLIS_CLIENT_SECRET`
  - `FORTELLIS_SUBSCRIPTION_ID`
  - `FORTELLIS_TOKEN_URL`
  - `FORTELLIS_API_BASE_URL`
  - `FORTELLIS_WEBHOOK_SECRET`
  - `CDK_SANDBOX=true` for non-production.

## 2) CDK Drive smoke test

- Token check:
  - `PILOT_VERIFY_API_URL=https://api.vex.example pnpm run pilot:verify --cdk`
- Direct call (example):
  - `pnpm --filter @vex/api exec tsx -e "import('./src/lib/cdk.ts').then(async (m) => console.log(await m.cdkDriveRequest('GET','/health')))"`.

## 3) Sync flow

- Outbound inventory sync:
  - `POST /integrations/cdk-drive/inventory-sync`
  - queue job: `cdk-inventory-sync`
- Outbound valuation push:
  - `POST /integrations/cdk-drive/valuation-push`
  - queue job: `cdk-valuation-push`

Expected logs:

- `IntegrationLog` event types:
  - `cdk.drive.inventory.sync.requested`
  - `cdk.drive.inventory.sync`
  - `cdk.drive.valuation.push.requested`
  - `cdk.drive.valuation.push`
- `ExternalSync` rows keyed by `(tenantId, externalId, entityType)`.

## 4) Neuron event flow

- Webhook endpoint:
  - `POST /integrations/webhooks/cdk-neuron`
- Signature:
  - validated with Fortellis webhook secret.
- Idempotency:
  - dedupe with composite integration key + stable queue job IDs.

## 5) Pilot acceptance gate

- First CDK Drive API call succeeds.
- Inventory sync + valuation push complete.
- One Neuron webhook accepted and replay deduped.
- Tenant isolation and RBAC remain enforced for all integration routes.
