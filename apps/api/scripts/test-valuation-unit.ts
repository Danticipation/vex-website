import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { ValuationService } from "../src/lib/valuation.js";

const svc = new ValuationService();
const prisma = new PrismaClient();

async function run() {
  const oldFetch = globalThis.fetch;
  const tenant = await prisma.tenant.create({ data: { name: `valuation-unit-${Date.now()}` } });

  // Edmunds success
  globalThis.fetch = (async (url: string) => {
    if (url.includes("edmunds")) {
      return new Response(JSON.stringify({ tmv: 42000 }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response("{}", { status: 500 });
  }) as any;
  const a = await svc.getValuation({ tenantId: tenant.id, make: "BMW", model: "M3", year: 2021, mileage: 20000, condition: "good", zipCode: "90210" });
  assert.equal(a.success, true);

  // Fallback when providers fail
  globalThis.fetch = (async () => new Response("{}", { status: 500 })) as any;
  const b = await svc.getValuation({ tenantId: tenant.id, make: "Audi", model: "R8", year: 2019, mileage: 25000, condition: "fair", zipCode: "10001" });
  assert.equal(b.success, true);

  // Cache hit path (same input)
  const c = await svc.getValuation({ tenantId: tenant.id, make: "Audi", model: "R8", year: 2019, mileage: 25000, condition: "fair", zipCode: "10001" });
  assert.equal(c.success, true);

  globalThis.fetch = oldFetch;
  await prisma.valuationCache.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.tenant.deleteMany({ where: { id: tenant.id } });
  await prisma.$disconnect();
  console.log("valuation unit tests: ok");
}

run().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
