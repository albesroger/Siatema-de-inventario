import { z } from "zod";

export const tipoAjusteSchema = z.enum(["POSITIVO", "NEGATIVO"]);

export const motivoAjusteSchema = z.enum([
  "DIFERENCIA_CONTEO",
  "ERROR_REGISTRO",
  "CORRECCION",
  "OTRO",
]);

const detalleAjusteSchema = z.object({
  productoId: z.string().uuid("El productoId no es válido"),

  cantidad: z.number().positive("La cantidad debe ser mayor que cero"),

  observaciones: z.string().trim().optional(),
});

export const crearAjusteSchema = z
  .object({
    negocioId: z.string().uuid("El negocioId no es válido"),

    usuarioId: z.string().uuid("El usuarioId no es válido"),

    dispositivoId: z.string().uuid("El dispositivoId no es válido"),

    tipo: tipoAjusteSchema,

    motivo: motivoAjusteSchema,

    observaciones: z.string().trim().optional(),

    detalles: z
      .array(detalleAjusteSchema)
      .min(1, "El ajuste debe contener al menos un producto"),
  })
  .superRefine((data, ctx) => {
    const ids = data.detalles.map((detalle) => detalle.productoId);

    const repetidos = ids.filter((id, index) => ids.indexOf(id) !== index);

    if (repetidos.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["detalles"],
        message: "No se puede repetir el mismo producto en un ajuste",
      });
    }
  });

export type CrearAjusteDTO = z.infer<typeof crearAjusteSchema>;
