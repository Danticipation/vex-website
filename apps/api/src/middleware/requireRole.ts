import { Request, Response, NextFunction } from "express";
import { AUTHENTICATED_ROLES, Role, type ApiRole } from "@vex/shared";

function resolveRouteTenantId(req: Request): string | null {
  const fromParams = req.params?.tenantId;
  if (typeof fromParams === "string" && fromParams.trim().length > 0) return fromParams.trim();
  return null;
}

function enforceTenantFirstScope(req: Request, res: Response): boolean {
  const routeTenantId = resolveRouteTenantId(req);
  if (!routeTenantId) return true;

  const activeTenantId = req.tenantId ?? req.user?.tenantId ?? null;
  if (!activeTenantId) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Missing tenant context" });
    return false;
  }

  if (routeTenantId !== activeTenantId) {
    res.status(403).json({ code: "FORBIDDEN", message: "Tenant scope mismatch" });
    return false;
  }
  return true;
}

export function requireRole(...roles: ApiRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });
    if (!enforceTenantFirstScope(req, res)) return;
    if (!roles.includes(user.role as ApiRole)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Insufficient role" });
    }
    next();
  };
}

/** Shorthand: any logged-in user with a valid role (same as spreading AUTHENTICATED_ROLES). */
export function requireAnyAuthenticatedRole() {
  return requireRole(...AUTHENTICATED_ROLES);
}

export function requireStaffOrAbove() {
  return requireRole(Role.STAFF, Role.ADMIN, "GROUP_ADMIN");
}
