import { z } from "zod";

export const MrrForecastSchema = z.object({
  generatedAt: z.string(),
  currentMrr: z.number().nonnegative(),
  projectedMrr90d: z.number().nonnegative(),
  projectedMrr180d: z.number().nonnegative(),
  confidence: z.number().min(0).max(100),
});

export const ScenarioModelSchema = z.object({
  name: z.string().min(1),
  acquisitionLiftPct: z.number().min(-100).max(500),
  churnDeltaPct: z.number().min(-100).max(100),
  projectedMrr: z.number().nonnegative(),
});

export type MrrForecast = z.infer<typeof MrrForecastSchema>;
export type ScenarioModel = z.infer<typeof ScenarioModelSchema>;
