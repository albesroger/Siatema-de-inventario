import { prisma } from "../config/database.js";

interface CrearCategoriaDTO {
  negocioId: string;
  nombre: string;
  descripcion?: string;
}

interface ActualizarCategoriaDTO {
  nombre?: string;
  descripcion?: string;
}

export class CategoriaService {
  async crear(data: CrearCategoriaDTO) {
    // 1. Comprobar que el negocio existe
    const negocio = await prisma.negocio.findUnique({
      where: {
        id: data.negocioId,
      },
    });

    if (!negocio) {
      throw new Error("El negocio no existe");
    }

    // 2. Comprobar que no exista otra categoría
    // con el mismo nombre dentro del negocio
    const categoriaExistente = await prisma.categoria.findFirst({
      where: {
        negocioId: data.negocioId,
        nombre: data.nombre,
      },
    });

    if (categoriaExistente) {
      throw new Error("Ya existe una categoría con ese nombre en este negocio");
    }

    // 3. Crear categoría
    return prisma.categoria.create({
      data: {
        negocioId: data.negocioId,
        nombre: data.nombre,
        descripcion: data.descripcion,
      },
    });
  }

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

  async obtenerPorId(negocioId: string, id: string) {
    return prisma.categoria.findFirst({
      where: {
        id,
        negocioId,
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

  async actualizar(
    negocioId: string,
    id: string,
    data: ActualizarCategoriaDTO,
  ) {
    // 1. Buscar categoría
    const categoria = await prisma.categoria.findFirst({
      where: {
        id,
        negocioId,
      },
    });

    if (!categoria) {
      throw new Error("La categoría no existe");
    }

    // 2. Si se está cambiando el nombre,
    // comprobar duplicados
    if (data.nombre && data.nombre !== categoria.nombre) {
      const categoriaExistente = await prisma.categoria.findFirst({
        where: {
          negocioId,
          nombre: data.nombre,
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

    // 3. Actualizar
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

  async eliminar(negocioId: string, id: string) {
    // 1. Buscar categoría
    const categoria = await prisma.categoria.findFirst({
      where: {
        id,
        negocioId,
      },
    });

    if (!categoria) {
      throw new Error("La categoría no existe");
    }

    // 2. Verificar si tiene productos
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

    // 3. Eliminación lógica
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
