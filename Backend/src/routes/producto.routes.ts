import { Router } from "express";
import { ProductoController } from "../controllers/producto.controller.js";
import {
  crearProductoSchema,
  actualizarProductoSchema,
} from "../schemas/producto.schema.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
const controller = new ProductoController();

router.post(
  "/",
  authenticate,
  validate(crearProductoSchema),
  controller.crear.bind(controller),
);

router.get("/", authenticate, controller.obtenerTodos.bind(controller));

router.get("/:id", authenticate, controller.obtenerPorId.bind(controller));

router.put(
  "/:id",
  authenticate,
  validate(actualizarProductoSchema),
  controller.actualizar.bind(controller),
);

router.delete("/:id", authenticate, controller.eliminar.bind(controller));

export default router;
