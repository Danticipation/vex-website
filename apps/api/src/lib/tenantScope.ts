import type { NextFunction, Request, Response } from "express";
import { getTenantId, runWithTenant } from "./tenant.js";

/**
 * Canonical tenant context helpers for route/middleware code.
 * Keep AsyncLocalStorage entry/exit in one place so audit work
 * can target this file directly.
 */
export function currentTenantId(): string | null {
  return getTenantId();
}

export function withTenantScope<T>(tenantId: string, fn: () => Promise<T> | T): Promise<T> | T {
  return runWithTenant(tenantId, fn);
}

/**
 * Express helper: attach tenant scope around downstream middleware chain.
 */
export function withTenantRequestContext(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(500).json({ code: "TENANT_SCOPE_ERROR", message: "Missing tenant context" });
    return;
  }
  void Promise.resolve(withTenantScope(tenantId, () => next())).catch(next);
}
