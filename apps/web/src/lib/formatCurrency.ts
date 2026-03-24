/** US locale — prices stored as numbers; display in USD. */
export function formatUsd(amount: number, fractionDigits: 0 | 2 = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(amount);
}
