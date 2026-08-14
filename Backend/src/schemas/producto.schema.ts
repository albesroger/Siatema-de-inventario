import { z } from "zod";

export const crearProductoSchema = z.object({
  negocioId: z.string().uuid("El negocioId no es válido"),

  categoriaId: z.string().uuid("El categoriaId no es válido"),

  codigo: z
    .string()
    .min(1, "El código es obligatorio")
    .max(100, "El código no puede superar los 100 caracteres"),

  codigoBarras: z
    .string()
    .max(100, "El código de barras no puede superar los 100 caracteres")
    .optional(),

  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(150, "El nombre no puede superar los 150 caracteres"),

  descripcion: z.string().optional(),

  unidadMedida: z.enum([
    "UNIDAD",
    "KILOGRAMO",
    "GRAMO",
    "LIBRA",
    "LITRO",
    "MILILITRO",
    "METRO",
    "CENTIMETRO",
    "CAJA",
    "PAQUETE",
    "DOCENA",
  ]),

  precioCompra: z
    .number()
    .nonnegative("El precio de compra no puede ser negativo"),

  precioVenta: z
    .number()
    .nonnegative("El precio de venta no puede ser negativo"),

  stockMinimo: z
    .number()
    .nonnegative("El stock mínimo no puede ser negativo")
    .optional(),

  stockMaximo: z
    .number()
    .nonnegative("El stock máximo no puede ser negativo")
    .optional(),
});

export const actualizarProductoSchema = z.object({
  categoriaId: z.string().uuid("El categoriaId no es válido").optional(),

  codigo: z
    .string()
    .min(1, "El código no puede estar vacío")
    .max(100)
    .optional(),

  codigoBarras: z.string().max(100).optional(),

  nombre: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(150)
    .optional(),

  descripcion: z.string().optional(),

  unidadMedida: z
    .enum([
      "UNIDAD",
      "KILOGRAMO",
      "GRAMO",
      "LIBRA",
      "LITRO",
      "MILILITRO",
      "METRO",
      "CENTIMETRO",
      "CAJA",
      "PAQUETE",
      "DOCENA",
    ])
    .optional(),

  precioCompra: z.number().nonnegative().optional(),

  precioVenta: z.number().nonnegative().optional(),

  stockMinimo: z.number().nonnegative().optional(),

  stockMaximo: z.number().nonnegative().optional(),
});
