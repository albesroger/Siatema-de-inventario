import { z } from "zod";

const detalleSalidaSchema = z.object({
  productoId: z.string().uuid("El productoId no es válido"),

  cantidad: z.number().positive("La cantidad debe ser mayor que cero"),

  observaciones: z.string().trim().optional(),
});

export const crearSalidaSchema = z.object({
  negocioId: z.string().uuid("El negocioId no es válido"),

  usuarioId: z.string().uuid("El usuarioId no es válido"),

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
    .array(detalleSalidaSchema)
    .min(1, "La salida debe contener al menos un producto"),
});
