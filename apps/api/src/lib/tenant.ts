import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma, PrismaClient } from "@prisma/client";
import { getOrSetTenantJson } from "./cache.js";

type TenantContext = { tenantId: string };

const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantId(): string | null {
  return tenantStorage.getStore()?.tenantId ?? null;
}

export function runWithTenant<T>(tenantId: string, fn: () => Promise<T> | T): Promise<T> | T {
  return tenantStorage.run({ tenantId }, fn);
}

function requireTenantOrThrow(): string {
  const tenantId = getTenantId();
  if (!tenantId) {
    throw new Error("Tenant context missing — ensure tenant middleware runs before routes");
  }
  return tenantId;
}

function mergeWhere(where: unknown, tenantId: string): unknown {
  if (!where || typeof where !== "object") return { tenantId };
  return { AND: [where, { tenantId }] };
}

function forceTenantData(data: unknown, tenantId: string): unknown {
  if (!data || typeof data !== "object") return { tenantId };
  return { ...(data as Record<string, unknown>), tenantId };
}

function forceTenantCreateManyData(data: unknown, tenantId: string): unknown {
  if (Array.isArray(data)) return data.map((d) => forceTenantData(d, tenantId));
  return forceTenantData(data, tenantId);
}

/** Raw Prisma client (no tenant `$use` scoping). Use only for explicit system paths (e.g. auth bootstrap, queue workers wrapping `runWithTenant`). */
export const basePrisma = new PrismaClient();

/**
 * Prisma middleware that enforces tenant scoping by default.
 *
 * IMPORTANT:
 * - Safe, type-preserving actions are auto-scoped.
 * - Unsafe unique actions (findUnique/update/delete/upsert) are intentionally blocked to prevent cross-tenant leaks.
 *   Use findFirst/updateMany/deleteMany with natural keys, or introduce explicit scoped helpers.
 */
basePrisma.$use(async (params, next) => {
  if (params.model === "Tenant") return next(params);

  const tenantId = requireTenantOrThrow();
  const action = params.action;

  // Safe reads
  if (action === "findMany" || action === "findFirst" || action === "findFirstOrThrow") {
    const merged = mergeWhere(params.args?.where, tenantId);
    params.args = { ...params.args, where: merged };
    return next(params);
  }

  if (action === "count" || action === "aggregate" || action === "groupBy") {
    params.args = { ...params.args, where: mergeWhere(params.args?.where, tenantId) };
    return next(params);
  }

  // Safe writes
  if (action === "create") {
    params.args = { ...params.args, data: forceTenantData(params.args?.data, tenantId) };
    return next(params);
  }

  if (action === "createMany") {
    params.args = { ...params.args, data: forceTenantCreateManyData(params.args?.data, tenantId) };
    return next(params);
  }

  if (action === "updateMany" || action === "deleteMany") {
    params.args = { ...params.args, where: mergeWhere(params.args?.where, tenantId) };
    if (action === "updateMany") {
      params.args = { ...params.args, data: params.args?.data };
    }
    return next(params);
  }

  // Block unsafe unique operations until explicit, audited helpers exist.
  if (
    action === "findUnique" ||
    action === "findUniqueOrThrow" ||
    action === "update" ||
    action === "delete" ||
    action === "upsert"
  ) {
    throw new Error(`Unsafe Prisma action for multi-tenant mode: ${params.model}.${action}. Use scoped patterns (findFirst/updateMany/deleteMany).`);
  }

  return next(params);
});

export const prisma = basePrisma;

/**
 * Rare admin override: returns a client that is scoped to a specific tenantId via AsyncLocalStorage.
 */
export function withTenantScope<T>(tenantId: string, fn: (scoped: PrismaClient) => Promise<T> | T): Promise<T> | T {
  return runWithTenant(tenantId, () => fn(prisma));
}

/**
 * Convenience for places that need a scoped client instance (keeps callsites tidy).
 */
export function scopedPrisma(tenantId: string): PrismaClient {
  return prisma.$extends({
    name: "tenantScopeClient",
    client: {
      $withTenant<T>(fn: (p: PrismaClient) => Promise<T> | T) {
        return withTenantScope(tenantId, fn);
      },
    },
  }) as unknown as PrismaClient;
}

/** Normalize Host header / forwarded host for custom domain lookup (no port). */
export function normalizeHost(host: string): string {
  const h = host.trim().toLowerCase();
  const noPort = h.includes(":") ? h.split(":")[0]! : h;
  return noPort;
}

export async function findTenantByCustomDomain(host: string): Promise<{
  id: string;
  name: string;
  customDomain: string | null;
  themeJson: Record<string, unknown> | null;
} | null> {
  const key = normalizeHost(host);
  if (!key) return null;
  const tenant = await basePrisma.tenant.findFirst({
    where: { customDomain: key },
    select: { id: true, name: true, customDomain: true, themeJson: true },
  });
  if (!tenant) return null;
  return {
    id: tenant.id,
    name: tenant.name,
    customDomain: tenant.customDomain,
    themeJson: (tenant.themeJson as Record<string, unknown> | null) ?? null,
  };
}

export type TenantBranding = {
  billingTier: string;
  customDomain: string | null;
  themeJson: Record<string, unknown> | null;
};

export async function getTenantBranding(tenantId: string): Promise<TenantBranding | null> {
  return getOrSetTenantJson(tenantId, "branding", "main", 300, async () =>
    withTenantScope(tenantId, async (p) => {
      const tenant = await p.tenant.findFirst({
        where: { id: tenantId },
        select: { billingTier: true, customDomain: true, themeJson: true },
      });
      if (!tenant) return null;
      return {
        billingTier: tenant.billingTier,
        customDomain: tenant.customDomain,
        themeJson: (tenant.themeJson as Record<string, unknown> | null) ?? null,
      };
    })
  );
}

