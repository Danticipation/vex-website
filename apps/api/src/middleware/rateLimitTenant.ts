import type { Request, Response, NextFunction } from "express";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { getRedis } from "../lib/redis.js";

const points = Number(process.env.RATE_LIMIT_POINTS_PER_TENANT ?? 1000);
const durationSec = Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60);

const redis = getRedis();

const limiter = redis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "vex_rl",
      points,
      duration: durationSec,
    })
  : new RateLimiterMemory({
      points,
      duration: durationSec,
    });

/**
 * Per-tenant / per-IP sliding window (1000 req/min/tenant by default).
 * Runs after `tenantMiddleware` so `req.tenantId` is set when authenticated.
 */
export async function tenantRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.tenantId ? `t:${req.tenantId}` : `ip:${req.ip ?? "unknown"}`;
  try {
    await limiter.consume(key, 1);
    next();
  } catch {
    res.status(429).json({
      code: "RATE_LIMITED",
      message: "Too many requests for this tenant or IP",
    });
  }
}
