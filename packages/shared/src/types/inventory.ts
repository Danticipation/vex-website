import type { Vehicle } from "./vehicle.js";

export enum InventorySource {
  COMPANY = "COMPANY",
  PRIVATE_SELLER = "PRIVATE_SELLER",
}

export enum InventoryStatus {
  AVAILABLE = "AVAILABLE",
  RESERVED = "RESERVED",
  SOLD = "SOLD",
}

export enum VerificationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface Inventory {
  id: string;
  source: InventorySource;
  vehicleId: string;
  listedByUserId: string | null;
  location: string | null;
  listPrice: number;
  mileage: number | null;
  status: InventoryStatus;
  vin: string | null;
  verificationStatus: VerificationStatus | null;
  imageUrls: string[] | null;
  specs: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryWithVehicle extends Inventory {
  vehicle: Vehicle;
}
