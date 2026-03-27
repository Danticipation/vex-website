import crypto from "node:crypto";
import type { Campaign } from "@vex/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "./tenant.js";

function monthlySendLimitForTier(tier: string): number {
  return tier === "STARTER" ? 1000 : 100000;
}

export class MarketingService {
  async createCampaign(tenantId: string, actorId: string | undefined, input: Campaign) {
    const variantWeightSum = input.variants.reduce((sum, v) => sum + v.weight, 0);
    if (variantWeightSum <= 0) throw new Error("Invalid A/B weight sum");

    const campaignId = `cmp_${crypto.randomBytes(8).toString("hex")}`;
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "MARKETING_CAMPAIGN_CREATED",
        entity: "MarketingCampaign",
        entityId: campaignId,
        payload: input as unknown as Prisma.InputJsonValue,
      },
    });
    return { campaignId, status: "draft" as const };
  }

  async queueNightlyRun(tenantId: string, campaignId: string) {
    await prisma.eventLog.create({
      data: {
        tenantId,
        type: "marketing.nightly_queued",
        payload: { campaignId },
      },
    });
  }

  async recordConversion(tenantId: string, campaignId: string, variantId: string, amountUsd: number) {
    await prisma.growthMetric.create({
      data: {
        tenantId,
        key: "marketing_conversion",
        value: amountUsd,
        meta: { campaignId, variantId },
      },
    });
  }

  async canSend(tenantId: string): Promise<{ ok: boolean; monthlyLimit: number; usedThisMonth: number }> {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { billingTier: true },
    });
    const monthlyLimit = monthlySendLimitForTier(tenant?.billingTier ?? "STARTER");
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const usedThisMonth = await prisma.usageLog.aggregate({
      where: { tenantId, kind: "marketing_send", createdAt: { gte: start } },
      _sum: { quantity: true },
    });
    const used = usedThisMonth._sum.quantity ?? 0;
    return { ok: used < monthlyLimit, monthlyLimit, usedThisMonth: used };
  }
}
