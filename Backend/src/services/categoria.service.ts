import { prisma } from "../config/database.js";

interface CrearCategoriaDTO {
  nombre: string;
  descripcion?: string;
}

interface ActualizarCategoriaDTO {
  nombre?: string;
  descripcion?: string;
}

export class CategoriaService {
  // ========================================================
  // CREAR CATEGORÍA
  // ========================================================

  async crear(data: CrearCategoriaDTO, negocioId: string) {
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
    // 2. VALIDAR NOMBRE DUPLICADO
    // =========================================

    const categoriaExistente = await prisma.categoria.findFirst({
      where: {
        negocioId,
        nombre: data.nombre,
        estado: "ACTIVO",
      },
    });

    if (categoriaExistente) {
      throw new Error("Ya existe una categoría con ese nombre en este negocio");
    }

    // =========================================
    // 3. CREAR CATEGORÍA
    // =========================================

    return prisma.categoria.create({
      data: {
        negocioId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        estado: "ACTIVO",
      },
    });
  }

  // ========================================================
  // OBTENER TODAS
  // ========================================================

  async obtenerTodos(negocioId: string) {
    return prisma.categoria.findMany({
      where: {
        negocioId,
        estado: "ACTIVO",
      },

      include: {
        _count: {
          select: {
            productos: true,
          },
        },
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
    return prisma.categoria.findFirst({
      where: {
        id,
        negocioId,
        estado: "ACTIVO",
      },

      include: {
        _count: {
          select: {
            productos: true,
          },
        },
      },
    });
  }

  // ========================================================
  // ACTUALIZAR
  // ========================================================

  async actualizar(
    negocioId: string,
    id: string,
    data: ActualizarCategoriaDTO,
  ) {
    // =========================================
    // 1. BUSCAR CATEGORÍA ACTIVA
    // =========================================

    const categoria = await prisma.categoria.findFirst({
      where: {
        id,
        negocioId,
        estado: "ACTIVO",
      },
    });

    if (!categoria) {
      throw new Error("La categoría no existe");
    }

    // =========================================
    // 2. VALIDAR NOMBRE DUPLICADO
    // =========================================

    if (data.nombre && data.nombre !== categoria.nombre) {
      const categoriaExistente = await prisma.categoria.findFirst({
        where: {
          negocioId,
          nombre: data.nombre,
          estado: "ACTIVO",
          NOT: {
            id,
          },
        },
      });

      if (categoriaExistente) {
        throw new Error(
          "Ya existe una categoría con ese nombre en este negocio",
        );
      }
    }

    // =========================================
    // 3. ACTUALIZAR
    // =========================================

    return prisma.categoria.update({
      where: {
        id,
      },

      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
      },
    });
  }

  // ========================================================
  // ELIMINAR
  // ========================================================

  async eliminar(negocioId: string, id: string) {
    // =========================================
    // 1. BUSCAR CATEGORÍA ACTIVA
    // =========================================

    const categoria = await prisma.categoria.findFirst({
      where: {
        id,
        negocioId,
        estado: "ACTIVO",
      },
    });

    if (!categoria) {
      throw new Error("La categoría no existe");
    }

    // =========================================
    // 2. VERIFICAR PRODUCTOS ACTIVOS
    // =========================================

    const cantidadProductos = await prisma.producto.count({
      where: {
        categoriaId: id,
        estado: "ACTIVO",
      },
    });

    if (cantidadProductos > 0) {
      throw new Error(
        "No se puede eliminar la categoría porque tiene productos asociados",
      );
    }

    // =========================================
    // 3. ELIMINACIÓN LÓGICA
    // =========================================

    return prisma.categoria.update({
      where: {
        id,
      },

      data: {
        estado: "INACTIVO",
      },
    });
  }
}
