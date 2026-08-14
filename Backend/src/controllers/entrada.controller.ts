import { Request, Response } from "express";

import { EntradaService } from "../services/entrada.service.js";

const entradaService = new EntradaService();

export class EntradaController {
  async crear(req: Request, res: Response) {
    try {
      const entrada = await entradaService.crear(req.body);

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

  async listar(req: Request, res: Response) {
    try {
      const negocioId = req.query.negocioId;

      if (typeof negocioId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El negocioId es obligatorio",
        });
      }

      const entradas = await entradaService.listar(negocioId);

      return res.json({
        success: true,
        data: entradas,
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

      const entrada = await entradaService.obtenerPorId(negocioId, id);

      return res.json({
        success: true,
        data: entrada,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Entrada no encontrada",
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

      const entrada = await entradaService.anular(
        negocioId,
        id,
        usuarioId,
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
