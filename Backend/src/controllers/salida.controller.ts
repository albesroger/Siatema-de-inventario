import { Request, Response } from "express";

import { SalidaService } from "../services/salida.service.js";

const salidaService = new SalidaService();

export class SalidaController {
  async crear(req: Request, res: Response) {
    try {
      const salida = await salidaService.crear(req.body);

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
          error instanceof Error
            ? error.message
            : "Error al registrar la salida",
      });
    }
  }

  async listar(req: Request, res: Response) {
    try {
      const negocioId = req.query.negocioId;

      if (typeof negocioId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El negocioId es obligatorio",
        });
      }

      const salidas = await salidaService.listar(negocioId);

      return res.json({
        success: true,
        data: JSON.parse(
          JSON.stringify(salidas, (_key, value) =>
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
            : "Error al obtener las salidas",
      });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const negocioId = req.query.negocioId;

      if (typeof negocioId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El negocioId es obligatorio",
        });
      }

      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "El id no es válido",
        });
      }

      const salida = await salidaService.obtenerPorId(negocioId, id);

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
          error instanceof Error ? error.message : "Salida no encontrada",
      });
    }
  }

  async anular(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { negocioId, usuarioId, dispositivoId } = req.body;

      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "El id no es válido",
        });
      }

      if (
        typeof negocioId !== "string" ||
        typeof usuarioId !== "string" ||
        typeof dispositivoId !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "negocioId, usuarioId y dispositivoId son obligatorios",
        });
      }

      const salida = await salidaService.anular(
        negocioId,
        id,
        usuarioId,
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
          error instanceof Error
            ? error.message
            : "No se pudo anular la salida",
      });
    }
  }
}
