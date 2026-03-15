import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { shippingQuoteSchema } from "@vex/shared";
import * as shippingController from "../controllers/shippingController.js";

export const shippingRouter = Router();

shippingRouter.post("/quote", validateBody(shippingQuoteSchema), shippingController.quote);
