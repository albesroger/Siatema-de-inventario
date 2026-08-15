import { Request, Response, NextFunction } from "express";

import { verificarToken } from "../config/jwt.js";

export interface AuthRequest extends Request {
  user?: {
    usuarioId: string;
    negocioId: string;
    rol: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Token de autenticación requerido",
      });
    }

    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Formato de token inválido",
      });
    }

    const payload = verificarToken(token);

    req.user = {
      usuarioId: payload.usuarioId,
      negocioId: payload.negocioId,
      rol: payload.rol,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
};
