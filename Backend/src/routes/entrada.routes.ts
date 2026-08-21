import { Router } from "express";

import { EntradaController } from "../controllers/entrada.controller.js";
import {
  crearEntradaSchema,
  anularEntradaSchema,
} from "../schemas/entrada.schema.js";
import { validate, validarParamId } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.param("id", validarParamId());

const controller = new EntradaController();

router.post(
  "/",
  authenticate,
  validate(crearEntradaSchema),
  controller.crear.bind(controller),
);

router.get("/", authenticate, controller.listar.bind(controller));

router.patch("/:id/anular", authenticate, validate(anularEntradaSchema), controller.anular.bind(controller));

router.get("/:id", authenticate, controller.obtenerPorId.bind(controller));

export default router;
