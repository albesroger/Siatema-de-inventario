import { z } from "zod";

const detalleEntradaSchema = z.object({
  productoId: z.string().uuid("El productoId no es válido"),

  cantidad: z.number().positive("La cantidad debe ser mayor que cero"),

  costoUnitario: z
    .number()
    .nonnegative("El costo unitario no puede ser negativo"),

  descuento: z
    .number()
    .nonnegative("El descuento no puede ser negativo")
    .default(0),
});

export const crearEntradaSchema = z.object({
  proveedorId: z.string().uuid("El proveedorId no es válido").optional(),

  dispositivoId: z.string().uuid("El dispositivoId no es válido"),

  numeroDocumento: z.string().trim().max(100).optional(),

  descuento: z
    .number()
    .nonnegative("El descuento no puede ser negativo")
    .default(0),

  observaciones: z.string().trim().optional(),

  detalles: z
    .array(detalleEntradaSchema)
    .min(1, "La entrada debe contener al menos un producto"),
});
