import { Router } from "express";

import { DashboardController } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

const controller = new DashboardController();

router.use(authenticate);

router.get("/", controller.obtenerEstadisticas.bind(controller));

export default router;
