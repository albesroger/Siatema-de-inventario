import { Router } from "express";
import { ProductoController } from "../controllers/producto.controller.js";

const router = Router();

const controller = new ProductoController();

router.post("/", controller.crear.bind(controller));

router.get("/", controller.obtenerTodos.bind(controller));

router.get("/:id", controller.obtenerPorId.bind(controller));

router.put("/:id", controller.actualizar.bind(controller));

router.delete("/:id", controller.eliminar.bind(controller));

export default router;
