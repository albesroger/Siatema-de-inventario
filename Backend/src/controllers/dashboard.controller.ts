import { Response } from "express";

import { AuthRequest } from "../middlewares/auth.middleware.js";
import { DashboardService } from "../services/dashboard.service.js";

const dashboardService = new DashboardService();

export class DashboardController {
  async obtenerEstadisticas(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const { negocioId } = req.user;
      const periodo = (req.query.periodo as "dia" | "semana" | "mes") || "dia";

      const estadisticas = await dashboardService.obtenerEstadisticas(
        negocioId,
        periodo,
      );

      return res.status(200).json({
        success: true,
        data: estadisticas,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener las estadísticas",
      });
    }
  }
}
