import { mensajeSeguro } from "../utils/errores.js";
import { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { JWT_EXPIRES_IN } from "../config/jwt.js";

const AUTH_COOKIE_NAME = "token";

const msDesdeExpira = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);

  if (!match) return 8 * 60 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const secondsPerUnit: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  const seconds = secondsPerUnit[match[2]] ?? 3600;

  return value * seconds * 1000;
};

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: msDesdeExpira(JWT_EXPIRES_IN),
  path: "/",
};

export const login = async (req: Request, res: Response) => {
  try {
    const resultado = await authService.login(req.body);

    res.cookie(AUTH_COOKIE_NAME, resultado.token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      data: resultado,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        mensajeSeguro(error, "Error al iniciar sesión"),
    });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Sesión cerrada correctamente",
  });
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const usuario = await authService.me(
      req.user.usuarioId,
      req.user.negocioId,
    );

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al obtener la sesión",
    });
  }
};