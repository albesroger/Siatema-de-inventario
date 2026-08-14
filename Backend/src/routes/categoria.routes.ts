import { Router } from "express";

import { CategoriaController } from "../controllers/categoria.controller.js";

import {
  crearCategoriaSchema,
  actualizarCategoriaSchema,
} from "../schemas/categoria.schema.js";

import { validate } from "../middlewares/validate.js";

const router = Router();

const controller = new CategoriaController();

router.post(
  "/",
  validate(crearCategoriaSchema),
  controller.crear.bind(controller),
);

router.get("/", controller.obtenerTodos.bind(controller));

router.get("/:id", controller.obtenerPorId.bind(controller));

router.put(
  "/:id",
  validate(actualizarCategoriaSchema),
  controller.actualizar.bind(controller),
);

router.delete("/:id", controller.eliminar.bind(controller));

export default router;
