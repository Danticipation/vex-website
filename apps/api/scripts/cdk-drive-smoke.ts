/**
 * One-command Fortellis OAuth + optional CDK Drive API probe (same auth as CDK wrapper).
 * Loads apps/api/.env.local (and siblings) via loadApiEnv.
 *
 * Usage (from repo root):
 *   pnpm --filter @vex/api run smoke:cdk-drive
 *
 * Optional: CDK_DRIVE_SMOKE_METHOD=GET CDK_DRIVE_SMOKE_PATH=/inventory/v1/vehicles
 * (path is relative to Fortellis /cdk/drive namespace — see src/lib/cdk.ts)
 */
import { loadApiEnv } from "../src/lib/env.js";
import { getFortellisAccessToken } from "../src/lib/fortellis.js";
import { cdkDriveRequest } from "../src/lib/cdk.js";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function parseMethod(raw: string | undefined): HttpMethod {
  const m = (raw ?? "GET").toUpperCase();
  if (m === "GET" || m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE") return m;
  throw new Error(`CDK_DRIVE_SMOKE_METHOD must be GET|POST|PUT|PATCH|DELETE, got: ${raw}`);
}

async function main(): Promise<void> {
  loadApiEnv();

  await getFortellisAccessToken();
  console.log("cdk-drive-smoke: Fortellis OAuth OK (CDK uses same token)");

  const path = process.env.CDK_DRIVE_SMOKE_PATH?.trim();
  if (!path) {
    console.log(
      "cdk-drive-smoke: optional — set CDK_DRIVE_SMOKE_PATH (e.g. /inventory/v1/vehicles) to hit CDK Drive"
    );
    return;
  }

  const method = parseMethod(process.env.CDK_DRIVE_SMOKE_METHOD);
  const bodyRaw = process.env.CDK_DRIVE_SMOKE_BODY_JSON?.trim();
  const data =
    bodyRaw && (method === "POST" || method === "PUT" || method === "PATCH")
      ? (JSON.parse(bodyRaw) as unknown)
      : undefined;

  const result = await cdkDriveRequest<unknown>(method, path, data);
  console.log("cdk-drive-smoke: Drive API OK", method, path, JSON.stringify(result).slice(0, 500));
}

main().catch((e) => {
  console.error("cdk-drive-smoke: FAIL", e instanceof Error ? e.message : e);
  process.exit(1);
});
