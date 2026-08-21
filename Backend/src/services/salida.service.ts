import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/database.js";
import { transaccionSerializada } from "../utils/transaccion.js";

interface DetalleSalidaDTO {
  productoId: string;
  cantidad: number;
  observaciones?: string;
}

interface CrearSalidaDTO {
  dispositivoId: string;

  motivo:
    | "PRODUCTO_DANADO"
    | "PRODUCTO_VENCIDO"
    | "CONSUMO_INTERNO"
    | "PERDIDA"
    | "ROBO"
    | "MUESTRA"
    | "OTRO";

  observaciones?: string;

  detalles: DetalleSalidaDTO[];
}

export class SalidaService {
  // ========================================================
  // CREAR SALIDA
  // ========================================================

  async crear(
    data: Omit<CrearSalidaDTO, "negocioId" | "usuarioId">,
    negocioId: string,
    usuarioId: string,
  ) {
    return transaccionSerializada(async (tx) => {
      // =========================================
      // 1. VALIDAR NEGOCIO
      // =========================================

      const negocio = await tx.negocio.findUnique({
        where: {
          id: negocioId,
        },
      });

      if (!negocio) {
        throw new Error("El negocio no existe");
      }

      // =========================================
      // 2. VALIDAR USUARIO
      // =========================================

      const usuario = await tx.usuario.findFirst({
        where: {
          id: usuarioId,
          negocioId,
          estado: "ACTIVO",
        },
      });

      if (!usuario) {
        throw new Error(
          "El usuario no existe, está inactivo o no pertenece al negocio",
        );
      }

      // =========================================
      // 3. VALIDAR DISPOSITIVO
      // =========================================

      const dispositivo = await tx.dispositivo.findFirst({
        where: {
          id: data.dispositivoId,
          negocioId,
          estado: "ACTIVO",
        },
      });

      if (!dispositivo) {
        throw new Error(
          "El dispositivo no existe, está inactivo o no pertenece al negocio",
        );
      }

      // =========================================
      // 4. GENERAR NÚMERO
      // =========================================

      const ultimaSalida = await tx.salida_inventario.findFirst({
        where: {
          negocioId,
        },
        orderBy: {
          numero: "desc",
        },
      });

      const numero = ultimaSalida ? ultimaSalida.numero + BigInt(1) : BigInt(1);

      // =========================================
      // 5. VALIDAR PRODUCTOS
      // =========================================

      const productoIds = data.detalles.map((detalle) => detalle.productoId);

      const productos = await tx.producto.findMany({
        where: {
          id: {
            in: productoIds,
          },
          negocioId,
          estado: "ACTIVO",
        },
      });

      if (productos.length !== new Set(productoIds).size) {
        throw new Error(
          "Uno o más productos no existen o no pertenecen al negocio",
        );
      }

      // =========================================
      // 6. VALIDAR STOCK
      // =========================================

      for (const detalle of data.detalles) {
        const producto = productos.find((p) => p.id === detalle.productoId);

        if (!producto) {
          throw new Error("Producto no encontrado");
        }

        const cantidad = new Prisma.Decimal(detalle.cantidad);

        if (cantidad.greaterThan(producto.stockActual)) {
          throw new Error(
            `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockActual.toString()}`,
          );
        }
      }

      // =========================================
      // 7. CREAR SALIDA
      // =========================================

      const salida = await tx.salida_inventario.create({
        data: {
          negocioId,

          usuarioId,

          dispositivoId: data.dispositivoId,

          numero,

          motivo: data.motivo as any,

          observaciones: data.observaciones,

          estado: "COMPLETADA",
        },
      });

      // =========================================
      // 8. PROCESAR PRODUCTOS
      // =========================================

      for (const detalle of data.detalles) {
        const producto = await tx.producto.findUnique({
          where: {
            id: detalle.productoId,
          },
        });

        if (!producto) {
          throw new Error(`Producto ${detalle.productoId} no encontrado`);
        }

        const stockAnterior = producto.stockActual;

        const cantidad = new Prisma.Decimal(detalle.cantidad);

        const stockPosterior = stockAnterior.sub(cantidad);

        // =======================================
        // 9. CREAR DETALLE
        // =======================================

        await tx.detalle_salida.create({
          data: {
            salidaId: salida.id,

            productoId: detalle.productoId,

            cantidad,

            observaciones: detalle.observaciones,
          },
        });

        // =======================================
        // 10. ACTUALIZAR STOCK (atómico y condicional)
        // =======================================

        const actualizado = await tx.producto.updateMany({
          where: {
            id: producto.id,
            stockActual: { gte: cantidad },
          },
          data: {
            stockActual: { decrement: cantidad },
          },
        });

        if (actualizado.count === 0) {
          throw new Error(
            `Stock insuficiente para ${producto.nombre}. Disponible: ${stockAnterior.toString()}`,
          );
        }

        // =======================================
        // 11. REGISTRAR MOVIMIENTO
        // =======================================

        await tx.movimiento_inventario.create({
          data: {
            negocioId,

            productoId: producto.id,

            usuarioId,

            dispositivoId: data.dispositivoId,

            tipo: "SALIDA",

            cantidad,

            stockAnterior,

            stockPosterior,

            referenciaTipo: "SALIDA",

            referenciaId: salida.id,

            motivo: data.motivo,
          },
        });
      }

      // =========================================
      // 12. DEVOLVER SALIDA
      // =========================================

      return tx.salida_inventario.findUnique({
        where: {
          id: salida.id,
        },
        include: {
          detalles: {
            include: {
              producto: true,
            },
          },
          usuario: true,
          dispositivo: true,
        },
      });
    });
  }

