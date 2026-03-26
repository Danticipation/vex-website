import { z } from "zod";

export const authJwtSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  role: z.enum(["CUSTOMER", "STAFF", "ADMIN", "GROUP_ADMIN"]),
  tenantId: z.string(),
  jti: z.string().optional(),
  groups: z.array(z.string()).optional(),
});

export type AuthJwt = z.infer<typeof authJwtSchema>;

