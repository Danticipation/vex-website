import { Router } from "express";
import * as webhooksController from "../controllers/webhooksController.js";

export const webhooksRouter: Router = Router();

// Twilio sends application/x-www-form-urlencoded; ensure app has urlencoded middleware for /webhooks
webhooksRouter.post("/sms", webhooksController.sms);
webhooksRouter.post("/email", webhooksController.email);
