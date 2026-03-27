import { z } from "zod";

export const BoardPackSchema = z.object({
  generatedAt: z.string(),
  quarter: z.string().min(1),
  mrr: z.number().nonnegative(),
  burnUsd: z.number().nonnegative(),
  keyRisks: z.array(z.string()),
});

export const EquityGrantSchema = z.object({
  employeeId: z.string().min(1),
  grantType: z.enum(["ISO", "NSO", "RSU"]),
  units: z.number().int().positive(),
  strikePriceUsd: z.number().nonnegative(),
});

export const BoardResolutionSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.enum(["financing", "equity", "risk", "operations", "compliance"]),
  status: z.enum(["draft", "approved", "rejected"]).default("draft"),
  effectiveDate: z.string(),
  notes: z.string().max(4000).optional(),
});

export type BoardPack = z.infer<typeof BoardPackSchema>;
export type EquityGrant = z.infer<typeof EquityGrantSchema>;
export type BoardResolution = z.infer<typeof BoardResolutionSchema>;
