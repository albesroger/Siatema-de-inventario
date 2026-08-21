import { Router } from "express";
import ventaController from "../controllers/venta.controller.js";
import { validate, validarParamId } from "../middlewares/validate.js";
import {
  crearVentaSchema,
  anularVentaSchema,
} from "../schemas/venta.schema.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.param("id", validarParamId());
router.use(authenticate);

router.post("/", validate(crearVentaSchema), ventaController.crear);

router.get("/", ventaController.listar);

router.get("/:id", ventaController.obtenerPorId);

router.patch(
  "/:id/anular",
  validate(anularVentaSchema),
  ventaController.anular,
);

export default router;
