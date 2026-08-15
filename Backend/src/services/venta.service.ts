import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/database.js";

import { CrearVentaInput, AnularVentaInput } from "../schemas/venta.schema.js";

export class VentaService {
  async crearVenta(data: CrearVentaInput) {
    return prisma.$transaction(async (tx) => {
      // ========================================================
      // 1. VALIDAR USUARIO
      // ========================================================

      const usuario = await tx.usuario.findFirst({
        where: {
          id: data.usuarioId,
          negocioId: data.negocioId,
          estado: "ACTIVO",
        },
      });

      if (!usuario) {
        throw new Error(
          "El usuario no existe, no pertenece al negocio o está inactivo",
        );
      }

      // ========================================================
      // 2. VALIDAR DISPOSITIVO
      // ========================================================

      const dispositivo = await tx.dispositivo.findFirst({
        where: {
          id: data.dispositivoId,
          negocioId: data.negocioId,
          estado: "ACTIVO",
        },
      });

      if (!dispositivo) {
        throw new Error(
          "El dispositivo no existe, no pertenece al negocio o está inactivo",
        );
      }

      // ========================================================
      // 3. VALIDAR QUE NO HAYA PRODUCTOS REPETIDOS
      // ========================================================

      const productosIds = data.detalles.map((detalle) => detalle.productoId);

      const productosUnicos = new Set(productosIds);

      if (productosUnicos.size !== productosIds.length) {
        throw new Error(
          "No se puede incluir el mismo producto más de una vez en la venta",
        );
      }

      // ========================================================
      // 4. OBTENER PRODUCTOS
      // ========================================================

      const productos = await tx.producto.findMany({
        where: {
          id: {
            in: productosIds,
          },
          negocioId: data.negocioId,
          estado: "ACTIVO",
        },
      });

      // ========================================================
      // 5. VALIDAR QUE TODOS LOS PRODUCTOS EXISTAN
      // ========================================================

      if (productos.length !== productosIds.length) {
        throw new Error(
          "Uno o más productos no existen, no pertenecen al negocio o están inactivos",
        );
      }

      // ========================================================
      // 6. CALCULAR DETALLES
      // ========================================================

      const detallesCalculados = data.detalles.map((detalle) => {
        const producto = productos.find((p) => p.id === detalle.productoId);

        if (!producto) {
          throw new Error(`No se encontró el producto ${detalle.productoId}`);
        }

        const cantidad = new Prisma.Decimal(detalle.cantidad);

        const precioUnitario = producto.precioVenta;

        const descuento = new Prisma.Decimal(detalle.descuento ?? 0);

        // cantidad × precio
        const importe = cantidad.mul(precioUnitario);

        // importe - descuento
        const subtotal = importe.sub(descuento);

        if (subtotal.lessThan(0)) {
          throw new Error(
            `El descuento del producto "${producto.nombre}" no puede ser mayor que su importe`,
          );
        }

        // ======================================================
        // VALIDAR STOCK
        // ======================================================

        if (producto.stockActual.lessThan(cantidad)) {
          throw new Error(
            `Stock insuficiente para "${producto.nombre}". Stock disponible: ${producto.stockActual.toString()}`,
          );
        }

        return {
          producto,
          cantidad,
          precioUnitario,
          descuento,
          subtotal,
        };
      });

      // ========================================================
      // 7. CALCULAR SUBTOTAL GENERAL
      // ========================================================

      const subtotal = detallesCalculados.reduce(
        (total, detalle) => total.add(detalle.subtotal),
        new Prisma.Decimal(0),
      );

      // ========================================================
      // 8. DESCUENTO GENERAL
      // ========================================================

      const descuento = new Prisma.Decimal(data.descuento ?? 0);

      if (descuento.greaterThan(subtotal)) {
        throw new Error(
          "El descuento general no puede ser mayor que el subtotal",
        );
      }

      // ========================================================
      // 9. IMPUESTO
      // ========================================================

      const impuesto = new Prisma.Decimal(data.impuesto ?? 0);

      // ========================================================
      // 10. TOTAL
      // ========================================================

      const total = subtotal.sub(descuento).add(impuesto);

      // ========================================================
      // 11. GENERAR NÚMERO DE VENTA
      // ========================================================

      const ultimaVenta = await tx.venta.findFirst({
        where: {
          negocioId: data.negocioId,
        },
        orderBy: {
          numero: "desc",
        },
        select: {
          numero: true,
        },
      });

      const numero = ultimaVenta ? ultimaVenta.numero + BigInt(1) : BigInt(1);

      // ========================================================
      // 12. CREAR VENTA
      // ========================================================

      const venta = await tx.venta.create({
        data: {
          negocioId: data.negocioId,
          usuarioId: data.usuarioId,
          dispositivoId: data.dispositivoId,

          numero,

          subtotal,
          descuento,
          impuesto,
          total,

          metodoPago: data.metodoPago,

          estado: "COMPLETADA",
        },
      });

      // ========================================================
      // 13. CREAR DETALLES + ACTUALIZAR STOCK
      // ========================================================

      for (const detalle of detallesCalculados) {
        const producto = detalle.producto;

        const stockAnterior = producto.stockActual;

        const stockPosterior = stockAnterior.sub(detalle.cantidad);

        // ------------------------------------------------------
        // CREAR DETALLE
        // ------------------------------------------------------

        await tx.detalle_venta.create({
          data: {
            ventaId: venta.id,
            productoId: producto.id,

            cantidad: detalle.cantidad,

            precioUnitario: detalle.precioUnitario,

            descuento: detalle.descuento,

            subtotal: detalle.subtotal,
          },
        });

        // ------------------------------------------------------
        // ACTUALIZAR STOCK
        // ------------------------------------------------------

        await tx.producto.update({
          where: {
            id: producto.id,
          },
          data: {
            stockActual: stockPosterior,
          },
        });

        // ------------------------------------------------------
        // REGISTRAR MOVIMIENTO
        // ------------------------------------------------------

        await tx.movimiento_inventario.create({
          data: {
            negocioId: data.negocioId,
            productoId: producto.id,
            usuarioId: data.usuarioId,
            dispositivoId: data.dispositivoId,

            tipo: "VENTA",

            cantidad: detalle.cantidad,

            stockAnterior,
            stockPosterior,

            referenciaTipo: "VENTA",
            referenciaId: venta.id,

            motivo: `Venta #${numero.toString()}`,
          },
        });
      }

      // ========================================================
      // 14. DEVOLVER VENTA
      // ========================================================

      return tx.venta.findUnique({
        where: {
          id: venta.id,
        },
        include: {
          detalleVenta: {
            include: {
              producto: true,
            },
          },
        },
      });
    });
  }
  async obtenerVentaPorId(id: string, negocioId: string) {
    const venta = await prisma.venta.findFirst({
      where: {
        id,
        negocioId,
      },
      include: {
        detalleVenta: {
          include: {
            producto: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                unidadMedida: true,
              },
            },
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
    });

    if (!venta) {
      throw new Error("Venta no encontrada");
    }

    return venta;
  }

  async listarVentas(negocioId: string) {
    const ventas = await prisma.venta.findMany({
      where: {
        negocioId,
      },
      include: {
        detalleVenta: {
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return ventas;
  }

  async anularVenta(ventaId: string, data: AnularVentaInput) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // ========================================================
      // 1. BUSCAR VENTA
      // ========================================================

      const venta = await tx.venta.findFirst({
        where: {
          id: ventaId,
          negocioId: data.negocioId,
        },
        include: {
          detalleVenta: true,
        },
      });

      if (!venta) {
        throw new Error("La venta no existe o no pertenece al negocio");
      }

      // ========================================================
      // 2. VALIDAR ESTADO
      // ========================================================

      if (venta.estado === "ANULADA") {
        throw new Error("La venta ya está anulada");
      }

      // ========================================================
      // 3. DEVOLVER STOCK
      // ========================================================

      for (const detalle of venta.detalleVenta) {
        const producto = await tx.producto.findUnique({
          where: {
            id: detalle.productoId,
          },
        });

        if (!producto) {
          throw new Error(`No se encontró el producto ${detalle.productoId}`);
        }

        const stockAnterior = producto.stockActual;

        const stockPosterior = stockAnterior.add(detalle.cantidad);

        await tx.producto.update({
          where: {
            id: producto.id,
          },
          data: {
            stockActual: stockPosterior,
          },
        });

        // ======================================================
        // REGISTRAR MOVIMIENTO INVERSO
        // ======================================================

        await tx.movimiento_inventario.create({
          data: {
            negocioId: venta.negocioId,
            productoId: producto.id,
            usuarioId: data.usuarioId,
            dispositivoId: venta.dispositivoId,

            tipo: "ENTRADA",

            cantidad: detalle.cantidad,

            stockAnterior,
            stockPosterior,

            referenciaTipo: "VENTA",
            referenciaId: venta.id,

            motivo:
              data.motivo ?? `Anulación de venta #${venta.numero.toString()}`,
          },
        });
      }

      // ========================================================
      // 4. ANULAR VENTA
      // ========================================================

      return tx.venta.update({
        where: {
          id: venta.id,
        },
        data: {
          estado: "ANULADA",
        },
        include: {
          detalleVenta: {
            include: {
              producto: true,
            },
          },
        },
      });
    });
  }
}

export default new VentaService();
