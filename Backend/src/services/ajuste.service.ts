import { prisma } from "../config/database.js";

import { CrearAjusteDTO } from "../schemas/ajuste.schema.js";

export class AjusteService {
  // =====================================================
  // CREAR AJUSTE
  // =====================================================

  async crear(data: CrearAjusteDTO) {
    return prisma.$transaction(async (tx) => {
      // =================================================
      // 1. VALIDAR NEGOCIO
      // =================================================

      const negocio = await tx.negocio.findUnique({
        where: {
          id: data.negocioId,
        },
      });

      if (!negocio) {
        throw new Error("El negocio no existe");
      }

      // =================================================
      // 2. VALIDAR USUARIO
      // =================================================

      const usuario = await tx.usuario.findFirst({
        where: {
          id: data.usuarioId,
          negocioId: data.negocioId,
          estado: "ACTIVO",
        },
      });

      if (!usuario) {
        throw new Error(
          "El usuario no existe, está inactivo o no pertenece al negocio",
        );
      }

      // =================================================
      // 3. VALIDAR DISPOSITIVO
      // =================================================

      const dispositivo = await tx.dispositivo.findFirst({
        where: {
          id: data.dispositivoId,
          negocioId: data.negocioId,
          estado: "ACTIVO",
        },
      });

      if (!dispositivo) {
        throw new Error(
          "El dispositivo no existe, está inactivo o no pertenece al negocio",
        );
      }

      // =================================================
      // 4. GENERAR NUMERO
      // =================================================

      const ultimoAjuste = await tx.ajuste_inventario.findFirst({
        where: {
          negocioId: data.negocioId,
        },
        orderBy: {
          numero: "desc",
        },
      });

      const numero = ultimoAjuste ? ultimoAjuste.numero + BigInt(1) : BigInt(1);

      // =================================================
      // 5. VALIDAR PRODUCTOS
      // =================================================

      const productoIds = data.detalles.map((detalle) => detalle.productoId);

      const productos = await tx.producto.findMany({
        where: {
          id: {
            in: productoIds,
          },

          negocioId: data.negocioId,

          estado: "ACTIVO",
        },
      });

      if (productos.length !== productoIds.length) {
        throw new Error(
          "Uno o más productos no existen, están inactivos o no pertenecen al negocio",
        );
      }

      // =================================================
      // 6. CREAR CABECERA
      // =================================================

      const ajuste = await tx.ajuste_inventario.create({
        data: {
          negocioId: data.negocioId,

          usuarioId: data.usuarioId,

          dispositivoId: data.dispositivoId,

          numero,

          tipo: data.tipo,

          motivo: data.motivo,

          observaciones: data.observaciones,

          estado: "COMPLETADA",
        },
      });

      // =================================================
      // 7. PROCESAR DETALLES
      // =================================================

      for (const detalle of data.detalles) {
        const producto = productos.find((p) => p.id === detalle.productoId);

        if (!producto) {
          throw new Error("Producto no encontrado");
        }

        // ===============================================
        // STOCK ACTUAL
        // ===============================================

        const stockAnterior = Number(producto.stockActual);

        const cantidad = detalle.cantidad;

        // ===============================================
        // CALCULAR STOCK NUEVO
        // ===============================================

        let stockNuevo: number;

        if (data.tipo === "POSITIVO") {
          stockNuevo = stockAnterior + cantidad;
        } else {
          stockNuevo = stockAnterior - cantidad;

          // =============================================
          // NO PERMITIR STOCK NEGATIVO
          // =============================================

          if (stockNuevo < 0) {
            throw new Error(
              `Stock insuficiente para ${producto.nombre}. Stock actual: ${stockAnterior}`,
            );
          }
        }

        // ===============================================
        // CREAR DETALLE
        // ===============================================

        await tx.detalle_ajuste.create({
          data: {
            ajusteId: ajuste.id,

            productoId: producto.id,

            cantidad,

            stockAnterior,

            stockNuevo,

            observaciones: detalle.observaciones,
          },
        });

        // ===============================================
        // ACTUALIZAR PRODUCTO
        // ===============================================

        await tx.producto.update({
          where: {
            id: producto.id,
          },

          data: {
            stockActual: stockNuevo,
          },
        });

        // ===============================================
        // TIPO DE MOVIMIENTO
        // ===============================================

        const tipoMovimiento =
          data.tipo === "POSITIVO" ? "AJUSTE_POSITIVO" : "AJUSTE_NEGATIVO";

        // ===============================================
        // CREAR MOVIMIENTO
        // ===============================================

        await tx.movimiento_inventario.create({
          data: {
            negocioId: data.negocioId,

            productoId: producto.id,

            usuarioId: data.usuarioId,

            dispositivoId: data.dispositivoId,

            tipo: tipoMovimiento,

            cantidad,

            stockAnterior,

            stockPosterior: stockNuevo,

            referenciaTipo: "AJUSTE",

            referenciaId: ajuste.id,

            motivo: data.motivo,
          },
        });
      }

      // =================================================
      // 8. DEVOLVER AJUSTE
      // =================================================

      return tx.ajuste_inventario.findUnique({
        where: {
          id: ajuste.id,
        },

        include: {
          detalles: {
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
    });
  }
}
