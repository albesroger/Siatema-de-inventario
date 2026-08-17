import { prisma } from "../config/database.js";

export class MovimientoService {
  async listar(negocioId: string) {
    const movimientos = await prisma.movimiento_inventario.findMany({
      where: { negocioId },
      include: {
        producto: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            unidadMedida: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            username: true,
          },
        },
        dispositivo: {
          select: {
            id: true,
            nombre: true,
            identificador: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return movimientos;
  }
}
