import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { systemPrisma } from "./tenant.js";
import { getRedis } from "./redis.js";

type FortellisAccessToken = {
  accessToken: string;
  expiresAtMs: number;
};

type FortellisWebhookEnvelope = {
  tenantId: string;
  externalId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

type FortellisHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const FORTELLIS_TOKEN_CACHE_KEY = "vex:fortellis:oauth:token";
const FORTELLIS_TOKEN_TTL_SEC = 60 * 60;

let cachedToken: FortellisAccessToken | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for Fortellis integration`);
  }
  return value;
}

function normalizeSignature(signature: string): Buffer {
  const trimmed = signature.trim();
  if (trimmed.startsWith("sha256=")) {
    return Buffer.from(trimmed.slice("sha256=".length), "hex");
  }
  if (/^[a-f0-9]+$/i.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }
  return Buffer.from(trimmed, "base64");
}

function safeCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function getFortellisAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs - 30_000 > now) {
    return cachedToken.accessToken;
  }

  const redis = getRedis();
  if (redis) {
    const redisToken = await redis.get(FORTELLIS_TOKEN_CACHE_KEY);
    if (redisToken) {
      cachedToken = {
        accessToken: redisToken,
        expiresAtMs: now + (FORTELLIS_TOKEN_TTL_SEC - 300) * 1000,
      };
      return redisToken;
    }
  }

  const tokenUrl = requiredEnv("FORTELLIS_TOKEN_URL");
  const clientId = requiredEnv("FORTELLIS_CLIENT_ID");
  const clientSecret = requiredEnv("FORTELLIS_CLIENT_SECRET");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  if (process.env.FORTELLIS_SCOPE) body.set("scope", process.env.FORTELLIS_SCOPE);
  if (process.env.FORTELLIS_AUDIENCE) body.set("audience", process.env.FORTELLIS_AUDIENCE);

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Fortellis OAuth failed (${response.status})`);
  }

  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  const accessToken = json.access_token;
  if (!accessToken) throw new Error("Fortellis OAuth response missing access_token");

  const expiresInSec = typeof json.expires_in === "number" ? json.expires_in : 300;
  const ttl = Math.max(60, Math.min(expiresInSec - 300, FORTELLIS_TOKEN_TTL_SEC));
  cachedToken = {
    accessToken,
    expiresAtMs: now + ttl * 1000,
  };
  if (redis) {
    await redis.set(FORTELLIS_TOKEN_CACHE_KEY, accessToken, "EX", ttl);
  }
  return accessToken;
}

export async function fortellisRequest<T = unknown>(
  method: FortellisHttpMethod,
  endpoint: string,
  data?: unknown
): Promise<T> {
  const token = await getFortellisAccessToken();
  const baseUrl =
    process.env.FORTELLIS_API_BASE_URL ??
    (process.env.FORTELLIS_SANDBOX === "true" ? "https://sandbox-api.fortellis.io" : "https://api.fortellis.io");
  const subscriptionId = requiredEnv("FORTELLIS_SUBSCRIPTION_ID");
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const response = await fetch(`${normalizedBase}${normalizedEndpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Fortellis-Subscription-Id": subscriptionId,
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Fortellis request failed (${response.status}) ${text.slice(0, 500)}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function verifyFortellisWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  const secret = process.env.FORTELLIS_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signatureHeader) return false;

  const digest = createHmac("sha256", secret).update(rawBody).digest();
  const provided = normalizeSignature(signatureHeader);
  return safeCompare(digest, provided);
}

/**
 * Stripe-style idempotent consumer wrapper for Fortellis events:
 * 1) rejects duplicate external event ids
 * 2) writes immutable IntegrationLog rows
 * 3) upserts ExternalSync status per tenant+externalId
 */
export async function consumeFortellisWebhookIdempotent(
  envelope: FortellisWebhookEnvelope,
  handler: () => Promise<void>
): Promise<{ duplicate: boolean }> {
  const payloadJson = envelope.payload as Prisma.InputJsonValue;
  const existing = await systemPrisma.integrationLog.findUnique({
    where: {
      tenantId_externalId_eventType: {
        tenantId: envelope.tenantId,
        externalId: envelope.externalId,
        eventType: envelope.eventType,
      },
    },
    select: { id: true },
  });
  if (existing) return { duplicate: true };

  try {
    await handler();

    await systemPrisma.$transaction([
      systemPrisma.integrationLog.create({
        data: {
          tenantId: envelope.tenantId,
          vendor: "FORTELLIS",
          eventType: envelope.eventType,
          externalId: envelope.externalId,
          status: "PROCESSED",
          payload: payloadJson,
          processedAt: new Date(),
        },
      }),
      systemPrisma.externalSync.upsert({
        where: {
          tenantId_externalId_entityType: {
            tenantId: envelope.tenantId,
            externalId: envelope.externalId,
            entityType: envelope.eventType,
          },
        },
        create: {
          tenantId: envelope.tenantId,
          vendor: "FORTELLIS",
          entityType: envelope.eventType,
          externalId: envelope.externalId,
          direction: "INBOUND",
          status: "PROCESSED",
          payload: payloadJson,
          syncedAt: new Date(),
        },
        update: {
          status: "PROCESSED",
          payload: payloadJson,
          syncedAt: new Date(),
        },
      }),
    ]);
    return { duplicate: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { duplicate: true };
    }

    await systemPrisma.integrationLog
      .create({
        data: {
          tenantId: envelope.tenantId,
          vendor: "FORTELLIS",
          eventType: envelope.eventType,
          externalId: envelope.externalId,
          status: "FAILED",
          payload: payloadJson,
          error: error instanceof Error ? error.message : "Unknown Fortellis webhook error",
        },
      })
      .catch(() => {
        // Best-effort failure logging.
      });
    throw error;
  }
}
