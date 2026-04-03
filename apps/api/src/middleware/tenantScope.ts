import type { NextFunction, Request, Response } from "express";
import { getTenantId, runWithTenant } from "../lib/tenant.js";

/**
 * Canonical tenant context helpers for route/middleware code.
 * AsyncLocalStorage is always entered through these APIs.
 */
export function currentTenantId(): string | null {
  return getTenantId();
}

export function withTenantScope<T>(tenantId: string, fn: () => Promise<T> | T): Promise<T> | T {
  return runWithTenant(tenantId, fn);
}

/**
 * Attach tenant ALS context for downstream handlers.
 * Uses `req.tenantId` (resolved by tenant middleware) and falls back to JWT payload
 * for authenticated routes where middleware composition is custom.
 */
export function withTenantRequestContext(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.tenantId ?? req.user?.tenantId;
  if (!tenantId) {
    res.status(500).json({ code: "TENANT_SCOPE_ERROR", message: "Missing tenant context" });
    return;
  }
  void Promise.resolve(withTenantScope(tenantId, () => next())).catch(next);
}
