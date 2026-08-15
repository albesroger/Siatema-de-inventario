import { Request, Response } from "express";
import * as authService from "../services/auth.service.js";

export const login = async (req: Request, res: Response) => {
  try {
    const resultado = await authService.login(req.body);

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      data: resultado,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Error al iniciar sesión",
    });
  }
};
