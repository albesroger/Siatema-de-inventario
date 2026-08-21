import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/database.js";
import { transaccionSerializada } from "../utils/transaccion.js";

interface DetalleEntradaDTO {
  productoId: string;
  cantidad: number;
  costoUnitario: number;
  descuento: number;
}

interface CrearEntradaDTO {
  proveedorId?: string;
  dispositivoId: string;
  numeroDocumento?: string;
  descuento: number;
  observaciones?: string;
  detalles: DetalleEntradaDTO[];
}

export class EntradaService {
  async crear(data: CrearEntradaDTO, usuarioId: string, negocioId: string) {
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
      // 4. VALIDAR PROVEEDOR
      // =========================================

      if (data.proveedorId) {
        const proveedor = await tx.proveedor.findFirst({
          where: {
            id: data.proveedorId,
            negocioId,
            estado: "ACTIVO",
          },
        });

        if (!proveedor) {
          throw new Error("El proveedor no existe o no pertenece al negocio");
        }
      }

      // =========================================
      // 5. GENERAR NÚMERO DE ENTRADA
      // =========================================

      const ultimaEntrada = await tx.entrada_inventario.findFirst({
        where: {
          negocioId,
        },
        orderBy: {
          numero: "desc",
        },
      });

      const numero = ultimaEntrada
        ? ultimaEntrada.numero + BigInt(1)
        : BigInt(1);

      // =========================================
      // 6. VALIDAR PRODUCTOS
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
      // 7. CALCULAR TOTALES
      // =========================================

      let subtotal = new Prisma.Decimal(0);

      const detallesCalculados = data.detalles.map((detalle) => {
        const subtotalDetalle = new Prisma.Decimal(detalle.cantidad)
          .mul(detalle.costoUnitario)
          .sub(detalle.descuento);

        if (subtotalDetalle.lessThan(0)) {
          throw new Error(
            "El descuento de un detalle no puede superar su subtotal",
          );
        }

        subtotal = subtotal.add(subtotalDetalle);

        return {
          ...detalle,
          subtotal: subtotalDetalle,
        };
      });

      const descuentoGeneral = new Prisma.Decimal(data.descuento);

      const total = subtotal.sub(descuentoGeneral);

      if (total.lessThan(0)) {
        throw new Error("El descuento general no puede superar el subtotal");
      }

      // =========================================
      // 8. CREAR ENTRADA
      // =========================================

      const entrada = await tx.entrada_inventario.create({
        data: {
          negocioId,
          proveedorId: data.proveedorId,
          usuarioId,
          dispositivoId: data.dispositivoId,

          numero,

          numeroDocumento: data.numeroDocumento,

          subtotal,
          descuento: descuentoGeneral,
          total,

          observaciones: data.observaciones,

          estado: "COMPLETADA",
        },
      });

      // =========================================
      // 9. PROCESAR CADA PRODUCTO
      // =========================================

      for (const detalle of detallesCalculados) {
        const producto = await tx.producto.findUnique({
          where: {
            id: detalle.productoId,
          },
        });

        if (!producto) {
          throw new Error(`Producto ${detalle.productoId} no encontrado`);
        }

        const cantidad = new Prisma.Decimal(detalle.cantidad);

        const stockAnterior = producto.stockActual;

        const stockPosterior = stockAnterior.add(cantidad);

        // =====================================
        // 10. CREAR DETALLE
        // =====================================

        await tx.detalle_entrada.create({
          data: {
            entradaId: entrada.id,
            productoId: detalle.productoId,

            cantidad,

            costoUnitario: detalle.costoUnitario,

            descuento: detalle.descuento,

            subtotal: detalle.subtotal,
          },
        });

        // =====================================
        // 11. ACTUALIZAR STOCK (atómico)
        // =====================================

        await tx.producto.update({
          where: {
            id: detalle.productoId,
          },
          data: {
            stockActual: { increment: cantidad },
            precioCompra: detalle.costoUnitario,
          },
        });

        // =====================================
        // 12. REGISTRAR MOVIMIENTO
        // =====================================

        await tx.movimiento_inventario.create({
          data: {
            negocioId,

            productoId: detalle.productoId,

            usuarioId,

            dispositivoId: data.dispositivoId,

            tipo: "ENTRADA",

            cantidad: detalle.cantidad,

            stockAnterior,
            stockPosterior,

            referenciaTipo: "ENTRADA",

            referenciaId: entrada.id,

            motivo: "Entrada de inventario",
          },
        });
      }

      // =========================================
      // 13. DEVOLVER ENTRADA COMPLETA
      // =========================================

      return tx.entrada_inventario.findUnique({
        where: {
          id: entrada.id,
        },
        include: {
          proveedor: true,

          detalles: {
            include: {
              producto: true,
            },
          },
        },
      });
    });
  }

  async listar(negocioId: string) {
    return prisma.entrada_inventario.findMany({
      where: {
        negocioId,
      },
      orderBy: {
        numero: "desc",
      },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
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

  async obtenerPorId(negocioId: string, id: string) {
    const entrada = await prisma.entrada_inventario.findFirst({
      where: {
        id,
        negocioId,
      },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            email: true,
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

    if (!entrada) {
      throw new Error("La entrada no existe");
    }

    return entrada;
  }

  async anular(
    entradaId: string,
    usuarioId: string,
    negocioId: string,
    dispositivoId: string,
  ) {
    return transaccionSerializada(async (tx) => {
      // =========================================
      // 1. BUSCAR LA ENTRADA
      // =========================================

      const entrada = await tx.entrada_inventario.findFirst({
        where: {
          id: entradaId,
          negocioId,
        },
        include: {
          detalles: true,
        },
      });

      if (!entrada) {
        throw new Error("La entrada no existe");
      }

      // =========================================
      // 2. VALIDAR ESTADO
      // =========================================

      if (entrada.estado !== "COMPLETADA") {
        throw new Error("La entrada ya está anulada");
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
      // 5. PROCESAR PRODUCTOS
      // =========================================

      for (const detalle of entrada.detalles) {
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

        const stockPosterior = stockAnterior.sub(cantidad);

        // =======================================
        // 6. EVITAR STOCK NEGATIVO (atómico)
        // =======================================

        if (stockPosterior.lessThan(0)) {
          throw new Error(
            `No se puede anular la entrada porque el producto ${producto.nombre} ya no tiene suficiente stock`,
          );
        }

        // =======================================
        // 7. ACTUALIZAR STOCK
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
            `No se puede anular la entrada porque el producto ${producto.nombre} ya no tiene suficiente stock`,
          );
        }

        // =======================================
        // 8. CREAR MOVIMIENTO INVERSO
        // =======================================

        await tx.movimiento_inventario.create({
          data: {
            negocioId,

            productoId: producto.id,

            usuarioId,

            dispositivoId,

            tipo: "SALIDA",

            cantidad,

            stockAnterior,
            stockPosterior,

            referenciaTipo: "ENTRADA",

            referenciaId: entrada.id,

            motivo: `Anulación de entrada #${entrada.numero.toString()}`,
          },
        });
      }

      // =========================================
      // 9. CAMBIAR ESTADO
      // =========================================

      const entradaAnulada = await tx.entrada_inventario.update({
        where: {
          id: entrada.id,
        },
        data: {
          estado: "ANULADA",
        },
        include: {
          proveedor: true,

          detalles: {
            include: {
              producto: true,
            },
          },
        },
      });

      return entradaAnulada;
    });
  }
}
