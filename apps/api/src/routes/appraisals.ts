import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { createAppraisalSchema, updateAppraisalSchema, ValuationInputSchema } from "@vex/shared";
import * as appraisalsController from "../controllers/appraisalsController.js";

export const appraisalsRouter: Router = Router();

appraisalsRouter.get("/", requireAuth, requireRole("STAFF", "ADMIN"), appraisalsController.list);
appraisalsRouter.post(
  "/",
  requireAuth,
  requireRole("STAFF", "ADMIN"),
  validateBody(createAppraisalSchema),
  appraisalsController.create
);
appraisalsRouter.post(
  "/valuate",
  requireAuth,
  requireRole("STAFF", "ADMIN"),
  validateBody(ValuationInputSchema),
  appraisalsController.valuate
);

appraisalsRouter.put(
  "/:id",
  requireAuth,
  requireRole("STAFF", "ADMIN"),
  validateBody(updateAppraisalSchema),
  appraisalsController.update
);
appraisalsRouter.delete("/:id", requireAuth, requireRole("STAFF", "ADMIN"), appraisalsController.remove);
appraisalsRouter.get("/:id", requireAuth, requireRole("STAFF", "ADMIN"), appraisalsController.getById);
