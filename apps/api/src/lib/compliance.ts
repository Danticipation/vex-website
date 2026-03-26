import { prisma } from "./tenant.js";

export async function logComplianceEvent(input: {
  tenantId: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      payload: { before: input.before ?? null, after: input.after ?? null },
    },
  });
}

export async function createQuarterlySoc2Report(tenantId: string) {
  const period = `${new Date().getUTCFullYear()}-Q${Math.floor(new Date().getUTCMonth() / 3) + 1}`;
  const report = await prisma.complianceReport.create({
    data: {
      tenantId,
      period,
      format: "json",
      payload: { generatedAt: new Date().toISOString(), status: "soc2-lite", controls: 12 },
    },
  });
  return report;
}
