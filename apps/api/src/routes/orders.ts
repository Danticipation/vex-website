import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { createOrderSchema, updateOrderSchema } from "@vex/shared";
import * as ordersController from "../controllers/ordersController.js";

export const ordersRouter: Router = Router();

ordersRouter.post("/", requireAuth, validateBody(createOrderSchema), ordersController.create);
ordersRouter.get("/", requireAuth, ordersController.list);
ordersRouter.get("/:id", requireAuth, ordersController.getById);
ordersRouter.patch("/:id", requireAuth, validateBody(updateOrderSchema), ordersController.update);
