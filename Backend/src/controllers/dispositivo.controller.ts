import { mensajeSeguro } from "../utils/errores.js";
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { DispositivoService } from "../services/dispositivo.service.js";

const dispositivoService = new DispositivoService();

export class DispositivoController {
  async crear(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const dispositivo = await dispositivoService.crear(
        req.body,
        req.user.negocioId,
      );

      return res.status(201).json({
        success: true,
        data: dispositivo,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al crear el dispositivo"),
      });
    }
  }

  async obtenerTodos(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const dispositivos = await dispositivoService.obtenerTodos(
        req.user.negocioId,
      );

      return res.json({
        success: true,
        data: dispositivos,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al obtener los dispositivos"),
      });
    }
  }

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
          message: "El ID del dispositivo es obligatorio",
        });
      }

      const dispositivo = await dispositivoService.obtenerPorId(
        req.user.negocioId,
        id,
      );

      if (!dispositivo) {
        return res.status(404).json({
          success: false,
          message: "Dispositivo no encontrado",
        });
      }

      return res.json({
        success: true,
        data: dispositivo,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al obtener el dispositivo"),
      });
    }
  }

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
          message: "El ID del dispositivo es obligatorio",
        });
      }

      const dispositivo = await dispositivoService.actualizar(
        req.user.negocioId,
        id,
        req.body,
      );

      return res.json({
        success: true,
        data: dispositivo,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al actualizar el dispositivo"),
      });
    }
  }

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
          message: "El ID del dispositivo es obligatorio",
        });
      }

      const dispositivo = await dispositivoService.eliminar(
        req.user.negocioId,
        id,
      );

      return res.json({
        success: true,
        data: dispositivo,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al eliminar el dispositivo"),
      });
    }
  }
}
