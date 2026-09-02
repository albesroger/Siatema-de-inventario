import { prisma } from "../config/database.js";

interface CrearProductoDTO {
  categoriaId: string;
  codigo: string;
  codigoBarras?: string;
  nombre: string;
  descripcion?: string;
  unidadMedida: string;
  precioCompra: number;
  precioVenta: number;
  stockMinimo?: number;
  stockMaximo?: number;
}

export class ProductoService {
  // ========================================================
  // CREAR PRODUCTO
  // ========================================================

  async crear(data: CrearProductoDTO, negocioId: string) {
    // =========================================
    // 1. VALIDAR NEGOCIO
    // =========================================

    const negocio = await prisma.negocio.findUnique({
      where: {
        id: negocioId,
      },
    });

    if (!negocio) {
      throw new Error("El negocio no existe");
    }

    // =========================================
    // 2. VALIDAR CATEGORÍA
    // =========================================

    const categoria = await prisma.categoria.findFirst({
      where: {
        id: data.categoriaId,
        negocioId,
        estado: "ACTIVO",
      },
    });

    if (!categoria) {
      throw new Error(
        "La categoría no existe, está inactiva o no pertenece al negocio",
      );
    }

    // =========================================
    // 3. VALIDAR CÓDIGO DUPLICADO
    // =========================================

    const productoExistente = await prisma.producto.findFirst({
      where: {
        negocioId,
        codigo: data.codigo,
      },
    });

    if (productoExistente) {
      throw new Error("Ya existe un producto con ese código en este negocio");
    }

    // =========================================
    // 4. CREAR PRODUCTO
    // =========================================

    return prisma.producto.create({
      data: {
        negocioId,

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

  // ========================================================
  // OBTENER TODOS
  // ========================================================

  async obtenerTodos(negocioId: string) {
    return prisma.producto.findMany({
      where: {
        negocioId,
        //estado: "ACTIVO",
      },

      include: {
        categoria: true,
      },

      orderBy: {
        nombre: "asc",
      },
    });
  }

  // ========================================================
  // OBTENER POR ID
  // ========================================================

  async obtenerPorId(negocioId: string, id: string) {
    return prisma.producto.findFirst({
      where: {
        id,
        negocioId,
        estado: "ACTIVO",
      },
      include: {
        categoria: true,
      },
    });
  }

  // ========================================================
  // ACTUALIZAR
  // ========================================================

  async actualizar(
    negocioId: string,
    id: string,
    data: Partial<CrearProductoDTO>,
  ) {
    // =========================================
    // 1. BUSCAR PRODUCTO
    // =========================================

    const producto = await prisma.producto.findFirst({
      where: {
        id,
        negocioId,
      },
    });

    if (!producto) {
      throw new Error("Producto no encontrado");
    }

    // =========================================
    // 2. VALIDAR CATEGORÍA SI VIENE
    // =========================================

    if (data.categoriaId) {
      const categoria = await prisma.categoria.findFirst({
        where: {
          id: data.categoriaId,
          negocioId,
          estado: "ACTIVO",
        },
      });

      if (!categoria) {
        throw new Error(
          "La categoría no existe, está inactiva o no pertenece al negocio",
        );
      }
    }

    // =========================================
    // 3. VALIDAR CÓDIGO SI VIENE
    // =========================================

    if (data.codigo && data.codigo !== producto.codigo) {
      const productoExistente = await prisma.producto.findFirst({
        where: {
          negocioId,
          codigo: data.codigo,
          NOT: {
            id,
          },
        },
      });

      if (productoExistente) {
        throw new Error(
          "Ya existe otro producto con ese código en este negocio",
        );
      }
    }

    // =========================================
    // 4. ACTUALIZAR
    // =========================================

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

  // ========================================================
  // ELIMINAR
  // ========================================================

  async eliminar(negocioId: string, id: string) {
    // =========================================
    // 1. BUSCAR PRODUCTO
    // =========================================

    const producto = await prisma.producto.findFirst({
      where: {
        id,
        negocioId,
      },
    });

    if (!producto) {
      throw new Error("Producto no encontrado");
    }

    // =========================================
    // 2. ELIMINAR LÓGICAMENTE
    // =========================================

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
