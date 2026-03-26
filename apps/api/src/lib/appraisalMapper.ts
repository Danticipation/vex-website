import type { Appraisal, Customer, Vehicle } from "@prisma/client";
import type { AppraisalOutput } from "@vex/shared";

type Row = Appraisal & {
  vehicle?: Pick<Vehicle, "id" | "make" | "model" | "trimLevel" | "year"> | null;
  customer?: Pick<Customer, "id" | "name" | "email" | "phone"> | null;
};

export function mapAppraisalToOutput(row: Row): AppraisalOutput {
  return {
    id: row.id,
    tenantId: row.tenantId,
    vehicleId: row.vehicleId,
    customerId: row.customerId,
    value: row.value != null ? Number(row.value) : null,
    notes: row.notes,
    status: row.status,
    valuationData: (row as unknown as { valuationData?: unknown }).valuationData as Record<string, unknown> | null ?? null,
    valuationSource: (row as unknown as { valuationSource?: string | null }).valuationSource ?? null,
    valuationFetchedAt: ((row as unknown as { valuationFetchedAt?: Date | null }).valuationFetchedAt ?? null)?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    vehicle: row.vehicle
      ? {
          id: row.vehicle.id,
          make: row.vehicle.make,
          model: row.vehicle.model,
          trimLevel: row.vehicle.trimLevel,
          year: row.vehicle.year,
        }
      : null,
    customer: row.customer
      ? {
          id: row.customer.id,
          name: row.customer.name,
          email: row.customer.email,
          phone: row.customer.phone,
        }
      : null,
  };
}
