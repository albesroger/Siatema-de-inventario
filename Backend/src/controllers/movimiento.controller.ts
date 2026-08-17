import { Response } from "express";

import { AuthRequest } from "../middlewares/auth.middleware.js";
import { MovimientoService } from "../services/movimiento.service.js";

const movimientoService = new MovimientoService();

export class MovimientoController {
  async listar(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const { negocioId } = req.user;

      const movimientos = await movimientoService.listar(negocioId);

      return res.status(200).json({
        success: true,
        data: JSON.parse(
          JSON.stringify(movimientos, (_key, value) =>
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
            : "Error al obtener los movimientos",
      });
    }
  }
}
