import { mensajeSeguro } from "../utils/errores.js";
import { Response } from "express";
import ventaService from "../services/venta.service.js";
import { serializeBigInt } from "../utils/bigint.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export class VentaController {
  async crear(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const venta = await ventaService.crearVenta(
        req.body,
        req.user.usuarioId,
        req.user.negocioId,
      );

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
          mensajeSeguro(error, "Error al crear la venta"),
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

      const ventas = await ventaService.listarVentas(req.user.negocioId);

      return res.status(200).json({
        success: true,
        data: serializeBigInt(ventas),
      });
    } catch (error) {
      console.error("Error al listar ventas:", error);

      return res.status(500).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al obtener las ventas"),
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
          message: "El ID de la venta es obligatorio",
        });
      }

      const venta = await ventaService.obtenerVentaPorId(
        id,
        req.user.negocioId,
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
          mensajeSeguro(error, "Error al obtener la venta"),
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

      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "El ID de la venta es obligatorio",
        });
      }

      const venta = await ventaService.anularVenta(
        id,
        req.body,
        req.user.usuarioId,
        req.user.negocioId,
      );

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
          mensajeSeguro(error, "Error al anular la venta"),
      });
    }
  }
}

export default new VentaController();
