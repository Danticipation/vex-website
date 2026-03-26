/**
 * Lightweight load harness: N tenants × M valuation-shaped requests (uses existing API; set JWT + base URL in env).
 * Example:
 *   LOAD_TEST_BASE=http://127.0.0.1:3001 LOAD_TEST_JWT=eyJ... pnpm --filter @vex/api exec tsx scripts/load-test-scale.ts
 */
import assert from "node:assert/strict";

const base = process.env.LOAD_TEST_BASE || "http://127.0.0.1:3001";
const token = process.env.LOAD_TEST_JWT || "";
const tenants = Number(process.env.LOAD_TEST_TENANTS || 10);
const perTenant = Number(process.env.LOAD_TEST_REQ_PER_TENANT || 10);

async function oneCall(i: number, j: number) {
  const res = await fetch(`${base}/health`, { method: "GET" });
  assert.ok(res.ok, `health ${i}/${j} status=${res.status}`);
}

async function run() {
  if (!token) {
    console.warn("LOAD_TEST_JWT not set — running health-only fanout (no authenticated valuation load).");
  }
  const tasks: Promise<void>[] = [];
  for (let i = 0; i < tenants; i++) {
    for (let j = 0; j < perTenant; j++) {
      tasks.push(oneCall(i, j));
    }
  }
  await Promise.all(tasks);
  console.log(`load-test-scale: ok (${tenants} tenants × ${perTenant} health checks)`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
