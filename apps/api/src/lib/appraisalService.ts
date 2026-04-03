import type { QuickAppraisalInput } from "@vex/shared";
import { prisma, runWithTenant } from "./tenant.js";
import { estimateFromQuickInput } from "./appraisalValuation.js";

export async function createPublicQuickAppraisal(tenantId: string, input: QuickAppraisalInput) {
  const estimatedValue = estimateFromQuickInput(input);
  const notes = JSON.stringify({
    make: input.make,
    model: input.model,
    year: input.year,
    mileage: input.mileage,
    condition: input.condition ?? null,
    source: "quick_estimate",
  });

  return runWithTenant(tenantId, async () => {
    const appraisal = await prisma.appraisal.create({
      data: {
        tenantId,
        value: estimatedValue,
        notes,
        status: "pending",
        valuationSource: "fallback",
        valuationFetchedAt: new Date(),
      },
    });

    await prisma.$transaction([
      prisma.usageLog.create({
        data: {
          tenantId,
          kind: "APPRAISAL_CALL",
          quantity: 1,
          amountUsd: 0,
          meta: { source: "public_quick_appraisal", appraisalId: appraisal.id },
        },
      }),
      prisma.eventLog.create({
        data: {
          tenantId,
          type: "revenue.usage.appraisal_created",
          payload: {
            appraisalId: appraisal.id,
            estimatedValue,
            source: "public_quick_appraisal",
          },
        },
      }),
    ]);

    return { appraisal, estimatedValue };
  });
}

