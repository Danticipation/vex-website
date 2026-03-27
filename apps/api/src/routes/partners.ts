import { Router } from "express";
import { PartnerSchema, ReferralPayoutSchema } from "@vex/shared";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { PartnersService } from "../lib/partners.js";
import { enqueuePartnerPayout } from "../lib/queue.js";

export const partnersRouter: Router = Router();
const service = new PartnersService();

partnersRouter.post("/onboard", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), validateBody(PartnerSchema), async (req, res) => {
  const partner = await service.onboardPartner(req.tenantId!, req.user?.userId, req.body);
  return res.status(201).json({ data: partner, error: null });
});

partnersRouter.post("/leads", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), async (req, res) => {
  const partnerId = typeof req.body?.partnerId === "string" ? req.body.partnerId : "";
  const idempotencyKey = typeof req.body?.idempotencyKey === "string" ? req.body.idempotencyKey : "";
  if (!partnerId || !idempotencyKey) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: "partnerId and idempotencyKey are required" });
  }
  const result = await service.ingestLead(req.tenantId!, partnerId, idempotencyKey, req.body);
  return res.status(result.accepted ? 201 : 200).json({ data: result, error: null });
});

partnersRouter.post("/payouts", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), validateBody(ReferralPayoutSchema), async (req, res) => {
  const payout = await service.createPayout(req.tenantId!, req.user?.userId, req.body);
  if (payout.status === "queued") {
    await enqueuePartnerPayout({
      tenantId: req.tenantId!,
      idempotencyKey: req.body.idempotencyKey as string,
      payoutUsd: payout.payoutUsd,
    });
  }
  return res.status(201).json({ data: payout, error: null });
});
