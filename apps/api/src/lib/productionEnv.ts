/**
 * Fail fast when NODE_ENV=production so misconfigured APIs never listen.
 * Call from index.ts after dotenv and valuation env checks.
 */
export function assertProductionReady(): void {
  if (process.env.NODE_ENV !== "production") return;

  const cors = process.env.CORS_ORIGIN?.trim() ?? "";
  if (!cors || cors === "*") {
    console.error(
      "[production] CORS_ORIGIN must list allowed browser origins (comma-separated). Empty or * is not permitted."
    );
    process.exit(1);
  }

  const skipVal =
    process.env.SKIP_VALUATION_ENV_CHECK === "1" || process.env.SKIP_VALUATION_ENV_CHECK === "true";
  if (skipVal) {
    console.error("[production] Remove SKIP_VALUATION_ENV_CHECK — valuation provider keys are required.");
    process.exit(1);
  }

  if (!process.env.REDIS_URL?.trim()) {
    console.warn(
      "[production] REDIS_URL is not set — using in-memory rate limits and BullMQ/async jobs are disabled. Set REDIS_URL for pilot-grade reliability."
    );
  }

  const fortellisRequired = [
    "FORTELLIS_CLIENT_ID",
    "FORTELLIS_CLIENT_SECRET",
    "FORTELLIS_SUBSCRIPTION_ID",
    "FORTELLIS_TOKEN_URL",
  ];
  const missingFortellis = fortellisRequired.filter((k) => !process.env[k]?.trim());
  if (missingFortellis.length > 0) {
    console.error(
      `[production] Missing Fortellis env vars: ${missingFortellis.join(", ")}. ` +
        "Set Fortellis credentials before enabling dealer integrations."
    );
    process.exit(1);
  }

  const tekionRequired = [
    "TEKION_CLIENT_ID",
    "TEKION_CLIENT_SECRET",
    "TEKION_SUBSCRIPTION_ID",
    "TEKION_TOKEN_URL",
  ];
  const missingTekion = tekionRequired.filter((k) => !process.env[k]?.trim());
  if (missingTekion.length > 0) {
    console.error(
      `[production] Missing Tekion env vars: ${missingTekion.join(", ")}. ` +
        "Set Tekion APC credentials before enabling dealer integrations."
    );
    process.exit(1);
  }

  const reynoldsRequired = [
    "REYNOLDS_CLIENT_ID",
    "REYNOLDS_CLIENT_SECRET",
    "REYNOLDS_SUBSCRIPTION_ID",
    "REYNOLDS_TOKEN_URL",
  ];
  const missingReynolds = reynoldsRequired.filter((k) => !process.env[k]?.trim());
  if (missingReynolds.length > 0) {
    console.error(
      `[production] Missing Reynolds env vars: ${missingReynolds.join(", ")}. ` +
        "Set Reynolds RCI credentials before enabling dealer integrations."
    );
    process.exit(1);
  }

  const dealertrackRequired = [
    "DEALERTRACK_CLIENT_ID",
    "DEALERTRACK_CLIENT_SECRET",
    "DEALERTRACK_SUBSCRIPTION_ID",
    "DEALERTRACK_TOKEN_URL",
  ];
  const missingDealertrack = dealertrackRequired.filter((k) => !process.env[k]?.trim());
  if (missingDealertrack.length > 0) {
    console.error(
      `[production] Missing Dealertrack env vars: ${missingDealertrack.join(", ")}. ` +
        "Set Dealertrack OpenTrack credentials before enabling F&I integrations."
    );
    process.exit(1);
  }

  const cdkSandbox = process.env.CDK_SANDBOX;
  if (cdkSandbox && cdkSandbox !== "true" && cdkSandbox !== "false") {
    console.error("[production] CDK_SANDBOX must be 'true' or 'false' when provided.");
    process.exit(1);
  }
}
