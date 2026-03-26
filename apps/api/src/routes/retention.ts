import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { retentionTriggerSchema, upsellOfferSchema } from "@vex/shared";
import { prisma } from "../lib/tenant.js";

export const retentionRouter: Router = Router();

retentionRouter.post("/trigger", requireAuth, requireRole("STAFF", "ADMIN", "GROUP_ADMIN"), validateBody(retentionTriggerSchema), async (req, res) => {
  const body = req.body as { trigger: string; targetUserId?: string };
  await prisma.auditLog.create({
    data: {
      tenantId: req.tenantId!,
      actorId: req.user?.userId,
      action: "RETENTION_TRIGGER",
      entity: "Retention",
      payload: { ...body, consentOptIn: true },
    },
  });
  await prisma.growthMetric.create({
    data: {
      tenantId: req.tenantId!,
      key: "retention_triggers",
      value: 1,
      meta: { trigger: body.trigger },
    },
  });
  return res.json({ data: { ok: true }, error: null });
});

retentionRouter.post("/upsell-offer", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), validateBody(upsellOfferSchema), async (req, res) => {
  const body = req.body as { offerType: string; discountPct?: number };
  await prisma.auditLog.create({
    data: {
      tenantId: req.tenantId!,
      actorId: req.user?.userId,
      action: "UPSELL_OFFER",
      entity: "Retention",
      payload: body,
    },
  });
  return res.json({ data: { ok: true, offer: body }, error: null });
});
