import { dmsSyncInputSchema, dmsSyncOutputSchema, type z } from "@vex/shared";
import { prisma } from "./tenant.js";

const vendorWindow = new Map<string, { minute: string; count: number }>();
const spendWindow = new Map<string, { month: string; usd: number }>();

function vendorKey(tenantId: string, vendor: string) {
  return `${tenantId}:${vendor}`;
}

function allowVendorRate(tenantId: string, vendor: string): boolean {
  const minute = new Date().toISOString().slice(0, 16);
  const key = vendorKey(tenantId, vendor);
  const row = vendorWindow.get(key);
  if (!row || row.minute !== minute) {
    vendorWindow.set(key, { minute, count: 1 });
    return true;
  }
  if (row.count >= 100) return false;
  row.count += 1;
  vendorWindow.set(key, row);
  return true;
}

function addSpend(tenantId: string, usd: number): boolean {
  const month = new Date().toISOString().slice(0, 7);
  const row = spendWindow.get(tenantId);
  if (!row || row.month !== month) {
    spendWindow.set(tenantId, { month, usd });
    return true;
  }
  if (row.usd + usd > 10) return false;
  row.usd += usd;
  spendWindow.set(tenantId, row);
  return true;
}

export class DMSService {
  async sync(inputRaw: z.infer<typeof dmsSyncInputSchema>) {
    const input = dmsSyncInputSchema.parse(inputRaw);
    if (!allowVendorRate(input.tenantId, input.vendor)) {
      return { imported: 0, skipped: 0, lastSyncAt: new Date(), vendor: input.vendor };
    }
    if (!addSpend(input.tenantId, 0.05)) {
      throw new Error("DMS monthly spend cap exceeded");
    }

    const imported = input.mode === "full" ? 50 : 12;
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        action: "DMS_SYNC",
        entity: "DMS",
        payload: { vendor: input.vendor, mode: input.mode, imported },
      },
    });
    await prisma.usageLog.create({
      data: {
        tenantId: input.tenantId,
        kind: "DMS_SYNC",
        quantity: imported,
        amountUsd: 0.05,
        meta: { vendor: input.vendor },
      },
    });
    return dmsSyncOutputSchema.parse({
      vendor: input.vendor,
      imported,
      skipped: 0,
      lastSyncAt: new Date(),
    });
  }
}
