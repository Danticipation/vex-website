import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateBody } from "../../middleware/validate.js";
import { enqueueFortellisInventorySync, enqueueFortellisAppraisalPush } from "../../lib/queue.js";
import { prisma } from "../../lib/tenant.js";

export const integrationsInventoryRouter: Router = Router();

const inventorySyncSchema = z.object({
  externalId: z.string().min(1).optional(),
  vin: z.string().min(3).optional(),
  payload: z.record(z.unknown()),
});

const appraisalPushSchema = z.object({
  externalId: z.string().min(1),
  payload: z.record(z.unknown()),
});

integrationsInventoryRouter.post(
  "/sync",
  requireAuth,
  requireRole("STAFF", "ADMIN", "GROUP_ADMIN"),
  validateBody(inventorySyncSchema),
  async (req, res) => {
    if (!req.tenantId) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Tenant context missing" });
    }
    const body = req.body as z.infer<typeof inventorySyncSchema>;
    const externalId = body.externalId ?? body.vin ?? `inventory-${Date.now()}`;
    await prisma.integrationLog.create({
      data: {
        tenantId: req.tenantId,
        vendor: "FORTELLIS",
        eventType: "inventory.sync.requested",
        externalId,
        status: "PENDING",
        payload: body.payload as object,
      },
    });
    await enqueueFortellisInventorySync({
      tenantId: req.tenantId,
      externalId: body.externalId,
      vin: body.vin,
      payload: body.payload,
    });
    return res.status(202).json({
      data: {
        queued: true,
        externalId,
      },
      error: null,
    });
  }
);

integrationsInventoryRouter.post(
  "/appraisal-push",
  requireAuth,
  requireRole("STAFF", "ADMIN", "GROUP_ADMIN"),
  validateBody(appraisalPushSchema),
  async (req, res) => {
    if (!req.tenantId) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Tenant context missing" });
    }
    const body = req.body as z.infer<typeof appraisalPushSchema>;
    await prisma.integrationLog.create({
      data: {
        tenantId: req.tenantId,
        vendor: "FORTELLIS",
        eventType: "appraisal.push.requested",
        externalId: body.externalId,
        status: "PENDING",
        payload: body.payload as object,
      },
    });
    await enqueueFortellisAppraisalPush({
      tenantId: req.tenantId,
      externalId: body.externalId,
      payload: body.payload,
    });
    return res.status(202).json({ data: { queued: true, externalId: body.externalId }, error: null });
  }
);