  // ========================================================
  // LISTAR
  // ========================================================

  async listar(negocioId: string) {
    return prisma.salida_inventario.findMany({
      where: {
        negocioId,
      },

      orderBy: {
        numero: "desc",
      },

      include: {
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

        detalles: {
          include: {
            producto: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
              },
            },
          },
        },
      },
    });
  }

  // ========================================================
  // OBTENER POR ID
  // ========================================================

  async obtenerPorId(negocioId: string, id: string) {
    const salida = await prisma.salida_inventario.findFirst({
      where: {
        id,
        negocioId,
      },

      include: {
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

        detalles: {
          include: {
            producto: {
              select: {
                id: true,
                codigo: true,
                codigoBarras: true,
                nombre: true,
                unidadMedida: true,
              },
            },
          },
        },
      },
    });

    if (!salida) {
      throw new Error("La salida no existe");
    }

    return salida;
  }

  // ========================================================
  // ANULAR
  // ========================================================

  async anular(
    negocioId: string,
    salidaId: string,
    usuarioId: string,
    dispositivoId: string,
  ) {
    return transaccionSerializada(async (tx) => {
      // =========================================
      // 1. BUSCAR SALIDA
      // =========================================

      const salida = await tx.salida_inventario.findFirst({
        where: {
          id: salidaId,
          negocioId,
        },

        include: {
          detalles: true,
        },
      });

      if (!salida) {
        throw new Error("La salida no existe");
      }

      // =========================================
      // 2. VALIDAR ESTADO
      // =========================================

      if (salida.estado !== "COMPLETADA") {
        throw new Error("La salida ya está anulada");
      }

      // =========================================
      // 3. VALIDAR USUARIO
      // =========================================

      const usuario = await tx.usuario.findFirst({
        where: {
          id: usuarioId,
          negocioId,
          estado: "ACTIVO",
        },
      });

      if (!usuario) {
        throw new Error(
          "El usuario no existe, está inactivo o no pertenece al negocio",
        );
      }

      // =========================================
      // 4. VALIDAR DISPOSITIVO
      // =========================================

      const dispositivo = await tx.dispositivo.findFirst({
        where: {
          id: dispositivoId,
          negocioId,
          estado: "ACTIVO",
        },
      });

      if (!dispositivo) {
        throw new Error(
          "El dispositivo no existe, está inactivo o no pertenece al negocio",
        );
      }

      // =========================================
      // 5. PROCESAR DETALLES
      // =========================================

      for (const detalle of salida.detalles) {
        const producto = await tx.producto.findUnique({
          where: {
            id: detalle.productoId,
          },
        });

        if (!producto) {
          throw new Error(`El producto ${detalle.productoId} no existe`);
        }

        const stockAnterior = producto.stockActual;

        const cantidad = detalle.cantidad;

        const stockPosterior = stockAnterior.add(cantidad);

        // =======================================
        // 6. ACTUALIZAR STOCK (atómico)
        // =======================================

        await tx.producto.update({
          where: {
            id: producto.id,
          },

          data: {
            stockActual: { increment: cantidad },
          },
        });

        // =======================================
        // 7. CREAR MOVIMIENTO INVERSO
        // =======================================

        await tx.movimiento_inventario.create({
          data: {
            negocioId,

            productoId: producto.id,

            usuarioId,

            dispositivoId,

            tipo: "ENTRADA",

            cantidad,

            stockAnterior,

            stockPosterior,

            referenciaTipo: "SALIDA",

            referenciaId: salida.id,

            motivo: `Anulación de salida #${salida.numero.toString()}`,
          },
        });
      }

      // =========================================
      // 8. CAMBIAR ESTADO
      // =========================================

      return tx.salida_inventario.update({
        where: {
          id: salida.id,
        },

        data: {
          estado: "ANULADA",
        },

        include: {
          detalles: {
            include: {
              producto: true,
            },
          },
        },
      });
    });
  }
}
