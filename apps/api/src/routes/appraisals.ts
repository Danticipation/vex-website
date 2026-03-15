import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { createAppraisalSchema } from "@vex/shared";
import * as appraisalsController from "../controllers/appraisalsController.js";

export const appraisalsRouter = Router();

appraisalsRouter.post("/", validateBody(createAppraisalSchema), appraisalsController.create);
appraisalsRouter.get("/:id", appraisalsController.getById);
