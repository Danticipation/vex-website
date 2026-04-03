import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAnyAuthenticatedRole, requireStaffOrAbove } from "../middleware/requireRole.js";
import {
  createInventorySchema,
  inventorySyndicationRequestSchema,
  updateInventorySchema,
} from "@vex/shared";
import * as inventoryController from "../controllers/inventoryController.js";

export const inventoryRouter: Router = Router();

inventoryRouter.get("/", requireAnyAuthenticatedRole(), inventoryController.list);
inventoryRouter.get("/:id", requireAnyAuthenticatedRole(), inventoryController.getById);
inventoryRouter.post("/", requireAuth, requireStaffOrAbove(), validateBody(createInventorySchema), inventoryController.create);
inventoryRouter.patch("/:id", requireAuth, requireStaffOrAbove(), validateBody(updateInventorySchema), inventoryController.update);
inventoryRouter.put("/:id", requireAuth, requireStaffOrAbove(), validateBody(updateInventorySchema), inventoryController.update);
inventoryRouter.delete("/:id", requireAuth, requireStaffOrAbove(), inventoryController.remove);
inventoryRouter.post(
  "/:id/syndication/request",
  requireAuth,
  requireStaffOrAbove(),
  validateBody(inventorySyndicationRequestSchema),
  inventoryController.requestSyndication
);
