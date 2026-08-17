import { Router } from "express";
import { DispositivoController } from "../controllers/dispositivo.controller.js";
import {
  crearDispositivoSchema,
  actualizarDispositivoSchema,
} from "../schemas/dispositivo.schema.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

const controller = new DispositivoController();

router.post(
  "/",
  authenticate,
  validate(crearDispositivoSchema),
  controller.crear.bind(controller),
);

router.get("/", authenticate, controller.obtenerTodos.bind(controller));

router.get("/:id", authenticate, controller.obtenerPorId.bind(controller));

router.put(
  "/:id",
  authenticate,
  validate(actualizarDispositivoSchema),
  controller.actualizar.bind(controller),
);

router.delete("/:id", authenticate, controller.eliminar.bind(controller));

export default router;
