import crypto from "node:crypto";
import { getRedis } from "./redis.js";

const REFRESH_PREFIX = "vex:rt:";
const DENY_PREFIX = "vex:jwt:deny:";

type RefreshPayload = {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
};

const memRefresh = new Map<string, { exp: number; payload: RefreshPayload }>();
const memDeny = new Map<string, number>();

function nowMs() {
  return Date.now();
}

export async function denylistJti(jti: string, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(`${DENY_PREFIX}${jti}`, "1", "EX", ttlSeconds);
    return;
  }
  memDeny.set(jti, nowMs() + ttlSeconds * 1000);
}

export async function isJtiDenied(jti: string): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const v = await redis.get(`${DENY_PREFIX}${jti}`);
    return v != null;
  }
  const exp = memDeny.get(jti);
  if (!exp) return false;
  if (exp < nowMs()) {
    memDeny.delete(jti);
    return false;
  }
  return true;
}

export async function storeRefreshToken(token: string, payload: RefreshPayload, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(`${REFRESH_PREFIX}${token}`, JSON.stringify(payload), "EX", ttlSeconds);
    return;
  }
  memRefresh.set(token, { exp: nowMs() + ttlSeconds * 1000, payload });
}

export async function consumeRefreshToken(token: string): Promise<RefreshPayload | null> {
  const redis = getRedis();
  if (redis) {
    const key = `${REFRESH_PREFIX}${token}`;
    const raw = await redis.get(key);
    if (!raw) return null;
    await redis.del(key);
    try {
      return JSON.parse(raw) as RefreshPayload;
    } catch {
      return null;
    }
  }
  const row = memRefresh.get(token);
  if (!row) return null;
  memRefresh.delete(token);
  if (row.exp < nowMs()) return null;
  return row.payload;
}

export function newRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
