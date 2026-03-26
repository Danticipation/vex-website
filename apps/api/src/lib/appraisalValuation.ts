import type { QuickAppraisalInput } from "@vex/shared";

/**
 * Rule-based estimate (v1). Swap for third-party valuation API using the same signature.
 * @see env VALUATION_PROVIDER / VALUATION_API_KEY for future integration
 */
export function estimateFromQuickInput(input: QuickAppraisalInput & { basePrice?: number }): number {
  const baseYear = new Date().getFullYear();
  const ageFactor = Math.max(0, baseYear - input.year);
  const mileageDepreciation = Math.min(0.3, (input.mileage / 150_000) * 0.3);
  const base = input.basePrice ?? 25_000 + Math.max(0, input.year - 2015) * 2_000;
  const value = base * (1 - ageFactor * 0.08) * (1 - mileageDepreciation);
  return Math.round(Math.max(1000, value) * 100) / 100;
}

export function estimateFromVehicleBasePrice(year: number, mileage: number, basePrice: number): number {
  return estimateFromQuickInput({
    make: "",
    model: "",
    year,
    mileage,
    basePrice,
  });
}
