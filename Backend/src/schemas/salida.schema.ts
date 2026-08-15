import { z } from "zod";

const detalleSalidaSchema = z.object({
  productoId: z.string().uuid("El productoId no es válido"),

  cantidad: z.number().positive("La cantidad debe ser mayor que cero"),

  observaciones: z.string().trim().optional(),
});

export const crearSalidaSchema = z.object({
  dispositivoId: z.string().uuid("El dispositivoId no es válido"),

  motivo: z.enum([
    "PRODUCTO_DANADO",
    "PRODUCTO_VENCIDO",
    "CONSUMO_INTERNO",
    "PERDIDA",
    "ROBO",
    "MUESTRA",
    "OTRO",
  ]),

  observaciones: z.string().trim().optional(),

  detalles: z
    .array(
      z.object({
        productoId: z.string().uuid("El productoId no es válido"),

        cantidad: z.number().positive("La cantidad debe ser mayor que 0"),

        observaciones: z.string().trim().optional(),
      }),
    )
    .min(1, "Debe existir al menos un detalle"),
});
export const anularSalidaSchema = z.object({
  dispositivoId: z.string().uuid("El dispositivoId no es válido"),
});
