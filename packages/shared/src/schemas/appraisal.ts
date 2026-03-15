import { z } from "zod";

export const createAppraisalSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2030),
  mileage: z.number().int().nonnegative(),
  condition: z.string().min(1).optional(),
});

export type CreateAppraisalInput = z.infer<typeof createAppraisalSchema>;
