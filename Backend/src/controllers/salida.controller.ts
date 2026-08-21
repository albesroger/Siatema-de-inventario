import { mensajeSeguro } from "../utils/errores.js";
import { Response } from "express";

import { AuthRequest } from "../middlewares/auth.middleware.js";
import { SalidaService } from "../services/salida.service.js";

const salidaService = new SalidaService();

export class SalidaController {
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

      const salida = await salidaService.crear(
        req.body,
        req.user.negocioId,
        req.user.usuarioId,
      );

      return res.status(201).json({
        success: true,
        data: JSON.parse(
          JSON.stringify(salida, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        ),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al registrar la salida"),
      });
    }
  }

  // ========================================================
  // LISTAR
  // ========================================================

  async listar(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const salidas = await salidaService.listar(req.user.negocioId);

      return res.json({
        success: true,
        data: JSON.parse(
          JSON.stringify(salidas, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        ),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al obtener las salidas"),
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
          message: "El id no es válido",
        });
      }

      const salida = await salidaService.obtenerPorId(
        req.user.negocioId,
        id,
      );

      return res.json({
        success: true,
        data: JSON.parse(
          JSON.stringify(salida, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        ),
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          mensajeSeguro(error, "Salida no encontrada"),
      });
    }
  }

  // ========================================================
  // ANULAR
  // ========================================================

  async anular(req: AuthRequest, res: Response) {
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
          message: "El id no es válido",
        });
      }

      /*
       * negocioId y usuarioId YA NO vienen del body.
       *
       * negocioId -> JWT
       * usuarioId -> JWT
       *
       * Solo necesitamos dispositivoId del body.
       */

      const { dispositivoId } = req.body;

      if (typeof dispositivoId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El dispositivoId es obligatorio",
        });
      }

      const salida = await salidaService.anular(
        req.user.negocioId,
        id,
        req.user.usuarioId,
        dispositivoId,
      );

      return res.status(200).json({
        success: true,
        data: JSON.parse(
          JSON.stringify(salida, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        ),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          mensajeSeguro(error, "No se pudo anular la salida"),
      });
    }
  }
}