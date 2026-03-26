import { z } from "zod";

export const retentionTriggerSchema = z.object({
  tenantId: z.string(),
  trigger: z.enum(["churn_risk_high", "usage_drop", "pilot_expiring"]),
  targetUserId: z.string().optional(),
});

export const upsellOfferSchema = z.object({
  tenantId: z.string(),
  offerType: z.enum(["ai_pro", "dms_sync_pack", "multi_location"]),
  discountPct: z.number().min(0).max(100).optional(),
});
