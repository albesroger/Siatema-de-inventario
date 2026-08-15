import { z } from "zod";

export const crearProveedorSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(150, "El nombre no puede superar los 150 caracteres"),

  telefono: z
    .string()
    .trim()
    .max(50, "El teléfono no puede superar los 50 caracteres")
    .optional(),

  direccion: z
    .string()
    .trim()
    .max(255, "La dirección no puede superar los 255 caracteres")
    .optional(),

  email: z
    .string()
    .trim()
    .email("El email no es válido")
    .max(150, "El email no puede superar los 150 caracteres")
    .optional(),

  identificacion: z
    .string()
    .trim()
    .max(100, "La identificación no puede superar los 100 caracteres")
    .optional(),

  observaciones: z.string().trim().optional(),
});

export const actualizarProveedorSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(150)
    .optional(),

  telefono: z.string().trim().max(50).optional(),

  direccion: z.string().trim().max(255).optional(),

  email: z
    .string()
    .trim()
    .email("El email no es válido")
    .max(150)
    .optional(),

  identificacion: z.string().trim().max(100).optional(),

  observaciones: z.string().trim().optional(),
});