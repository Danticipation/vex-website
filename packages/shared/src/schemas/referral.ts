import { z } from "zod";

export const createReferralSchema = z.object({
  maxUses: z.number().int().min(1).max(1000).optional(),
});

export const applyReferralSchema = z.object({
  code: z.string().min(4).max(128),
});
