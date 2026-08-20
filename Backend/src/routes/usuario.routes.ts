import { Router } from "express";
import * as usuarioController from "../controllers/usuario.controller.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { crearUsuarioSchema } from "../schemas/usuario.schema.js";

const router = Router();

router.use(authenticate, authorize("ADMINISTRADOR"));

router.post("/", validate(crearUsuarioSchema), usuarioController.crear);

router.get("/", usuarioController.listar);

router.get("/:id", usuarioController.obtenerPorId);

export default router;
