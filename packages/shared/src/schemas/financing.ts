import { z } from "zod";

export const financingCalculateSchema = z.object({
  price: z.number().positive(),
  termMonths: z.number().int().min(1).max(96),
  apr: z.number().min(0).max(100),
});

export type FinancingCalculateInput = z.infer<typeof financingCalculateSchema>;
