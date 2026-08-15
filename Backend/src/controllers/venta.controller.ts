import { Request, Response } from "express";
import ventaService from "../services/venta.service.js";
import { serializeBigInt } from "../utils/bigint.js";

export class VentaController {
  async crear(req: Request, res: Response) {
    try {
      const venta = await ventaService.crearVenta(req.body);

      return res.status(201).json({
        success: true,
        message: "Venta creada correctamente",
        data: serializeBigInt(venta),
      });
    } catch (error) {
      console.error("Error al crear venta:", error);

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Error al crear la venta",
      });
    }
  }

  async listar(req: Request, res: Response) {
    try {
      const negocioId = req.query.negocioId;

      if (typeof negocioId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El parámetro negocioId es obligatorio",
        });
      }

      const ventas = await ventaService.listarVentas(negocioId);

      return res.status(200).json({
        success: true,
        data: serializeBigInt(ventas),
      });
    } catch (error) {
      console.error("Error al listar ventas:", error);

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener las ventas",
      });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { negocioId } = req.query;

      if (typeof negocioId !== "string") {
        return res.status(400).json({
          success: false,
          message: "El negocioId es requerido",
        });
      }

      const venta = await ventaService.obtenerVentaPorId(
        id as string,
        negocioId,
      );

      return res.status(200).json({
        success: true,
        data: serializeBigInt(venta),
      });
    } catch (error) {
      console.error("Error al obtener venta:", error);

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Error al obtener la venta",
      });
    }
  }

  async anular(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "El ID de la venta es obligatorio",
        });
      }

      const venta = await ventaService.anularVenta(id, req.body);

      return res.status(200).json({
        success: true,
        message: "Venta anulada correctamente",
        data: serializeBigInt(venta),
      });
    } catch (error) {
      console.error("Error al anular venta:", error);

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Error al anular la venta",
      });
    }
  }
}

export default new VentaController();
