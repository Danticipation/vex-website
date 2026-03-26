import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { quickAppraisalSchema } from "@vex/shared";
import * as publicBrandingController from "../controllers/publicBrandingController.js";
import * as publicAppraisalController from "../controllers/publicAppraisalController.js";

export const publicRouter: Router = Router();

publicRouter.get("/branding", publicBrandingController.getPublicBranding);
publicRouter.post(
  "/quick-appraisal",
  validateBody(quickAppraisalSchema),
  publicAppraisalController.postQuickAppraisal
);
publicRouter.get("/quick-appraisal/:id", publicAppraisalController.getQuickAppraisal);
