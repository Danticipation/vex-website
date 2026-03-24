import { z } from "zod";

export const createInventorySchema = z.object({
  source: z.enum(["COMPANY", "PRIVATE_SELLER"]),
  vehicleId: z.string().min(1),
  location: z.string().optional(),
  listPrice: z.number().positive(),
  mileage: z.number().int().nonnegative().optional(),
  vin: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  specs: z.record(z.unknown()).optional(),
  modelGlbUrl: z.string().min(1).optional(),
  modelSource: z.enum(["LIBRARY", "UPLOAD", "GENERATED_FROM_PHOTOS"]).optional(),
  modelSourcePhotoIds: z.array(z.string()).optional(),
});

export const updateInventorySchema = z.object({
  location: z.string().optional(),
  listPrice: z.number().positive().optional(),
  mileage: z.number().int().nonnegative().optional(),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]).optional(),
  vin: z.string().optional(),
  verificationStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  imageUrls: z.array(z.string()).optional(),
  specs: z.record(z.unknown()).optional(),
  modelGlbUrl: z.string().url().nullable().optional(),
  modelSource: z.enum(["LIBRARY", "UPLOAD", "GENERATED_FROM_PHOTOS"]).nullable().optional(),
  modelSourcePhotoIds: z.array(z.string()).nullable().optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
