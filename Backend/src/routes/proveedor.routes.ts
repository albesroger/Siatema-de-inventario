import { Router } from "express";
import { ProveedorController } from "../controllers/proveedor.controller.js";
import {
  crearProveedorSchema,
  actualizarProveedorSchema,
} from "../schemas/proveedor.schema.js";
import { validate, validarParamId } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

router.param("id", validarParamId());

const controller = new ProveedorController();

router.post(
  "/",
  authenticate,
  authorize("ADMINISTRADOR"),
  validate(crearProveedorSchema),
  controller.crear.bind(controller),
);

router.get("/", authenticate, controller.obtenerTodos.bind(controller));

router.get("/:id", authenticate, controller.obtenerPorId.bind(controller));

router.put(
  "/:id",
  authenticate,
  authorize("ADMINISTRADOR"),
  validate(actualizarProveedorSchema),
  controller.actualizar.bind(controller),
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMINISTRADOR"),
  controller.eliminar.bind(controller),
);

export default router;
