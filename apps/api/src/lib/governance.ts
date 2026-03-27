import { BoardPackSchema, EquityGrantSchema } from "@vex/shared";
import { prisma } from "./tenant.js";

export async function generateBoardPack(tenantId: string) {
  const usage = await prisma.usageLog.aggregate({ where: { tenantId }, _sum: { amountUsd: true } });
  return BoardPackSchema.parse({
    generatedAt: new Date().toISOString(),
    quarter: `Q${Math.floor(new Date().getMonth() / 3) + 1}-${new Date().getFullYear()}`,
    mrr: Number(usage._sum.amountUsd ?? 0),
    burnUsd: 12000,
    keyRisks: ["Regional expansion complexity", "Partner payout margin controls"],
  });
}

export async function createEquityGrant(tenantId: string, payload: unknown) {
  const parsed = EquityGrantSchema.parse(payload);
  await prisma.auditLog.create({
    data: {
      tenantId,
      action: "EQUITY_GRANT_CREATED",
      entity: "EquityGrant",
      entityId: parsed.employeeId,
      payload: parsed,
    },
  });
  return parsed;
}
