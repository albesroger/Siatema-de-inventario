import { Router } from "express";
import { ProductoController } from "../controllers/producto.controller.js";
import {
  crearProductoSchema,
  actualizarProductoSchema,
} from "../schemas/producto.schema.js";
import { validate, validarParamId } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

router.param("id", validarParamId());
const controller = new ProductoController();

router.post(
  "/",
  authenticate,
  authorize("ADMINISTRADOR"),
  validate(crearProductoSchema),
  controller.crear.bind(controller),
);

router.get("/", authenticate, controller.obtenerTodos.bind(controller));

router.get("/:id", authenticate, controller.obtenerPorId.bind(controller));

router.put(
  "/:id",
  authenticate,
  authorize("ADMINISTRADOR"),
  validate(actualizarProductoSchema),
  controller.actualizar.bind(controller),
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMINISTRADOR"),
  controller.eliminar.bind(controller),
);

export default router;
