import { Router } from "express";
import { CategoriaController } from "../controllers/categoria.controller.js";
import {
  crearCategoriaSchema,
  actualizarCategoriaSchema,
} from "../schemas/categoria.schema.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

const controller = new CategoriaController();

router.post(
  "/",
  authenticate,
  validate(crearCategoriaSchema),
  controller.crear.bind(controller),
);

router.get("/", authenticate, controller.obtenerTodos.bind(controller));

router.get("/:id", authenticate, controller.obtenerPorId.bind(controller));

router.put(
  "/:id",
  authenticate,
  validate(actualizarCategoriaSchema),
  controller.actualizar.bind(controller),
);

router.delete("/:id", authenticate, controller.eliminar.bind(controller));

export default router;
