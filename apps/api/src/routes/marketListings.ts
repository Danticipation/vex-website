import { Router } from "express";
import * as marketListingsController from "../controllers/marketListingsController.js";

export const marketListingsRouter = Router();

marketListingsRouter.get("/", marketListingsController.list);

