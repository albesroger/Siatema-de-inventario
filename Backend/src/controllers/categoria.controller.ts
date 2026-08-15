import { Response } from "express";

import { AuthRequest } from "../middlewares/auth.middleware.js";
import { CategoriaService } from "../services/categoria.service.js";

const categoriaService = new CategoriaService();

export class CategoriaController {
  // ========================================================
  // CREAR
  // ========================================================

  async crear(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const categoria = await categoriaService.crear(
        req.body,
        req.user.negocioId,
      );

      return res.status(201).json({
        success: true,
        data: categoria,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al crear la categoría",
      });
    }
  }

  // ========================================================
  // OBTENER TODOS
  // ========================================================

  async obtenerTodos(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const categorias = await categoriaService.obtenerTodos(
        req.user.negocioId,
      );

      return res.json({
        success: true,
        data: categorias,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener las categorías",
      });
    }
  }

  // ========================================================
  // OBTENER POR ID
  // ========================================================

  async obtenerPorId(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const { id } = req.params;

      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "El ID de la categoría es obligatorio",
        });
      }

      const categoria = await categoriaService.obtenerPorId(
        req.user.negocioId,
        id,
      );

      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: "Categoría no encontrada",
        });
      }

      return res.json({
        success: true,
        data: categoria,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener la categoría",
      });
    }
  }

  // ========================================================
  // ACTUALIZAR
  // ========================================================

  async actualizar(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const { id } = req.params;

      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "El ID de la categoría es obligatorio",
        });
      }

      const categoria = await categoriaService.actualizar(
        req.user.negocioId,
        id,
        req.body,
      );

      return res.json({
        success: true,
        data: categoria,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar la categoría",
      });
    }
  }

  // ========================================================
  // ELIMINAR
  // ========================================================

  async eliminar(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const { id } = req.params;

      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "El ID de la categoría es obligatorio",
        });
      }

      const categoria = await categoriaService.eliminar(req.user.negocioId, id);

      return res.json({
        success: true,
        data: categoria,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al eliminar la categoría",
      });
    }
  }
}
