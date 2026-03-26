import { z } from "zod";

export const provisionJobSchema = z.object({
  tenantId: z.string(),
  tier: z.string(),
  email: z.string().email(),
});

export type ProvisionJobInput = z.infer<typeof provisionJobSchema>;
