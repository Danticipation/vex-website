import { z } from "zod";

export const createOrderSchema = z.object({
  type: z.enum(["INVENTORY", "CUSTOM_BUILD"]),
  inventoryId: z.string().optional(),
  vehicleId: z.string().optional(),
  configSnapshot: z.record(z.unknown()).optional(),
  depositAmount: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative().optional(),
  financingSnapshot: z.record(z.unknown()).optional(),
  tradeInSnapshot: z.record(z.unknown()).optional(),
  shippingSnapshot: z.record(z.unknown()).optional(),
  stylingAddonsSnapshot: z.record(z.unknown()).optional(),
  status: z.enum(["DRAFT", "DEPOSIT_PAID"]).optional(),
});

export const updateOrderSchema = z.object({
  status: z.enum(["DRAFT", "DEPOSIT_PAID", "CONFIRMED", "FULFILLED"]).optional(),
  depositAmount: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
