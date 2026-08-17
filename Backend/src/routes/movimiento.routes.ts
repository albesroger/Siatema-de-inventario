import { Router } from "express";

import { MovimientoController } from "../controllers/movimiento.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

const controller = new MovimientoController();

router.use(authenticate);

router.get("/", controller.listar.bind(controller));

export default router;
