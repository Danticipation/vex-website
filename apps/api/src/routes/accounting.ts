import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { createLedgerEntry, getConsolidatedReport } from "../lib/accounting.js";

export const accountingRouter: Router = Router();

accountingRouter.post("/ledger", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), async (req, res) => {
  const body = req.body as {
    entityId: string;
    ledgerType: string;
    amountUsd: number;
    currency?: string;
    payload?: Record<string, unknown>;
  };
  const row = await createLedgerEntry({
    tenantId: req.tenantId!,
    entityId: body.entityId,
    ledgerType: body.ledgerType,
    amountUsd: body.amountUsd,
    currency: body.currency,
    payload: body.payload,
  });
  return res.status(201).json({ data: { id: row.id }, error: null });
});

accountingRouter.get("/consolidated", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), async (req, res) => {
  const report = await getConsolidatedReport(req.tenantId!);
  return res.json({ data: { report, generatedAt: new Date().toISOString() }, error: null });
});
