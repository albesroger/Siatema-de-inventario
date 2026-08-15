import { z } from "zod";

// ============================================================
// CREAR PRODUCTO
// ============================================================

export const crearProductoSchema = z.object({
  categoriaId: z.string().uuid("El categoriaId no es válido"),

  codigo: z
    .string()
    .trim()
    .min(1, "El código es obligatorio")
    .max(100, "El código no puede superar los 100 caracteres"),

  codigoBarras: z
    .string()
    .trim()
    .max(100, "El código de barras no puede superar los 100 caracteres")
    .optional(),

  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(150, "El nombre no puede superar los 150 caracteres"),

  descripcion: z.string().trim().optional(),

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

// ============================================================
// ACTUALIZAR PRODUCTO
// ============================================================

export const actualizarProductoSchema = z.object({
  categoriaId: z.string().uuid("El categoriaId no es válido").optional(),

  codigo: z
    .string()
    .trim()
    .min(1, "El código no puede estar vacío")
    .max(100, "El código no puede superar los 100 caracteres")
    .optional(),

  codigoBarras: z
    .string()
    .trim()
    .max(100, "El código de barras no puede superar los 100 caracteres")
    .optional(),

  nombre: z
    .string()
    .trim()
    .min(1, "El nombre no puede estar vacío")
    .max(150, "El nombre no puede superar los 150 caracteres")
    .optional(),

  descripcion: z.string().trim().optional(),

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

  precioCompra: z
    .number()
    .nonnegative("El precio de compra no puede ser negativo")
    .optional(),

  precioVenta: z
    .number()
    .nonnegative("El precio de venta no puede ser negativo")
    .optional(),

  stockMinimo: z
    .number()
    .nonnegative("El stock mínimo no puede ser negativo")
    .optional(),

  stockMaximo: z
    .number()
    .nonnegative("El stock máximo no puede ser negativo")
    .optional(),
});
