import { mensajeSeguro } from "../utils/errores.js";
import { Response } from "express";
import * as usuarioService from "../services/usuario.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const crear = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const usuario = await usuarioService.crearUsuario(
      req.body,
      req.user.negocioId,
    );

    return res.status(201).json({
      success: true,
      message: "Usuario creado correctamente",
      data: usuario,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        mensajeSeguro(error, "Error al crear usuario"),
    });
  }
};

export const listar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const usuarios = await usuarioService.listarUsuarios(req.user.negocioId);

    return res.status(200).json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        mensajeSeguro(error, "Error al listar usuarios"),
    });
  }
};

export const obtenerPorId = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const { id } = req.params;

    const usuario = await usuarioService.obtenerUsuarioPorId(
      id as string,
      req.user.negocioId,
    );

    return res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: mensajeSeguro(error, "Usuario no encontrado"),
    });
  }
};

