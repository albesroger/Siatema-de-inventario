import { Request, Response, NextFunction } from "express";

import { verificarToken } from "../config/jwt.js";

export interface AuthRequest extends Request {
  user?: {
    usuarioId: string;
    negocioId: string;
    rol: string;
  };
}

const parseCookies = (header?: string): Record<string, string> => {
  if (!header) return {};

  return header.split(";").reduce<Record<string, string>>((cookies, part) => {
    const idx = part.indexOf("=");

    if (idx === -1) return cookies;

    const key = part.slice(0, idx).trim();

    if (!key) return cookies;

    const value = part.slice(idx + 1).trim();

    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }

    return cookies;
  }, {});
};

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authorization = req.headers.authorization;

    let token: string | undefined;

    if (authorization) {
      const [type, value] = authorization.split(" ");

      if (type !== "Bearer" || !value) {
        return res.status(401).json({
          success: false,
          message: "Formato de token inválido",
        });
      }

      token = value;
    } else {
      token = parseCookies(req.headers.cookie).token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de autenticación requerido",
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