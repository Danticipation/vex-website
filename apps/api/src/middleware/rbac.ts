import type { RequestHandler } from "express";
import {
  AUTHENTICATED_ROLES,
  requireAnyAuthenticatedRole,
  requireRole,
  requireStaffOrAbove,
  type ApiRole,
} from "./requireRole.js";

/**
 * RBAC shim used for route hardening passes.
 * Keeps legacy middleware names while centralizing role intent.
 */
export const RBAC_AUTHENTICATED_ROLES: readonly ApiRole[] = AUTHENTICATED_ROLES;

export function rbacGuard(...roles: ApiRole[]): RequestHandler {
  return requireRole(...roles);
}

export function rbacAnyAuthenticated(): RequestHandler {
  return requireAnyAuthenticatedRole();
}

export function rbacStaffOrAbove(): RequestHandler {
  return requireStaffOrAbove();
}
