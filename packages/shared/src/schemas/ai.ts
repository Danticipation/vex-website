import { z } from "zod";

export const insightsInputSchema = z.object({
  tenantId: z.string(),
  model: z.enum(["PredictiveValuationTrend", "LeadScore", "ChurnRisk"]),
  payload: z.record(z.any()).default({}),
});

export const insightsOutputSchema = z.object({
  version: z.string().default("v1"),
  model: z.enum(["PredictiveValuationTrend", "LeadScore", "ChurnRisk"]),
  score: z.number().min(0).max(100).optional(),
  trend: z.number().optional(),
  explanation: z.record(z.any()).default({}),
  source: z.enum(["llm", "rule_based"]).default("rule_based"),
  generatedAt: z.date().default(() => new Date()),
});

export type InsightsInput = z.infer<typeof insightsInputSchema>;
export type InsightsOutput = z.infer<typeof insightsOutputSchema>;
