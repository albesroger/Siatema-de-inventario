import { prisma } from "../config/database.js";

interface CrearDispositivoDTO {
  nombre: string;
  identificador: string;
  tipo: "DESKTOP" | "LAPTOP" | "TABLET";
  estado?: "ACTIVO" | "BLOQUEADO";
}

interface ActualizarDispositivoDTO {
  nombre?: string;
  identificador?: string;
  tipo?: "DESKTOP" | "LAPTOP" | "TABLET";
  estado?: "ACTIVO" | "BLOQUEADO";
}

export class DispositivoService {
  async crear(data: CrearDispositivoDTO, negocioId: string) {
    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
    });

    if (!negocio) {
      throw new Error("El negocio no existe");
    }

    return prisma.dispositivo.create({
      data: {
        negocioId,
        nombre: data.nombre,
        identificador: data.identificador,
        tipo: data.tipo,
        estado: data.estado ?? "ACTIVO",
      },
    });
  }

  async obtenerTodos(negocioId: string) {
    return prisma.dispositivo.findMany({
      where: { negocioId },
      orderBy: { nombre: "asc" },
    });
  }

  async obtenerPorId(negocioId: string, id: string) {
    return prisma.dispositivo.findFirst({
      where: { id, negocioId },
    });
  }

  async actualizar(
    negocioId: string,
    id: string,
    data: ActualizarDispositivoDTO,
  ) {
    const dispositivo = await prisma.dispositivo.findFirst({
      where: { id, negocioId },
    });

    if (!dispositivo) {
      throw new Error("El dispositivo no existe");
    }

    return prisma.dispositivo.update({
      where: { id },
      data: {
        nombre: data.nombre,
        identificador: data.identificador,
        tipo: data.tipo,
        estado: data.estado,
      },
    });
  }

  async eliminar(negocioId: string, id: string) {
    const dispositivo = await prisma.dispositivo.findFirst({
      where: { id, negocioId },
    });

    if (!dispositivo) {
      throw new Error("El dispositivo no existe");
    }

    return prisma.dispositivo.update({
      where: { id },
      data: { estado: "BLOQUEADO" },
    });
  }
}
