import { z } from "zod";

/** Public trade-in / marketing instant estimate (no auth). */
export const quickAppraisalSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2030),
  mileage: z.number().int().nonnegative(),
  condition: z.string().optional(),
});

export type QuickAppraisalInput = z.infer<typeof quickAppraisalSchema>;

/** Staff CRM create — optional links to inventory vehicle and customer. */
export const createAppraisalSchema = z
  .object({
    vehicleId: z.string().optional(),
    customerId: z.string().optional(),
    notes: z.string().max(8000).optional(),
    status: z.enum(["pending", "completed", "cancelled"]).optional(),
  })
  .transform((d) => ({
    ...d,
    vehicleId: d.vehicleId?.trim() ? d.vehicleId.trim() : undefined,
    customerId: d.customerId?.trim() ? d.customerId.trim() : undefined,
  }));

export type CreateAppraisalInput = z.infer<typeof createAppraisalSchema>;

export const updateAppraisalSchema = z
  .object({
    vehicleId: z.string().nullable().optional(),
    customerId: z.string().nullable().optional(),
    notes: z.string().max(8000).nullable().optional(),
    status: z.string().min(1).optional(),
    value: z.preprocess(
      (v) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v)),
      z.number().nonnegative().nullable().optional()
    ),
  })
  .transform((d) => ({
    ...d,
    vehicleId: d.vehicleId === "" ? null : d.vehicleId,
    customerId: d.customerId === "" ? null : d.customerId,
  }));

export type UpdateAppraisalInput = z.infer<typeof updateAppraisalSchema>;

export const appraisalVehicleEmbedSchema = z.object({
  id: z.string(),
  make: z.string(),
  model: z.string(),
  trimLevel: z.string(),
  year: z.number(),
});

export const appraisalCustomerEmbedSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});

export const appraisalOutputSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  vehicleId: z.string().nullable(),
  customerId: z.string().nullable(),
  value: z.number().nullable(),
  notes: z.string().nullable(),
  status: z.string(),
  valuationData: z.record(z.any()).nullable().optional(),
  valuationSource: z.string().nullable().optional(),
  valuationFetchedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  vehicle: appraisalVehicleEmbedSchema.nullable().optional(),
  customer: appraisalCustomerEmbedSchema.nullable().optional(),
});

export type AppraisalOutput = z.infer<typeof appraisalOutputSchema>;
