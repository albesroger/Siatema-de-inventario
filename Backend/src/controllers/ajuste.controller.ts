import { Request, Response } from "express";

import { AjusteService } from "../services/ajuste.service.js";

const ajusteService = new AjusteService();

export class AjusteController {
  async crear(req: Request, res: Response) {
    try {
      const ajuste = await ajusteService.crear(req.body);

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
}
