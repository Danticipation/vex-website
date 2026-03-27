import { z } from "zod";

export const SeriesADataRoomSchema = z.object({
  generatedAt: z.string(),
  mrr: z.number().nonnegative(),
  growthMoM: z.number().min(0).max(500),
  burnMonthlyUsd: z.number().nonnegative(),
  runwayMonths: z.number().nonnegative(),
  highlights: z.array(z.string().min(1)),
});

export const TermSheetSimulatorSchema = z.object({
  valuationPreMoneyUsd: z.number().positive(),
  raiseAmountUsd: z.number().positive(),
  optionPoolPct: z.number().min(0).max(40),
  investorOwnershipPct: z.number().min(0).max(100),
  founderDilutionPct: z.number().min(0).max(100),
});

export type SeriesADataRoom = z.infer<typeof SeriesADataRoomSchema>;
export type TermSheetSimulator = z.infer<typeof TermSheetSimulatorSchema>;
