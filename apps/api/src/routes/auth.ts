import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "@vex/shared";
import * as authController from "../controllers/authController.js";

export const authRouter: Router = Router();

authRouter.post("/register", validateBody(registerSchema), authController.register);
authRouter.post("/login", validateBody(loginSchema), authController.login);
authRouter.get("/me", requireAuth, authController.me);
