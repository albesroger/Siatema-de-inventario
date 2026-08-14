import { Request, Response } from "express";

import { ProveedorService } from "../services/proveedor.service.js";

const proveedorService = new ProveedorService();

export class ProveedorController {
  async crear(req: Request, res: Response) {
    try {
      const proveedor = await proveedorService.crear(req.body);

      return res.status(201).json({
        success: true,
        data: proveedor,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al crear el proveedor",
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

      const proveedores = await proveedorService.obtenerTodos(negocioId);

      return res.json({
        success: true,
        data: proveedores,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener los proveedores",
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
          message: "El ID del proveedor es obligatorio",
        });
      }

      const proveedor = await proveedorService.obtenerPorId(negocioId, id);

      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: "Proveedor no encontrado",
        });
      }

      return res.json({
        success: true,
        data: proveedor,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener el proveedor",
      });
    }
  }

  async actualizar(req: Request, res: Response) {
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
          message: "El ID del proveedor es obligatorio",
        });
      }

      const proveedor = await proveedorService.actualizar(
        negocioId,
        id,
        req.body,
      );

      return res.json({
        success: true,
        data: proveedor,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar el proveedor",
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
          message: "El negocioId es obligatorio",
        });
      }

      const proveedor = await proveedorService.eliminar(negocioId, id);

      return res.json({
        success: true,
        data: proveedor,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al eliminar el proveedor",
      });
    }
  }
}
