import { z } from "zod";

export const createSavedVehicleSchema = z.object({
  inventoryId: z.string().optional(),
  configSnapshot: z.record(z.unknown()).optional(),
}).refine((data) => data.inventoryId ?? data.configSnapshot, {
  message: "Either inventoryId or configSnapshot is required",
});

export type CreateSavedVehicleInput = z.infer<typeof createSavedVehicleSchema>;
