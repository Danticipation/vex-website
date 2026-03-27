import { Prisma } from "@prisma/client";
import { prisma } from "./tenant.js";

export async function createLedgerEntry(input: {
  tenantId: string;
  entityId: string;
  ledgerType: string;
  amountUsd: number;
  currency?: string;
  occurredAt?: Date;
  payload?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      action: "ACCOUNTING_LEDGER_ENTRY_RECORDED",
      entity: "MultiEntityLedger",
      entityId: input.entityId,
      payload: {
        ledgerType: input.ledgerType,
        amountUsd: new Prisma.Decimal(input.amountUsd),
        currency: input.currency ?? "USD",
        occurredAt: (input.occurredAt ?? new Date()).toISOString(),
        payload: input.payload ?? {},
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function getConsolidatedReport(tenantId: string) {
  const rows = await prisma.auditLog.findMany({
    where: {
      tenantId,
      action: "ACCOUNTING_LEDGER_ENTRY_RECORDED",
      entity: "MultiEntityLedger",
    },
    select: {
      payload: true,
    },
  });
  const byKey = new Map<string, number>();
  for (const row of rows) {
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    const ledgerType = typeof payload.ledgerType === "string" ? payload.ledgerType : "unknown";
    const currency = typeof payload.currency === "string" ? payload.currency : "USD";
    const amount = typeof payload.amountUsd === "number" ? payload.amountUsd : Number(payload.amountUsd ?? 0);
    const key = `${ledgerType}:${currency}`;
    byKey.set(key, Number((byKey.get(key) ?? 0) + (Number.isFinite(amount) ? amount : 0)));
  }
  return [...byKey.entries()].map(([key, amountUsd]) => {
    const [ledgerType, currency] = key.split(":");
    return { ledgerType, currency, amountUsd: Number(amountUsd.toFixed(2)) };
  });
}
