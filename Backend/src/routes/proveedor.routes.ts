import { Router } from "express";
import { ProveedorController } from "../controllers/proveedor.controller.js";
import {
  crearProveedorSchema,
  actualizarProveedorSchema,
} from "../schemas/proveedor.schema.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

const controller = new ProveedorController();

router.post(
  "/",
  authenticate,
  validate(crearProveedorSchema),
  controller.crear.bind(controller),
);

router.get("/", authenticate, controller.obtenerTodos.bind(controller));

router.get("/:id", authenticate, controller.obtenerPorId.bind(controller));

router.put(
  "/:id",
  authenticate,
  validate(actualizarProveedorSchema),
  controller.actualizar.bind(controller),
);

router.delete("/:id", authenticate, controller.eliminar.bind(controller));

export default router;
