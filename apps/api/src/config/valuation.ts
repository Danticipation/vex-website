export const valuationConfig = Object.freeze({
  rateLimits: {
    edmundsPerMinute: 100,
    marketcheckPerDay: 500,
  },
  costCaps: {
    minPerCallUsd: 0.01,
    maxPerCallUsd: 0.05,
    dailyUsdCap: 5,
  },
  cacheTtlMs: 24 * 60 * 60 * 1000,
});
