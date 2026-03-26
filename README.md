# VEX — Vortex Exotic Exchange

Luxury automotive marketplace: customer-facing site, build-your-own configurator, CRM, and full deal flow (inventory, financing, shipping, trade-in).

## Docs

- **Design:** [docs/plans/2025-03-15-vex-luxury-marketplace-design.md](docs/plans/2025-03-15-vex-luxury-marketplace-design.md)
- **Implementation plan:** [docs/plans/2025-03-15-vex-luxury-marketplace-implementation.md](docs/plans/2025-03-15-vex-luxury-marketplace-implementation.md)
- **Leads (SMS/email → CRM):** [docs/leads-webhooks.md](docs/leads-webhooks.md)

## Repo structure

- **apps/api** — Node/Express API (auth, inventory, orders, etc.)
- **apps/web** — Next.js customer site (dark luxury theme)
- **apps/crm** — Next.js CRM for staff
- **packages/shared** — Shared TypeScript types and Zod schemas

## Prerequisites

- Node 20+
- pnpm (install globally: `npm install -g pnpm`, or use `npx pnpm` for every command)
- PostgreSQL (for API)

## Setup

1. **Install dependencies**

   If `pnpm` is not in your PATH, use `npx pnpm`:

   ```bash
   npx pnpm install
   ```

   Or after installing pnpm globally (`npm install -g pnpm`):

   ```bash
   pnpm install
   ```

2. **API**

   - Copy `apps/api/.env.example` to `apps/api/.env` and set `DATABASE_URL` and `JWT_SECRET`.
   - Run migrations: `cd apps/api && npx prisma migrate deploy` (or `migrate dev` for a fresh DB).
   - Seed the database (admin user, sample vehicles, inventory): `cd apps/api && npx pnpm run db:seed` or `npx prisma db seed`.
   - Start API: `pnpm dev:api` (or `cd apps/api && npx tsx src/index.ts`)

3. **Shared package** (required before API or apps that use it)

   ```bash
   pnpm --filter @vex/shared build
   ```

4. **Customer site (web)**

   - Optional: add the VEX logo (no background) as `apps/web/public/vex-logo.png` for the header.
   - Start: `pnpm dev:web` → [http://localhost:3000](http://localhost:3000)

5. **CRM** (staff only)

   - Set `NEXT_PUBLIC_API_URL` (and optionally `NEXT_PUBLIC_WEB_URL` for “View on site” links).
   - After seeding, sign in with **admin@vex.demo** or **staff@vex.demo** (password: `admin-vex-demo` — change in production).
   - Start: `pnpm dev:crm` → [http://localhost:3002](http://localhost:3002)

## Environment variables

| App   | Variable              | Description                    |
|-------|------------------------|--------------------------------|
| API   | `DATABASE_URL`         | PostgreSQL connection string (pooler or Accelerate) |
| API   | `DIRECT_DATABASE_URL`  | Direct Postgres URL for migrations / long scripts |
| API   | `REDIS_URL`              | Redis for BullMQ, cache, refresh tokens, rate limits |
| API   | `JWT_SECRET`           | Secret for signing JWTs         |
| API   | `PORT`                 | Server port (default 3001)      |
| API   | `CORS_ORIGIN`          | Allowed origin (e.g. http://localhost:3000) |
| Web   | `NEXT_PUBLIC_API_URL`  | API base URL (e.g. http://localhost:3001)   |
| CRM   | `NEXT_PUBLIC_API_URL`  | API base URL                   |
| CRM   | `NEXT_PUBLIC_WEB_URL`  | Customer site URL (for "View on site" links) |

## Scripts (from repo root)

Use `pnpm` or `npx pnpm` if pnpm isn’t installed globally:

| Command | Description |
|---------|--------------|
| `pnpm dev:api` or `npx pnpm run dev:api` | Start API on port 3001 |
| `pnpm dev:web` or `npx pnpm run dev:web` | Start customer site on 3000 |
| `pnpm dev:crm` or `npx pnpm run dev:crm` | Start CRM on 3002 |
| `pnpm build` or `npx pnpm run build` | Build all packages |
| `cd apps/api && pnpm run db:seed` or `npx prisma db seed` | Seed DB (admin, vehicles, inventory) |

## Logo

Place your **VEX logo (no background)** at `apps/web/public/vex-logo.png`. The header will use it; if the file is missing, the text “VEX” is shown as fallback.


## Valuation API cost model
- Pro/Enterprise tiers include API-powered appraisals.
- Daily guardrail: max `$5/day` external valuation spend per tenant before fallback/manual flow.
- Cached valuations (24h TTL) reduce duplicate API calls and cost.

## Billion-scale operations (targets)
- **Cost / MRR**: target **~$0.02/tenant/month** at 100k tenants via PgBouncer/Accelerate-style pooling, Redis cache-aside, BullMQ async work, and read replicas (`READ_REPLICA_URLS` for future read routing).
- **Infra**: `DIRECT_DATABASE_URL` for migrations when `DATABASE_URL` uses a pooler or Prisma Accelerate; `REDIS_URL` for queues, refresh tokens, JWT denylist, and rate limits; optional `OTEL_EXPORTER_OTLP_ENDPOINT` for traces.
- **Partitioning / cron**: declarative Postgres partitions and `pg_cron` retention are documented in `apps/api/prisma/sql/` (ops-applied).
- **Verification**: `pnpm --filter @vex/api run test:e2e`, `pnpm --filter @vex/api run load-test:scale`, `GET /metrics` (Prometheus).

## Investor sharing links
- Live MRR dashboard URL: `https://app.vex.example/admin` (replace with your production domain).
- Pilot signup link: `https://app.vex.example/pilot` (replace with your production domain).
- Live seed metrics dashboard URL: `https://app.vex.example/seed-metrics` (replace with your production domain).
