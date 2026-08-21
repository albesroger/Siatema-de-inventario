import { mensajeSeguro } from "../utils/errores.js";
import { Response } from "express";

import { AuthRequest } from "../middlewares/auth.middleware.js";
import { ProductoService } from "../services/producto.service.js";
import { serializeBigInt } from "../utils/bigint.js";

const productoService = new ProductoService();

export class ProductoController {
  // ========================================================
  // CREAR PRODUCTO
  // ========================================================

  async crear(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const producto = await productoService.crear(
        req.body,
        req.user.negocioId,
      );

      return res.status(201).json({
        success: true,
        data: serializeBigInt(producto),
      });
    } catch (error) {
      console.error("Error al crear producto:", error);

      return res.status(400).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al crear el producto"),
      });
    }
  }

  // ========================================================
  // LISTAR PRODUCTOS
  // ========================================================

  async obtenerTodos(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const productos = await productoService.obtenerTodos(req.user.negocioId);

      return res.status(200).json({
        success: true,
        data: serializeBigInt(productos),
      });
    } catch (error) {
      console.error("Error al obtener productos:", error);

      return res.status(500).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al obtener los productos"),
      });
    }
  }

  // ========================================================
  // OBTENER PRODUCTO POR ID
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
          message: "El ID del producto es obligatorio",
        });
      }

      const producto = await productoService.obtenerPorId(
        req.user.negocioId,
        id,
      );

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        data: serializeBigInt(producto),
      });
    } catch (error) {
      console.error("Error al obtener producto:", error);

      return res.status(500).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al obtener el producto"),
      });
    }
  }

  // ========================================================
  // ACTUALIZAR PRODUCTO
  // ========================================================

  async actualizar(req: AuthRequest, res: Response) {
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
          message: "El ID del producto es obligatorio",
        });
      }

      const producto = await productoService.actualizar(
        req.user.negocioId,
        id,
        req.body,
      );

      return res.status(200).json({
        success: true,
        data: serializeBigInt(producto),
      });
    } catch (error) {
      console.error("Error al actualizar producto:", error);

      return res.status(400).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al actualizar el producto"),
      });
    }
  }

  // ========================================================
  // ELIMINAR PRODUCTO
  // ========================================================

  async eliminar(req: AuthRequest, res: Response) {
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
          message: "El ID del producto es obligatorio",
        });
      }

      const producto = await productoService.eliminar(req.user.negocioId, id);

      return res.status(200).json({
        success: true,
        data: serializeBigInt(producto),
      });
    } catch (error) {
      console.error("Error al eliminar producto:", error);

      return res.status(400).json({
        success: false,
        message:
          mensajeSeguro(error, "Error al eliminar el producto"),
      });
    }
  }
}
