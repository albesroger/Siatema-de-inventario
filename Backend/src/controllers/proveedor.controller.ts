import { mensajeSeguro } from "../utils/errores.js";
import { Response } from "express";

import { AuthRequest } from "../middlewares/auth.middleware.js";
import { ProveedorService } from "../services/proveedor.service.js";

const proveedorService = new ProveedorService();

export class ProveedorController {
  // ========================================================
  // CREAR PROVEEDOR
  // ========================================================

  async crear(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const proveedor = await proveedorService.crear(
        req.body,
        req.user.negocioId,
      );

      return res.status(201).json({
        success: true,
        data: proveedor,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al crear el proveedor"),
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

      const proveedores = await proveedorService.obtenerTodos(
        req.user.negocioId,
      );

      return res.json({
        success: true,
        data: proveedores,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al obtener los proveedores"),
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
          message: "El ID del proveedor es obligatorio",
        });
      }

      const proveedor = await proveedorService.obtenerPorId(
        req.user.negocioId,
        id,
      );

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
        message:
          mensajeSeguro(error, "Error al obtener el proveedor"),
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
          message: "El ID del proveedor es obligatorio",
        });
      }

      const proveedor = await proveedorService.actualizar(
        req.user.negocioId,
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
          mensajeSeguro(error, "Error al actualizar el proveedor"),
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
          message: "El ID del proveedor es obligatorio",
        });
      }

      const proveedor = await proveedorService.eliminar(req.user.negocioId, id);

      return res.json({
        success: true,
        data: proveedor,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al eliminar el proveedor"),
      });
    }
  }
}
