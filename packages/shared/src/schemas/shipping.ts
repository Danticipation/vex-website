import { z } from "zod";

export const shippingQuoteSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  openEnclosed: z.enum(["OPEN", "ENCLOSED"]),
});

export type ShippingQuoteInput = z.infer<typeof shippingQuoteSchema>;
