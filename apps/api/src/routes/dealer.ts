import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import * as appraisalsController from "../controllers/appraisalsController.js";

export const dealerRouter: Router = Router();

const dealDeskUpdateSchema = z.object({
  status: z.enum(["OPEN", "ACCEPTED", "REJECTED", "NEGOTIATING", "CLOSED"]),
  note: z.string().max(2000).optional(),
});
const addToInventorySchema = z.object({
  listPrice: z.number().positive().optional(),
  location: z.string().max(200).optional(),
});

dealerRouter.get("/appraisals", requireAuth, requireRole("STAFF", "ADMIN", "GROUP_ADMIN"), appraisalsController.list);
dealerRouter.get(
  "/appraisals/:id",
  requireAuth,
  requireRole("STAFF", "ADMIN", "GROUP_ADMIN"),
  appraisalsController.getById
);
dealerRouter.post(
  "/appraisals/:id/status",
  requireAuth,
  requireRole("STAFF", "ADMIN", "GROUP_ADMIN"),
  validateBody(dealDeskUpdateSchema),
  appraisalsController.openDealDesk
);
dealerRouter.post(
  "/appraisals/:id/add-to-inventory",
  requireAuth,
  requireRole("STAFF", "ADMIN", "GROUP_ADMIN"),
  validateBody(addToInventorySchema),
  appraisalsController.addToInventoryFromAppraisal
);

