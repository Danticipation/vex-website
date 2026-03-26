/**
 * End-to-end: create appraisal for tenant A; verify no DB row exists with same id scoped to tenant B.
 * Run: pnpm --filter @vex/api run test:e2e:appraisal
 */
import { PrismaClient } from "@prisma/client";
import { runWithTenant } from "../src/lib/tenant.js";

const prisma = new PrismaClient();
const rawPrisma = new PrismaClient();

async function main() {
  const suffix = Date.now();
  const tenantA = await prisma.tenant.create({ data: { name: `e2e-a-${suffix}` } });
  const tenantB = await prisma.tenant.create({ data: { name: `e2e-b-${suffix}` } });

  const appraisal = await runWithTenant(tenantA.id, async () =>
    prisma.appraisal.create({
      data: {
        tenantId: tenantA.id,
        status: "pending",
      },
    })
  );

  const row = await rawPrisma.appraisal.findUnique({ where: { id: appraisal.id } });
  if (row?.tenantId !== tenantA.id) {
    throw new Error(`E2E: expected appraisal tenant ${tenantA.id}, got ${row?.tenantId ?? "null"}`);
  }

  const cross = await rawPrisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c FROM appraisals WHERE id = ${appraisal.id} AND tenant_id = ${tenantB.id}
  `;
  if (Number(cross[0]?.c ?? 0) !== 0) {
    throw new Error("E2E FAILED: SQL found appraisal id under wrong tenant");
  }

  const sameTenant = await rawPrisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c FROM appraisals WHERE id = ${appraisal.id} AND tenant_id = ${tenantA.id}
  `;
  if (Number(sameTenant[0]?.c ?? 0) !== 1) {
    throw new Error("E2E FAILED: appraisal row missing for owning tenant");
  }

  await prisma.appraisal.deleteMany({ where: { id: appraisal.id } });
  await prisma.tenant.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } });

  console.log("e2e-appraisal-isolation: OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => Promise.all([prisma.$disconnect(), rawPrisma.$disconnect()]));
