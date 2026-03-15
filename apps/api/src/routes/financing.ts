import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { financingCalculateSchema } from "@vex/shared";
import * as financingController from "../controllers/financingController.js";

export const financingRouter = Router();

financingRouter.post("/calculate", validateBody(financingCalculateSchema), financingController.calculate);
