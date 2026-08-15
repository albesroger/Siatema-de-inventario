import { Response } from "express";

import { AuthRequest } from "../middlewares/auth.middleware.js";
import { EntradaService } from "../services/entrada.service.js";

const entradaService = new EntradaService();

export class EntradaController {
  async crear(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const entrada = await entradaService.crear(
        req.body,
        req.user.usuarioId,
        req.user.negocioId,
      );

      return res.status(201).json({
        success: true,
        data: JSON.parse(
          JSON.stringify(entrada, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        ),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al registrar la entrada",
      });
    }
  }

  async listar(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const entradas = await entradaService.listar(req.user.negocioId);

      return res.json({
        success: true,
        data: JSON.parse(
          JSON.stringify(entradas, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        ),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener las entradas",
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
          message: "El id no es válido",
        });
      }

      const entrada = await entradaService.obtenerPorId(req.user.negocioId, id);

      return res.json({
        success: true,
        data: JSON.parse(
          JSON.stringify(entrada, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        ),
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Entrada no encontrada",
      });
    }
  }

  async anular(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const { id } = req.params;
      const { dispositivoId } = req.body;

      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "El id no es válido",
        });
      }

      if (typeof dispositivoId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El dispositivoId es obligatorio",
        });
      }

      const entrada = await entradaService.anular(
        id,
        req.user.usuarioId,
        req.user.negocioId,
        dispositivoId,
      );

      return res.status(200).json({
        success: true,
        data: JSON.parse(
          JSON.stringify(entrada, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        ),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudo anular la entrada",
      });
    }
  }
}
