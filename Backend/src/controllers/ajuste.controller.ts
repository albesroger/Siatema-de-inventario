import { Response } from "express";

import { AuthRequest } from "../middlewares/auth.middleware.js";
import { AjusteService } from "../services/ajuste.service.js";

const ajusteService = new AjusteService();

export class AjusteController {
  async crear(req: AuthRequest, res: Response) {
    try {
      // =========================================
      // 1. VALIDAR AUTENTICACIÓN
      // =========================================

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      // =========================================
      // 2. OBTENER DATOS DEL JWT
      // =========================================

      const { negocioId, usuarioId } = req.user;

      // =========================================
      // 3. CREAR AJUSTE
      // =========================================

      const ajuste = await ajusteService.crear(req.body, negocioId, usuarioId);

      // =========================================
      // 4. RESPUESTA
      // =========================================

      return res.status(201).json({
        success: true,

        data: JSON.parse(
          JSON.stringify(ajuste, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        ),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,

        message:
          error instanceof Error ? error.message : "Error al crear el ajuste",
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

      const { negocioId } = req.user;

      const ajustes = await ajusteService.listar(negocioId);

      return res.status(200).json({
        success: true,
        data: JSON.parse(
          JSON.stringify(ajustes, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        ),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Error al listar ajustes",
      });
    }
  }
}
