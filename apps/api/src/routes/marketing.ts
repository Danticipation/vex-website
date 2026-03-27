import { Router } from "express";
import { CampaignSchema } from "@vex/shared";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { MarketingService } from "../lib/marketing.js";
import { enqueueMarketingCampaignRun } from "../lib/queue.js";

export const marketingRouter: Router = Router();
const service = new MarketingService();

marketingRouter.post("/campaigns", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), validateBody(CampaignSchema), async (req, res) => {
  const input = req.body as Parameters<MarketingService["createCampaign"]>[2];
  const sendGuard = await service.canSend(req.tenantId!);
  if (!sendGuard.ok) {
    return res.status(402).json({
      code: "SEND_CAP_REACHED",
      message: `Monthly send cap reached (${sendGuard.monthlyLimit})`,
    });
  }
  const created = await service.createCampaign(req.tenantId!, req.user?.userId, input);
  return res.status(201).json({ data: created, error: null });
});

marketingRouter.post("/campaigns/:id/run", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), async (req, res) => {
  const campaignId = req.params.id;
  await service.queueNightlyRun(req.tenantId!, campaignId);
  await enqueueMarketingCampaignRun({ tenantId: req.tenantId!, campaignId });
  return res.json({ data: { queued: true }, error: null });
});

marketingRouter.post("/campaigns/:id/conversion", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), async (req, res) => {
  const campaignId = req.params.id;
  const variantId = typeof req.body?.variantId === "string" ? req.body.variantId : "unknown";
  const amountUsd = typeof req.body?.amountUsd === "number" ? req.body.amountUsd : 0;
  await service.recordConversion(req.tenantId!, campaignId, variantId, amountUsd);
  return res.status(201).json({ data: { ok: true }, error: null });
});
