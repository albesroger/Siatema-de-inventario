import { Request, Response } from "express";

import { CategoriaService } from "../services/categoria.service.js";

const categoriaService = new CategoriaService();

export class CategoriaController {
  async crear(req: Request, res: Response) {
    try {
      const categoria = await categoriaService.crear(req.body);

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

  async obtenerTodos(req: Request, res: Response) {
    try {
      const negocioId = req.query.negocioId;

      if (typeof negocioId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El negocioId es obligatorio",
        });
      }

      const categorias = await categoriaService.obtenerTodos(negocioId);

      return res.json({
        success: true,
        data: categorias,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener las categorías",
      });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    try {
      const negocioId = req.query.negocioId;

      const id = req.params.id;

      if (typeof negocioId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El negocioId es obligatorio",
        });
      }

      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "El ID de la categoría es obligatorio",
        });
      }

      const categoria = await categoriaService.obtenerPorId(negocioId, id);

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
        message: "Error al obtener la categoría",
      });
    }
  }

  async actualizar(req: Request, res: Response) {
    try {
      const negocioId = req.body.negocioId;

      const id = req.params.id;

      if (typeof negocioId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El negocioId es obligatorio",
        });
      }

      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "El ID de la categoría es obligatorio",
        });
      }

      const categoria = await categoriaService.actualizar(
        negocioId,
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

  async eliminar(req: Request, res: Response) {
    try {
      const negocioId = req.query.negocioId;

      const id = req.params.id;

      if (typeof negocioId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El negocioId es obligatorio",
        });
      }

      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "El ID de la categoría es obligatorio",
        });
      }

      const categoria = await categoriaService.eliminar(negocioId, id);

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
