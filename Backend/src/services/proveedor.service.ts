import { prisma } from "../config/database.js";

interface CrearProveedorDTO {
  negocioId: string;
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
  async crear(data: CrearProveedorDTO) {
    // Comprobar que el negocio existe
    const negocio = await prisma.negocio.findUnique({
      where: {
        id: data.negocioId,
      },
    });

    if (!negocio) {
      throw new Error("El negocio no existe");
    }

    return prisma.proveedor.create({
      data: {
        negocioId: data.negocioId,
        nombre: data.nombre,
        telefono: data.telefono,
        direccion: data.direccion,
        email: data.email,
        identificacion: data.identificacion,
        observaciones: data.observaciones,
      },
    });
  }

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

  async actualizar(
    negocioId: string,
    id: string,
    data: ActualizarProveedorDTO,
  ) {
    const proveedor = await prisma.proveedor.findFirst({
      where: {
        id,
        negocioId,
      },
    });

    if (!proveedor) {
      throw new Error("El proveedor no existe");
    }

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

  async eliminar(negocioId: string, id: string) {
    const proveedor = await prisma.proveedor.findFirst({
      where: {
        id,
        negocioId,
      },
    });

    if (!proveedor) {
      throw new Error("El proveedor no existe");
    }

    // No borramos físicamente el proveedor.
    // Lo dejamos inactivo para conservar
    // el historial de operaciones.
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
