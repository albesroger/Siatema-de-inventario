import { Request, Response } from "express";
import { ProductoService } from "../services/producto.service.js";

const productoService = new ProductoService();

export class ProductoController {
  async crear(req: Request, res: Response) {
    try {
      const producto = await productoService.crear(req.body);

      res.status(201).json({
        success: true,
        data: producto,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Error al crear el producto",
      });
    }
  }

  async obtenerTodos(req: Request, res: Response) {
    try {
      const negocioId = req.query.negocioId;

      // Validamos que sea realmente un string
      if (typeof negocioId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El negocioId es obligatorio",
        });
      }

      const productos = await productoService.obtenerTodos(negocioId);

      return res.json({
        success: true,
        data: productos,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener los productos",
      });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    try {
      const negocioId = req.query.negocioId;
      const id = req.params.id;

      // Validar negocioId
      if (typeof negocioId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El negocioId es obligatorio",
        });
      }

      // Validar id
      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "El ID del producto es obligatorio",
        });
      }

      const producto = await productoService.obtenerPorId(negocioId, id);

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        });
      }

      return res.json({
        success: true,
        data: producto,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener el producto",
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
          message: "El ID del producto es obligatorio",
        });
      }

      const producto = await productoService.actualizar(
        negocioId,
        id,
        req.body,
      );

      return res.json({
        success: true,
        data: producto,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar el producto",
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
          message: "El ID del producto es obligatorio",
        });
      }

      const producto = await productoService.eliminar(negocioId, id);

      return res.json({
        success: true,
        data: producto,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al eliminar el producto",
      });
    }
  }
}
