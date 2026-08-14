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
    const negocio = await prisma.negocio.findUnique({
      where: {
        id: data.negocioId,
      },
    });

    if (!negocio) {
      throw new Error("El negocio no existe");
    }

    const categoria = await prisma.categoria.findFirst({
      where: {
        id: data.categoriaId,
        negocioId: data.negocioId,
      },
    });

    if (!categoria) {
      throw new Error("La categoría no existe o no pertenece al negocio");
    }

    const productoExistente = await prisma.producto.findFirst({
      where: {
        negocioId: data.negocioId,
        codigo: data.codigo,
      },
    });

    if (productoExistente) {
      throw new Error("Ya existe un producto con ese código en este negocio");
    }

    return prisma.producto.create({
      data: {
        negocioId: data.negocioId,
        categoriaId: data.categoriaId,
        codigo: data.codigo,
        codigoBarras: data.codigoBarras,
        nombre: data.nombre,
        descripcion: data.descripcion,
        unidadMedida: data.unidadMedida,
        precioCompra: data.precioCompra,
        precioVenta: data.precioVenta,
        stockActual: 0,
        stockMinimo: data.stockMinimo ?? 0,
        stockMaximo: data.stockMaximo,
      },
    });
  }

  async obtenerTodos(negocioId: string) {
    return prisma.producto.findMany({
      where: {
        negocioId: negocioId,
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
        negocioId: negocioId,
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
        negocioId: negocioId,
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
        categoriaId: data.categoriaId,
        codigo: data.codigo,
        codigoBarras: data.codigoBarras,
        nombre: data.nombre,
        descripcion: data.descripcion,
        unidadMedida: data.unidadMedida,
        precioCompra: data.precioCompra,
        precioVenta: data.precioVenta,
        stockMinimo: data.stockMinimo,
        stockMaximo: data.stockMaximo,
      },
    });
  }

  async eliminar(negocioId: string, id: string) {
    const producto = await prisma.producto.findFirst({
      where: {
        id,
        negocioId: negocioId,
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
