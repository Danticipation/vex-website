import { Router } from "express";
import * as vehiclesController from "../controllers/vehiclesController.js";

export const vehiclesRouter: Router = Router();

vehiclesRouter.get("/", vehiclesController.list);
vehiclesRouter.get("/:id/options", vehiclesController.getOptions);
