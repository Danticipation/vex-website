import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateBody } from "../../middleware/validate.js";
import { enqueueDealertrackCreditAppSync, enqueueDealertrackFinanceQuoteSync } from "../../lib/queue.js";
import { prisma } from "../../lib/tenant.js";

export const dealertrackFiRouter: Router = Router();

const creditAppSyncSchema = z.object({
  externalId: z.string().min(1),
  vin: z.string().min(3).optional(),
  payload: z.record(z.unknown()),
});

const financeQuoteSyncSchema = z.object({
  externalId: z.string().min(1),
  payload: z.record(z.unknown()),
});

dealertrackFiRouter.post(
  "/credit-app-sync",
  requireAuth,
  requireRole("STAFF", "ADMIN", "GROUP_ADMIN"),
  validateBody(creditAppSyncSchema),
  async (req, res) => {
    if (!req.tenantId) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Tenant context missing" });
    }
    const body = req.body as z.infer<typeof creditAppSyncSchema>;
    await prisma.integrationLog.create({
      data: {
        tenantId: req.tenantId,
        vendor: "DEALERTRACK",
        eventType: "fi.credit_app_sync.requested",
        externalId: body.externalId,
        status: "PENDING",
        payload: body.payload as object,
      },
    });
    await enqueueDealertrackCreditAppSync({
      tenantId: req.tenantId,
      externalId: body.externalId,
      vin: body.vin,
      payload: body.payload,
    });
    return res.status(202).json({ data: { queued: true, externalId: body.externalId }, error: null });
  }
);

dealertrackFiRouter.post(
  "/finance-quote-sync",
  requireAuth,
  requireRole("STAFF", "ADMIN", "GROUP_ADMIN"),
  validateBody(financeQuoteSyncSchema),
  async (req, res) => {
    if (!req.tenantId) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Tenant context missing" });
    }
    const body = req.body as z.infer<typeof financeQuoteSyncSchema>;
    await prisma.integrationLog.create({
      data: {
        tenantId: req.tenantId,
        vendor: "DEALERTRACK",
        eventType: "fi.finance_quote_sync.requested",
        externalId: body.externalId,
        status: "PENDING",
        payload: body.payload as object,
      },
    });
    await enqueueDealertrackFinanceQuoteSync({
      tenantId: req.tenantId,
      externalId: body.externalId,
      payload: body.payload,
    });
    return res.status(202).json({ data: { queued: true, externalId: body.externalId }, error: null });
  }
);
