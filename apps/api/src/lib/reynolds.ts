import { createHmac, timingSafeEqual } from "node:crypto";
import { getRedis } from "./redis.js";

type ReynoldsAccessToken = {
  accessToken: string;
  expiresAtMs: number;
};

type ReynoldsHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const REYNOLDS_TOKEN_CACHE_KEY = "vex:reynolds:oauth:token";
const REYNOLDS_TOKEN_TTL_SEC = 60 * 60;

let cachedToken: ReynoldsAccessToken | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for Reynolds integration`);
  return value;
}

export async function getReynoldsToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs - 30_000 > now) return cachedToken.accessToken;

  const redis = getRedis();
  if (redis) {
    const redisToken = await redis.get(REYNOLDS_TOKEN_CACHE_KEY);
    if (redisToken) {
      cachedToken = {
        accessToken: redisToken,
        expiresAtMs: now + (REYNOLDS_TOKEN_TTL_SEC - 300) * 1000,
      };
      return redisToken;
    }
  }

  const tokenUrl = process.env.REYNOLDS_TOKEN_URL ?? "https://auth.reynolds.com/oauth2/token";
  const clientId = requiredEnv("REYNOLDS_CLIENT_ID");
  const clientSecret = requiredEnv("REYNOLDS_CLIENT_SECRET");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`Reynolds OAuth failed (${response.status})`);

  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Reynolds OAuth response missing access_token");

  const expiresInSec = typeof json.expires_in === "number" ? json.expires_in : 300;
  const ttl = Math.max(60, Math.min(expiresInSec - 300, REYNOLDS_TOKEN_TTL_SEC));
  cachedToken = {
    accessToken: json.access_token,
    expiresAtMs: now + ttl * 1000,
  };
  if (redis) await redis.set(REYNOLDS_TOKEN_CACHE_KEY, json.access_token, "EX", ttl);
  return json.access_token;
}

export async function reynoldsRequest<T = unknown>(
  method: ReynoldsHttpMethod,
  endpoint: string,
  data?: unknown
): Promise<T> {
  const token = await getReynoldsToken();
  const baseUrl =
    process.env.REYNOLDS_API_BASE_URL ??
    (process.env.REYNOLDS_SANDBOX === "true" ? "https://sandbox.api.reynolds.com" : "https://api.reynolds.com");
  const subscriptionId = requiredEnv("REYNOLDS_SUBSCRIPTION_ID");
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const response = await fetch(`${normalizedBase}${normalizedEndpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Reynolds-Subscription-Id": subscriptionId,
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Reynolds request failed (${response.status}) ${text.slice(0, 500)}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function verifyReynoldsWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  const secret = process.env.REYNOLDS_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.trim().replace(/^sha256=/, "");
  const a = Buffer.from(digest, "hex");
  const b = Buffer.from(provided, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
