import { Router } from "express";

import { SalidaController } from "../controllers/salida.controller.js";

import { crearSalidaSchema } from "../schemas/salida.schema.js";

import { validate } from "../middlewares/validate.js";

const router = Router();

const controller = new SalidaController();

router.post(
  "/",
  validate(crearSalidaSchema),
  controller.crear.bind(controller),
);

router.get("/", controller.listar.bind(controller));

router.patch("/:id/anular", controller.anular.bind(controller));

router.get("/:id", controller.obtenerPorId.bind(controller));

export default router;
