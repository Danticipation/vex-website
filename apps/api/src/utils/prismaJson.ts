import { Prisma } from "@prisma/client";

/** Prisma Json fields reject `null` in some versions — use `undefined` to omit. */
export function optionalJson(v: unknown): Prisma.InputJsonValue | undefined {
  if (v === undefined || v === null) return undefined;
  return v as Prisma.InputJsonValue;
}
