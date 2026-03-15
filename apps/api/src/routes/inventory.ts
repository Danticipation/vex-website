import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { createInventorySchema, updateInventorySchema } from "@vex/shared";
import * as inventoryController from "../controllers/inventoryController.js";

export const inventoryRouter = Router();

inventoryRouter.get("/", inventoryController.list);
inventoryRouter.get("/:id", inventoryController.getById);
inventoryRouter.post("/", requireAuth, validateBody(createInventorySchema), inventoryController.create);
inventoryRouter.patch("/:id", requireAuth, validateBody(updateInventorySchema), inventoryController.update);
