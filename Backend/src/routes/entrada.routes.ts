import { Router } from "express";

import { EntradaController } from "../controllers/entrada.controller.js";

import { crearEntradaSchema } from "../schemas/entrada.schema.js";

import { validate } from "../middlewares/validate.js";

const router = Router();

const controller = new EntradaController();

router.post(
  "/",
  validate(crearEntradaSchema),
  controller.crear.bind(controller),
);

router.get("/", controller.listar.bind(controller));

router.patch("/:id/anular", controller.anular.bind(controller));

router.get("/:id", controller.obtenerPorId.bind(controller));

export default router;
