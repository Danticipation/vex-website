import type { ApiRole } from "../types/rbac.js";

export const ROLES_KEY = "vex:roles";

export type RolesMetadata = {
  [ROLES_KEY]?: readonly ApiRole[];
};

/**
 * Framework-agnostic roles decorator helper.
 * In Express, handlers can optionally read this metadata via `getRoles`.
 */
export function Roles(...roles: ApiRole[]) {
  return <T extends Function>(target: T): T => {
    Reflect.defineProperty(target, ROLES_KEY, {
      value: roles,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    return target;
  };
}

export function getRoles(target: unknown): readonly ApiRole[] {
  if (!target || (typeof target !== "function" && typeof target !== "object")) return [];
  const value = Reflect.get(target as object, ROLES_KEY);
  return Array.isArray(value) ? (value as readonly ApiRole[]) : [];
}
