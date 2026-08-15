import { Response, NextFunction } from "express";

import { AuthRequest } from "./auth.middleware.js";

export const authorize = (...rolesPermitidos: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta operación",
      });
    }

    next();
  };
};
