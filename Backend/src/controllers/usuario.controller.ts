import { Request, Response } from "express";
import * as usuarioService from "../services/usuario.service.js";

export const crear = async (req: Request, res: Response) => {
  try {
    const usuario = await usuarioService.crearUsuario(req.body);

    return res.status(201).json({
      success: true,
      message: "Usuario creado correctamente",
      data: usuario,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Error al crear usuario",
    });
  }
};

export const listar = async (req: Request, res: Response) => {
  try {
    const { negocioId } = req.query;

    if (typeof negocioId !== "string") {
      return res.status(400).json({
        success: false,
        message: "El negocioId es requerido",
      });
    }

    const usuarios = await usuarioService.listarUsuarios(negocioId);

    return res.status(200).json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Error al listar usuarios",
    });
  }
};

export const obtenerPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { negocioId } = req.query;

    if (typeof negocioId !== "string") {
      return res.status(400).json({
        success: false,
        message: "El negocioId es requerido",
      });
    }

    const usuario = await usuarioService.obtenerUsuarioPorId(
      id as string,
      negocioId,
    );

    return res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Usuario no encontrado",
    });
  }
};

