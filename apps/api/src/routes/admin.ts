import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import * as adminController from "../controllers/adminController.js";

export const adminRouter: Router = Router();

adminRouter.get("/overview", requireAuth, requireRole("ADMIN"), adminController.overview);
