import { Router } from "express";
import { AjusteController } from "../controllers/ajuste.controller.js";
import { crearAjusteSchema } from "../schemas/ajuste.schema.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

router.use(authenticate);

const controller = new AjusteController();

router.get("/", controller.listar.bind(controller));

router.post(
  "/",
  authorize("ADMINISTRADOR"),
  validate(crearAjusteSchema),
  controller.crear.bind(controller),
);

export default router;
