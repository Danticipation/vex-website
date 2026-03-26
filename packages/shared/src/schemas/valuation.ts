import { z } from "zod";

// Tenant IDs are cuid in this codebase; accept uuid for forward compatibility.
const tenantIdSchema = z.string().refine((v) => /^c[a-z0-9]{24}$/i.test(v) || /^[0-9a-fA-F-]{36}$/.test(v), "Invalid tenantId");

export const ValuationInputSchema = z.object({
  vin: z.string().length(17).optional(),
  make: z.string(),
  model: z.string(),
  year: z.number().int().min(1900),
  mileage: z.number().int().min(0),
  condition: z.enum(["excellent", "good", "fair", "poor"]),
  zipCode: z.string().length(5),
  tenantId: tenantIdSchema,
  appraisalId: z.string().optional(),
});

export const ValuationResultSchema = z.object({
  source: z.enum(["edmunds", "marketcheck", "fallback"]),
  valueLow: z.number(),
  valueAvg: z.number(),
  valueHigh: z.number(),
  currency: z.literal("USD"),
  confidence: z.number().min(0).max(100),
  timestamp: z.date(),
  rawData: z.record(z.any()),
});

export const AppraisalValuateResponseSchema = ValuationResultSchema.extend({
  appraisalId: z.string(),
});

export type ValuationInput = z.infer<typeof ValuationInputSchema>;
export type ValuationResult = z.infer<typeof ValuationResultSchema>;
export type AppraisalValuateResponse = z.infer<typeof AppraisalValuateResponseSchema>;
