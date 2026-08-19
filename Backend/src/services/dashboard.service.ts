import { prisma } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";

export class DashboardService {
  async obtenerEstadisticas(
    negocioId: string,
    periodo: "dia" | "semana" | "mes" = "dia",
  ) {
    const ahora = new Date();

    let fechaInicio: Date;
    let fechaFin: Date;

    switch (periodo) {
      case "dia":
        fechaInicio = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate(),
        );
        fechaFin = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate() + 1,
        );
        break;
      case "semana":
        const diaSemana = ahora.getDay();
        const diff = diaSemana === 0 ? 6 : diaSemana - 1;
        fechaInicio = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate() - diff,
        );
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + 7);
        break;
      case "mes":
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
        break;
    }

    // ========================================================
    // VENTAS
    // ========================================================

    const ventas = await prisma.venta.findMany({
      where: {
        negocioId,
        estado: "COMPLETADA",
        createdAt: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
      include: {
        detalleVenta: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
              },
            },
          },
        },
      },
    });

    const totalVentas = ventas.reduce(
      (sum, v) => sum.add(new Prisma.Decimal(v.total)),
      new Prisma.Decimal(0),
    );

    const cantidadVentas = ventas.length;

    // Productos más vendidos
    const productosVendidos: Record<
      string,
      {
        nombre: string;
        codigo: string;
        cantidad: number;
        precioVenta: number;
        productoId: string;
      }
    > = {};

    ventas.forEach((venta) => {
      venta.detalleVenta.forEach((detalle) => {
        if (!productosVendidos[detalle.productoId]) {
          productosVendidos[detalle.productoId] = {
            nombre: detalle.producto.nombre,
            codigo: detalle.producto.codigo,
            cantidad: 0,
            precioVenta: Number(detalle.precioUnitario),
            productoId: detalle.productoId,
          };
        }
        productosVendidos[detalle.productoId].cantidad += Number(
          detalle.cantidad,
        );
      });
    });

    // Obtener stock actual de los productos más vendidos
    const topProductosData = Object.values(productosVendidos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    const topProductos = await Promise.all(
      topProductosData.map(async (p) => {
        const producto = await prisma.producto.findUnique({
          where: { id: p.productoId },
          select: { stockActual: true },
        });
        return {
          nombre: p.nombre,
          codigo: p.codigo,
          cantidad: p.cantidad,
          precioVenta: p.precioVenta,
          stockActual: producto ? Number(producto.stockActual) : 0,
        };
      }),
    );

    // Ventas por método de pago
    const ventasPorMetodoPago: Record<string, number> = {};

    ventas.forEach((venta) => {
      ventasPorMetodoPago[venta.metodoPago] =
        (ventasPorMetodoPago[venta.metodoPago] || 0) + Number(venta.total);
    });

    // ========================================================
    // ENTRADAS
    // ========================================================

    const entradas = await prisma.entrada_inventario.findMany({
      where: {
        negocioId,
        estado: "COMPLETADA",
        createdAt: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
    });

    const totalEntradas = entradas.reduce(
      (sum, e) => sum.add(new Prisma.Decimal(e.total)),
      new Prisma.Decimal(0),
    );

    const cantidadEntradas = entradas.length;

    // ========================================================
    // SALIDAS
    // ========================================================

    const salidas = await prisma.salida_inventario.findMany({
      where: {
        negocioId,
        estado: "COMPLETADA",
        createdAt: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
    });

    const cantidadSalidas = salidas.length;

    // ========================================================
    // AJUSTES
    // ========================================================

    const ajustes = await prisma.ajuste_inventario.findMany({
      where: {
        negocioId,
        estado: "COMPLETADA",
        createdAt: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
    });

    const cantidadAjustes = ajustes.length;

    // ========================================================
    // PRODUCTOS
    // ========================================================

    const totalProductos = await prisma.producto.count({
      where: {
        negocioId,
        estado: "ACTIVO",
      },
    });

    const productosStockBajo = await prisma.producto.count({
      where: {
        negocioId,
        estado: "ACTIVO",
        stockActual: {
          lte: prisma.producto.fields.stockMinimo,
        },
      },
    });

    // ========================================================
    // MOVIMIENTOS
    // ========================================================

    const movimientos = await prisma.movimiento_inventario.findMany({
      where: {
        negocioId,
        createdAt: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
      include: {
        producto: {
          select: {
            nombre: true,
            codigo: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // ========================================================
    // VENTAS POR DÍA (últimos 7 días)
    // ========================================================

    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 6);
    hace7Dias.setHours(0, 0, 0, 0);

    const ventasPorDia: { fecha: string; total: number; cantidad: number }[] =
      [];

    for (let i = 0; i < 7; i++) {
      const dia = new Date(hace7Dias);
      dia.setDate(hace7Dias.getDate() + i);
      const siguienteDia = new Date(dia);
      siguienteDia.setDate(siguienteDia.getDate() + 1);

      const ventasDelDia = await prisma.venta.findMany({
        where: {
          negocioId,
          estado: "COMPLETADA",
          createdAt: {
            gte: dia,
            lt: siguienteDia,
          },
        },
        select: {
          total: true,
        },
      });

      const totalDia = ventasDelDia.reduce(
        (sum, v) => sum.add(new Prisma.Decimal(v.total)),
        new Prisma.Decimal(0),
      );

      ventasPorDia.push({
        fecha: dia.toLocaleDateString("es-CU", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
        total: Number(totalDia),
        cantidad: ventasDelDia.length,
      });
    }

    return {
      periodo,
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
      ventas: {
        total: Number(totalVentas),
        cantidad: cantidadVentas,
        porMetodoPago: ventasPorMetodoPago,
        topProductos,
      },
      entradas: {
        total: Number(totalEntradas),
        cantidad: cantidadEntradas,
      },
      salidas: {
        cantidad: cantidadSalidas,
      },
      ajustes: {
        cantidad: cantidadAjustes,
      },
      productos: {
        total: totalProductos,
        stockBajo: productosStockBajo,
      },
      ventasPorDia,
      movimientosRecientes: movimientos.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        cantidad: Number(m.cantidad),
        stockAnterior: Number(m.stockAnterior),
        stockPosterior: Number(m.stockPosterior),
        producto: m.producto,
        createdAt: m.createdAt,
      })),
    };
  }
}
