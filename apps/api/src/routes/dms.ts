import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { dmsSyncInputSchema } from "@vex/shared";
import { DMSService } from "../lib/dms.js";

const service = new DMSService();
export const dmsRouter: Router = Router();

dmsRouter.post("/sync", requireAuth, requireRole("STAFF", "ADMIN", "GROUP_ADMIN"), validateBody(dmsSyncInputSchema), async (req, res) => {
  const body = req.body as { vendor: "vauto" | "dealertrack" | "cdk" | "cargurus"; mode?: "full" | "delta" };
  const out = await service.sync({
    tenantId: req.tenantId!,
    vendor: body.vendor,
    mode: body.mode ?? "delta",
  });
  return res.json({ data: out, error: null });
});
