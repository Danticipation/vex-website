import crypto from "node:crypto";
import type { Partner, ReferralPayout } from "@vex/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "./tenant.js";
import { getRedis } from "./redis.js";

function commissionAmount(mrrUsd: number, revenueSharePct: number): number {
  const cappedPct = Math.max(0, Math.min(15, revenueSharePct));
  return Number(((mrrUsd * cappedPct) / 100).toFixed(2));
}

export class PartnersService {
  async onboardPartner(tenantId: string, actorId: string | undefined, input: Partner) {
    const partnerId = `ptn_${crypto.randomBytes(8).toString("hex")}`;
    const apiKeyPlain = `vpk_${crypto.randomBytes(24).toString("hex")}`;
    const apiKeyHash = crypto.createHash("sha256").update(apiKeyPlain).digest("hex");
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "PARTNER_ONBOARDED",
        entity: "Partner",
        entityId: partnerId,
        payload: { ...input, apiKeyHash } as unknown as Prisma.InputJsonValue,
      },
    });
    return { partnerId, apiKey: apiKeyPlain };
  }

  async ingestLead(tenantId: string, partnerId: string, idempotencyKey: string, leadPayload: Record<string, unknown>) {
    const redis = getRedis();
    const dedupeKey = `vex:partner:lead:${tenantId}:${partnerId}:${idempotencyKey}`;
    if (redis) {
      const ok = await redis.set(dedupeKey, "1", "EX", 60 * 60 * 24 * 14, "NX");
      if (ok !== "OK") return { accepted: false as const, reason: "duplicate" as const };
    }
    await prisma.eventLog.create({
      data: {
        tenantId,
        type: "partner.lead_ingested",
        payload: { partnerId, idempotencyKey, leadPayload } as unknown as Prisma.InputJsonValue,
      },
    });
    return { accepted: true as const };
  }

  async createPayout(tenantId: string, actorId: string | undefined, input: ReferralPayout) {
    const payoutUsd = commissionAmount(input.conversionMrrUsd, (input.payoutUsd / Math.max(1, input.conversionMrrUsd)) * 100);
    const negativeMargin = payoutUsd > input.conversionMrrUsd * 0.5;
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: negativeMargin ? "PARTNER_PAYOUT_PAUSED" : "PARTNER_PAYOUT_QUEUED",
        entity: "PartnerPayout",
        entityId: input.idempotencyKey,
        payload: { ...input, payoutUsd, negativeMargin },
      },
    });
    return { payoutUsd, status: negativeMargin ? "paused" : "queued" };
  }
}
