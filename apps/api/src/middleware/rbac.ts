import type { RequestHandler } from "express";
import { AUTHENTICATED_ROLES, Role, type ApiRole } from "@vex/shared";
import { requireAnyAuthenticatedRole, requireRole, requireStaffOrAbove } from "./requireRole.js";

/**
 * RBAC shim used for route hardening passes.
 * Keeps legacy middleware names while centralizing role intent.
 */
export const RBAC_AUTHENTICATED_ROLES: readonly ApiRole[] = AUTHENTICATED_ROLES;

/**
 * Explicit tenant-scoped RBAC guard for route hardening.
 * Enforces tenant match before role check when `:tenantId` is present.
 */
export function rbacGuard(...roles: ApiRole[]): RequestHandler {
  return requireRole(...roles);
}

export function rbacAnyAuthenticated(): RequestHandler {
  return requireAnyAuthenticatedRole();
}

export function rbacStaffOrAbove(): RequestHandler {
  return requireStaffOrAbove();
}

export function rbacAdminOnly(): RequestHandler {
  return rbacGuard(Role.ADMIN, "GROUP_ADMIN");
}
