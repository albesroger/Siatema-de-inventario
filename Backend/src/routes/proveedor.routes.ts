import { Router } from "express";

import { ProveedorController } from "../controllers/proveedor.controller.js";

import {
  crearProveedorSchema,
  actualizarProveedorSchema,
} from "../schemas/proveedor.schema.js";

import { validate } from "../middlewares/validate.js";

const router = Router();

const controller = new ProveedorController();

router.post(
  "/",
  validate(crearProveedorSchema),
  controller.crear.bind(controller),
);

router.get("/", controller.obtenerTodos.bind(controller));

router.get("/:id", controller.obtenerPorId.bind(controller));

router.put(
  "/:id",
  validate(actualizarProveedorSchema),
  controller.actualizar.bind(controller),
);

router.delete("/:id", controller.eliminar.bind(controller));

export default router;
