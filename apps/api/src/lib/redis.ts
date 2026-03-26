import { Redis } from "ioredis";

let client: Redis | null | undefined;

/**
 * Shared Redis connection for BullMQ, cache-aside, refresh tokens, and JWT denylist.
 * When `REDIS_URL` is unset, returns null — callers must fall back to in-process behavior.
 */
export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (client === undefined) {
    client = new Redis(url, { maxRetriesPerRequest: null });
  }
  return client;
}
