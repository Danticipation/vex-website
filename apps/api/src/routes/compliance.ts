import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { prisma } from "../lib/tenant.js";
import { createQuarterlySoc2Report } from "../lib/compliance.js";

export const complianceRouter: Router = Router();

complianceRouter.get("/export", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), async (req, res) => {
  const rows = await prisma.auditLog.findMany({
    where: { tenantId: req.tenantId! },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return res.json({ data: rows, error: null });
});

complianceRouter.get("/soc2-report", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), async (req, res) => {
  const report = await createQuarterlySoc2Report(req.tenantId!);
  return res.json({ data: report, error: null });
});
