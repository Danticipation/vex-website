import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const workspaceRoot = path.resolve(apiRoot, "..", "..");

let loaded = false;

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  CORS_ORIGIN: z.string().optional(),
  FORTELLIS_CLIENT_ID: z.string().min(1).optional(),
  FORTELLIS_CLIENT_SECRET: z.string().min(1).optional(),
  FORTELLIS_SUBSCRIPTION_ID: z.string().min(1).optional(),
  FORTELLIS_TOKEN_URL: z.string().min(1).optional(),
  FORTELLIS_API_BASE_URL: z.string().min(1).optional(),
  FORTELLIS_WEBHOOK_SECRET: z.string().min(1).optional(),
  FORTELLIS_SANDBOX: z.string().optional(),
  TEKION_CLIENT_ID: z.string().min(1).optional(),
  TEKION_CLIENT_SECRET: z.string().min(1).optional(),
  TEKION_SUBSCRIPTION_ID: z.string().min(1).optional(),
  TEKION_TOKEN_URL: z.string().min(1).optional(),
  TEKION_API_BASE_URL: z.string().min(1).optional(),
  TEKION_WEBHOOK_SECRET: z.string().min(1).optional(),
  TEKION_SANDBOX: z.string().optional(),
  REYNOLDS_CLIENT_ID: z.string().min(1).optional(),
  REYNOLDS_CLIENT_SECRET: z.string().min(1).optional(),
  REYNOLDS_SUBSCRIPTION_ID: z.string().min(1).optional(),
  REYNOLDS_TOKEN_URL: z.string().min(1).optional(),
  REYNOLDS_API_BASE_URL: z.string().min(1).optional(),
  REYNOLDS_WEBHOOK_SECRET: z.string().min(1).optional(),
  REYNOLDS_SANDBOX: z.string().optional(),
  DEALERTRACK_CLIENT_ID: z.string().min(1).optional(),
  DEALERTRACK_CLIENT_SECRET: z.string().min(1).optional(),
  DEALERTRACK_SUBSCRIPTION_ID: z.string().min(1).optional(),
  DEALERTRACK_TOKEN_URL: z.string().min(1).optional(),
  DEALERTRACK_API_BASE_URL: z.string().min(1).optional(),
  DEALERTRACK_WEBHOOK_SECRET: z.string().min(1).optional(),
  DEALERTRACK_SANDBOX: z.string().optional(),
  CDK_SANDBOX: z.string().optional(),
});

function candidateEnvPaths(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, ".env.local"),
    path.join(cwd, ".env"),
    path.join(cwd, "apps", "api", ".env.local"),
    path.join(cwd, "apps", "api", ".env"),
    path.join(apiRoot, ".env.local"),
    path.join(apiRoot, ".env"),
    path.join(workspaceRoot, ".env.local"),
    path.join(workspaceRoot, ".env"),
  ];
}

export function loadApiEnv(): void {
  if (loaded) return;
  for (const envPath of candidateEnvPaths()) {
    dotenv.config({ path: envPath, override: false });
  }
  loaded = true;
}

export function getApiEnv() {
  loadApiEnv();
  return envSchema.parse(process.env);
}

export function requireEnv(keys: string[], context: string): void {
  const env = getApiEnv();
  const missing = keys.filter((k) => {
    const value = (env as Record<string, string | undefined>)[k];
    return !value || !String(value).trim();
  });

  if (missing.length > 0) {
    const from = path.join("apps", "api", ".env.example");
    throw new Error(
      `${context}: missing required env vars [${missing.join(", ")}]. ` +
        `Create apps/api/.env.local (copy from ${from}) or export vars before running.`
    );
  }
}

