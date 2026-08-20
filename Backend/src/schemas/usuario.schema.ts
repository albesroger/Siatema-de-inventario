import { z } from "zod";

export const crearUsuarioSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150),

  username: z
    .string()
    .min(3, "El username debe tener al menos 3 caracteres")
    .max(100),

  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100),

  rol: z.enum(["ADMINISTRADOR", "VENDEDOR"]).default("VENDEDOR"),

  estado: z.enum(["ACTIVO", "INACTIVO"]).default("ACTIVO"),
});

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(2).max(150).optional(),

  username: z.string().min(3).max(100).optional(),

  password: z.string().min(6).max(100).optional(),

  rol: z.enum(["ADMINISTRADOR", "VENDEDOR"]).optional(),

  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});

export const cambiarEstadoUsuarioSchema = z.object({
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});
