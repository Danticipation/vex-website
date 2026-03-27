import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { app } from "../src/app.js";

const prisma = new PrismaClient();

async function main() {
  const jwtSecret = process.env.JWT_SECRET || "test-secret";
  process.env.JWT_SECRET = jwtSecret;
  const suffix = Date.now();

  const eu = await prisma.tenant.create({
    data: {
      name: `e2e-eu-${suffix}`,
      region: "EU",
      dataResidency: "EU",
      currency: "EUR",
      locale: "en-GB",
    },
  });
  const latam = await prisma.tenant.create({
    data: {
      name: `e2e-latam-${suffix}`,
      region: "LATAM",
      dataResidency: "LATAM",
      currency: "BRL",
      locale: "pt-BR",
    },
  });

  const euUser = await prisma.user.create({
    data: { tenantId: eu.id, email: `eu-${suffix}@example.com`, passwordHash: "hash", role: "ADMIN" },
  });

  const token = jwt.sign({ userId: euUser.id, email: euUser.email, role: euUser.role, tenantId: eu.id }, jwtSecret, { expiresIn: "15m" });
  const server = app.listen(0, "127.0.0.1");
  try {
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("server start failed");
    const base = `http://127.0.0.1:${addr.port}`;

    const blocked = await fetch(`${base}/compliance/export`, { headers: { authorization: `Bearer ${token}`, "x-vex-region": "LATAM" } });
    if (blocked.status !== 403) throw new Error(`Expected 403, got ${blocked.status}`);

    const allowed = await fetch(`${base}/compliance/export`, { headers: { authorization: `Bearer ${token}`, "x-vex-region": "EU" } });
    if (allowed.status !== 200) throw new Error(`Expected 200, got ${allowed.status}`);

    console.log("e2e-global-market-residency: OK");
  } finally {
    server.close();
    await prisma.auditLog.deleteMany({ where: { tenantId: { in: [eu.id, latam.id] } } });
    await prisma.user.deleteMany({ where: { id: euUser.id } });
    await prisma.tenant.deleteMany({ where: { id: { in: [eu.id, latam.id] } } });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
