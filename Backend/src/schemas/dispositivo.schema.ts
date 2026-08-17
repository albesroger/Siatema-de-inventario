import { z } from "zod";

export const crearDispositivoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar los 100 caracteres"),

  identificador: z
    .string()
    .trim()
    .min(1, "El identificador es obligatorio")
    .max(255, "El identificador no puede superar los 255 caracteres"),

  tipo: z.enum(["DESKTOP", "LAPTOP", "TABLET"]),

  estado: z.enum(["ACTIVO", "BLOQUEADO"]).default("ACTIVO"),
});

export const actualizarDispositivoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100)
    .optional(),

  identificador: z
    .string()
    .trim()
    .min(1, "El identificador es obligatorio")
    .max(255)
    .optional(),

  tipo: z.enum(["DESKTOP", "LAPTOP", "TABLET"]).optional(),

  estado: z.enum(["ACTIVO", "BLOQUEADO"]).optional(),
});
