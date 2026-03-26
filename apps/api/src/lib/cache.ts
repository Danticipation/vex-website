import { getRedis } from "./redis.js";

/**
 * Tenant-scoped cache-aside for JSON payloads (themes, plans, valuation snapshots).
 * Uses Redis when `REDIS_URL` is set; otherwise passes through to `fetcher` (no cross-process cache).
 */
export async function getOrSetTenantJson<T>(
  tenantId: string,
  namespace: string,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const redis = getRedis();
  const ns = `vex:cache:${namespace}:${tenantId}:${key}`;
  if (redis) {
    const hit = await redis.get(ns);
    if (hit) {
      try {
        return JSON.parse(hit) as T;
      } catch {
        // fall through
      }
    }
    const val = await fetcher();
    await redis.set(ns, JSON.stringify(val), "EX", ttlSeconds);
    return val;
  }
  return fetcher();
}

export async function invalidateTenantNamespace(tenantId: string, namespace: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const pattern = `vex:cache:${namespace}:${tenantId}:*`;
  const stream = redis.scanStream({ match: pattern, count: 100 });
  const keys: string[] = [];
  for await (const chunk of stream) {
    keys.push(...chunk);
  }
  if (keys.length) await redis.del(...keys);
}
