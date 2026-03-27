import { z } from "zod";

export const PartnerSchema = z.object({
  name: z.string().min(2).max(140),
  type: z.enum(["DMS_VENDOR", "AUTO_GROUP", "FINANCE_LENDER"]),
  webhookUrl: z.string().url().optional(),
  revenueSharePct: z.number().min(0).max(15),
  contractRef: z.string().min(2).max(200),
});

export const ReferralPayoutSchema = z.object({
  partnerId: z.string().min(1),
  tenantId: z.string().min(1),
  conversionMrrUsd: z.number().min(0),
  payoutUsd: z.number().min(0),
  status: z.enum(["pending", "queued", "paid", "paused"]).default("pending"),
  idempotencyKey: z.string().min(8).max(200),
});

export type Partner = z.infer<typeof PartnerSchema>;
export type ReferralPayout = z.infer<typeof ReferralPayoutSchema>;
