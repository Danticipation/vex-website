import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { app } from "../src/app.js";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

async function run() {
  const tenant = await prisma.tenant.create({ data: { name: `val-int-${Date.now()}` } });
  const user = await prisma.user.create({ data: { tenantId: tenant.id, email: `val-int-${Date.now()}@vex.dev`, passwordHash: "x", role: "ADMIN" } });
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, tenantId: tenant.id, jti: randomUUID() },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  const server = app.listen(0);
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("no addr");
  const base = `http://127.0.0.1:${addr.port}`;

  const res = await fetch(`${base}/appraisals/valuate`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      tenantId: tenant.id,
      make: "Porsche",
      model: "911",
      year: 2020,
      mileage: 18000,
      condition: "good",
      zipCode: "90210",
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`valuate failed: status=${res.status} body=${JSON.stringify(body)}`);
  }
  assert.equal(res.ok, true);
  assert.ok(body.data?.appraisalId);

  const row = await prisma.appraisal.findFirst({ where: { id: body.data.appraisalId, tenantId: tenant.id } });
  assert.ok(row);
  const cache = await prisma.valuationCache.findFirst({ where: { tenantId: tenant.id } });
  assert.ok(cache);

  await prisma.eventLog.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.appraisal.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.valuationCache.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.tenant.deleteMany({ where: { id: tenant.id } });

  server.close();
  await prisma.$disconnect();
  console.log("valuation integration test: ok");
}

run().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
