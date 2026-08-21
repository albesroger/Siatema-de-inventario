import { Request, Response, NextFunction } from "express";

import { z, ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.body = result.data;

    next();
  };
};

/**
 * Validador para router.param(): exige que el parámetro de ruta
 * indicado sea un UUID válido antes de llegar al controlador.
 */
export const validarParamId = (param = "id") => {
  return (req: Request, res: Response, next: NextFunction, value: string) => {
    const result = z.string().uuid().safeParse(value);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: `El parámetro '${param}' debe ser un UUID válido`,
      });
    }

    next();
  };
};
