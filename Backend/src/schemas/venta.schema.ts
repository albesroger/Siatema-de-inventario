import { z } from "zod";

/**
 * ============================================================
 * DETALLE DE VENTA
 * ============================================================
 */

export const detalleVentaSchema = z.object({
  productoId: z.string().uuid("El productoId debe ser un UUID válido"),

  cantidad: z.number().positive("La cantidad debe ser mayor que 0"),

  descuento: z.number().min(0, "El descuento no puede ser negativo").default(0),
});

/**
 * ============================================================
 * CREAR VENTA
 * ============================================================
 */

export const crearVentaSchema = z.object({
  dispositivoId: z.string().uuid("El dispositivoId debe ser un UUID válido"),

  descuento: z.number().min(0, "El descuento no puede ser negativo").default(0),

  impuesto: z.number().min(0, "El impuesto no puede ser negativo").default(0),

  metodoPago: z
    .enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "OTRO"])
    .default("EFECTIVO"),

  detalles: z
    .array(detalleVentaSchema)
    .min(1, "La venta debe tener al menos un producto"),
});

/**
 * ============================================================
 * ANULAR VENTA
 * ============================================================
 */

export const anularVentaSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(3, "El motivo debe tener al menos 3 caracteres")
    .max(255, "El motivo no puede superar los 255 caracteres")
    .optional(),
});

/**
 * ============================================================
 * TIPOS TYPESCRIPT
 * ============================================================
 */

export type CrearVentaInput = z.infer<typeof crearVentaSchema>;

export type AnularVentaInput = z.infer<typeof anularVentaSchema>;
