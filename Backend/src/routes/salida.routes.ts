import { Router } from "express";

import { SalidaController } from "../controllers/salida.controller.js";
import {
  crearSalidaSchema,
  anularSalidaSchema,
} from "../schemas/salida.schema.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

const controller = new SalidaController();

router.post(
  "/",
  authenticate,
  validate(crearSalidaSchema),
  controller.crear.bind(controller),
);

router.get("/", authenticate, controller.listar.bind(controller));

router.get("/:id", authenticate, controller.obtenerPorId.bind(controller));

router.post(
  "/:id/anular",
  authenticate,
  validate(anularSalidaSchema),
  controller.anular.bind(controller),
);

export default router;
