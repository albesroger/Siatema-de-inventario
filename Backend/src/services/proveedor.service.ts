import { prisma } from "../config/database.js";

interface CrearProveedorDTO {
  nombre: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  identificacion?: string;
  observaciones?: string;
}

interface ActualizarProveedorDTO {
  nombre?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  identificacion?: string;
  observaciones?: string;
}

export class ProveedorService {
  // ========================================================
  // CREAR PROVEEDOR
  // ========================================================

  async crear(data: CrearProveedorDTO, negocioId: string) {
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
    // 2. CREAR PROVEEDOR
    // =========================================

    return prisma.proveedor.create({
      data: {
        negocioId,

        nombre: data.nombre,

        telefono: data.telefono,

        direccion: data.direccion,

        email: data.email,

        identificacion: data.identificacion,

        observaciones: data.observaciones,
      },
    });
  }

  // ========================================================
  // OBTENER TODOS
  // ========================================================

  async obtenerTodos(negocioId: string) {
    return prisma.proveedor.findMany({
      where: {
        negocioId,
        estado: "ACTIVO",
      },

      include: {
        _count: {
          select: {
            entradas: true,
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
    return prisma.proveedor.findFirst({
      where: {
        id,
        negocioId,
      },

      include: {
        _count: {
          select: {
            entradas: true,
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
    data: ActualizarProveedorDTO,
  ) {
    // =========================================
    // 1. BUSCAR PROVEEDOR
    // =========================================

    const proveedor = await prisma.proveedor.findFirst({
      where: {
        id,
        negocioId,
      },
    });

    if (!proveedor) {
      throw new Error("El proveedor no existe");
    }

    // =========================================
    // 2. ACTUALIZAR
    // =========================================

    return prisma.proveedor.update({
      where: {
        id,
      },

      data: {
        nombre: data.nombre,

        telefono: data.telefono,

        direccion: data.direccion,

        email: data.email,

        identificacion: data.identificacion,

        observaciones: data.observaciones,
      },
    });
  }

  // ========================================================
  // ELIMINAR
  // ========================================================

  async eliminar(negocioId: string, id: string) {
    // =========================================
    // 1. BUSCAR PROVEEDOR
    // =========================================

    const proveedor = await prisma.proveedor.findFirst({
      where: {
        id,
        negocioId,
      },
    });

    if (!proveedor) {
      throw new Error("El proveedor no existe");
    }

    // =========================================
    // 2. ELIMINACIÓN LÓGICA
    // =========================================

    return prisma.proveedor.update({
      where: {
        id,
      },

      data: {
        estado: "INACTIVO",
      },
    });
  }
}
