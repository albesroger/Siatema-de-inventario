import { Router } from "express";

import { AjusteController } from "../controllers/ajuste.controller.js";

import { crearAjusteSchema } from "../schemas/ajuste.schema.js";

import { validate } from "../middlewares/validate.js";

const router = Router();

const controller = new AjusteController();

router.post(
  "/",
  validate(crearAjusteSchema),
  controller.crear.bind(controller),
);

export default router;
