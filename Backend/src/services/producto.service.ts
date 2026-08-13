import { prisma } from "../config/database.js";
import type { unidad_medida } from "../generated/prisma/enums.js";

interface CrearProductoDTO {
  negocioId: string;
  categoriaId: string;
  codigo: string;
  codigoBarras?: string;
  nombre: string;
  descripcion?: string;
  unidadMedida: unidad_medida;
  precioCompra: number;
  precioVenta: number;
  stockMinimo?: number;
  stockMaximo?: number;
}

export class ProductoService {
  async crear(data: CrearProductoDTO) {
    const productoExistente = await prisma.producto.findFirst({
      where: {
        negocio_id: data.negocioId,
        codigo: data.codigo,
      },
    });

    if (productoExistente) {
      throw new Error("Ya existe un producto con ese código en este negocio");
    }

    return prisma.producto.create({
      data: {
        negocio_id: data.negocioId,
        categoria_id: data.categoriaId,
        codigo: data.codigo,
        codigo_barras: data.codigoBarras,
        nombre: data.nombre,
        descripcion: data.descripcion,
        unidad_medida: data.unidadMedida,
        precio_compra: data.precioCompra,
        precio_venta: data.precioVenta,
        stock_actual: 0,
        stock_minimo: data.stockMinimo ?? 0,
        stock_maximo: data.stockMaximo,
      },
    });
  }

  async obtenerTodos(negocioId: string) {
    return prisma.producto.findMany({
      where: {
        negocio_id: negocioId,
      },
      include: {
        categoria: true,
      },
      orderBy: {
        nombre: "asc",
      },
    });
  }

  async obtenerPorId(negocioId: string, id: string) {
    return prisma.producto.findFirst({
      where: {
        id,
        negocio_id: negocioId,
      },
      include: {
        categoria: true,
      },
    });
  }

  async actualizar(
    negocioId: string,
    id: string,
    data: Partial<CrearProductoDTO>,
  ) {
    const producto = await prisma.producto.findFirst({
      where: {
        id,
        negocio_id: negocioId,
      },
    });

    if (!producto) {
      throw new Error("Producto no encontrado");
    }

    return prisma.producto.update({
      where: {
        id,
      },
      data: {
        categoria_id: data.categoriaId,
        codigo: data.codigo,
        codigo_barras: data.codigoBarras,
        nombre: data.nombre,
        descripcion: data.descripcion,
        unidad_medida: data.unidadMedida,
        precio_compra: data.precioCompra,
        precio_venta: data.precioVenta,
        stock_minimo: data.stockMinimo,
        stock_maximo: data.stockMaximo,
      },
    });
  }

  async eliminar(negocioId: string, id: string) {
    const producto = await prisma.producto.findFirst({
      where: {
        id,
        negocio_id: negocioId,
      },
    });

    if (!producto) {
      throw new Error("Producto no encontrado");
    }

    return prisma.producto.update({
      where: {
        id,
      },
      data: {
        estado: "INACTIVO",
      },
    });
  }
}
