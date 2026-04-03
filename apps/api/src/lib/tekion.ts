import { createHmac, timingSafeEqual } from "node:crypto";
import { getRedis } from "./redis.js";

type TekionAccessToken = {
  accessToken: string;
  expiresAtMs: number;
};

type TekionHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const TEKION_TOKEN_CACHE_KEY = "vex:tekion:oauth:token";
const TEKION_TOKEN_TTL_SEC = 60 * 60;

let cachedToken: TekionAccessToken | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for Tekion integration`);
  return value;
}

export async function getTekionToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs - 30_000 > now) return cachedToken.accessToken;

  const redis = getRedis();
  if (redis) {
    const redisToken = await redis.get(TEKION_TOKEN_CACHE_KEY);
    if (redisToken) {
      cachedToken = {
        accessToken: redisToken,
        expiresAtMs: now + (TEKION_TOKEN_TTL_SEC - 300) * 1000,
      };
      return redisToken;
    }
  }

  const tokenUrl = process.env.TEKION_TOKEN_URL ?? "https://auth.tekioncloud.com/oauth2/token";
  const clientId = requiredEnv("TEKION_CLIENT_ID");
  const clientSecret = requiredEnv("TEKION_CLIENT_SECRET");

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
  if (!response.ok) throw new Error(`Tekion OAuth failed (${response.status})`);

  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Tekion OAuth response missing access_token");

  const expiresInSec = typeof json.expires_in === "number" ? json.expires_in : 300;
  const ttl = Math.max(60, Math.min(expiresInSec - 300, TEKION_TOKEN_TTL_SEC));
  cachedToken = {
    accessToken: json.access_token,
    expiresAtMs: now + ttl * 1000,
  };
  if (redis) await redis.set(TEKION_TOKEN_CACHE_KEY, json.access_token, "EX", ttl);
  return json.access_token;
}

export async function tekionRequest<T = unknown>(
  method: TekionHttpMethod,
  endpoint: string,
  data?: unknown
): Promise<T> {
  const token = await getTekionToken();
  const baseUrl =
    process.env.TEKION_API_BASE_URL ??
    (process.env.TEKION_SANDBOX === "true" ? "https://sandbox.apc.tekioncloud.com" : "https://api.apc.tekioncloud.com");
  const subscriptionId = requiredEnv("TEKION_SUBSCRIPTION_ID");
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const response = await fetch(`${normalizedBase}${normalizedEndpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Tekion-Subscription-Id": subscriptionId,
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Tekion request failed (${response.status}) ${text.slice(0, 500)}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function verifyTekionWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  const secret = process.env.TEKION_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.trim().replace(/^sha256=/, "");
  const a = Buffer.from(digest, "hex");
  const b = Buffer.from(provided, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
