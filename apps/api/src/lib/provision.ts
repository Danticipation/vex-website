import { prisma } from "./tenant.js";
import { ValuationService } from "./valuation.js";

const valuationService = new ValuationService();

export async function provisionTenantDemo(input: { tenantId: string; tier: string; email: string }) {
  const existing = await prisma.inventory.count();
  if (existing > 0) {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        action: "PROVISION_SKIP_ALREADY_SEEDED",
        entity: "Tenant",
        entityId: input.tenantId,
        payload: { tier: input.tier, email: input.email },
      },
    });
    return;
  }

  for (let i = 0; i < 10; i++) {
    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId: input.tenantId,
        make: "Demo",
        model: `Model-${i + 1}`,
        trimLevel: "Base",
        year: 2020 + (i % 4),
        basePrice: 25000 + i * 1200,
      },
    });
    await prisma.inventory.create({
      data: {
        tenantId: input.tenantId,
        source: "COMPANY",
        vehicleId: vehicle.id,
        listPrice: 28000 + i * 1500,
        status: "AVAILABLE",
        mileage: 8000 + i * 1500,
      },
    });
  }

  for (let i = 0; i < 3; i++) {
    const outcome = await valuationService.getValuation({
      tenantId: input.tenantId,
      make: "Demo",
      model: `Model-${i + 1}`,
      year: 2022,
      mileage: 12000 + i * 1000,
      condition: "good",
      zipCode: "90210",
    });
    const value = outcome.success ? outcome.result.valueAvg : (outcome as { fallbackValue?: number | null }).fallbackValue ?? null;
    await prisma.appraisal.create({
      data: {
        tenantId: input.tenantId,
        status: "completed",
        notes: `Provisioned demo appraisal #${i + 1}`,
        value: value ?? undefined,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      action: "PROVISION_COMPLETE",
      entity: "Tenant",
      entityId: input.tenantId,
      payload: { tier: input.tier, email: input.email },
    },
  });
}
