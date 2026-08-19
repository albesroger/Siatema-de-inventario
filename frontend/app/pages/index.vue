<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import type { ApiResponse, DashboardStats } from "~/types/producto";

const authStore = useAuthStore();
const { $api } = useNuxtApp();

const stats = ref<DashboardStats | null>(null);
const statsPending = ref(true);
const periodo = ref<"dia" | "semana" | "mes">("dia");

const loadStats = async () => {
  statsPending.value = true;
  try {
    const response = await $api<ApiResponse<DashboardStats>>(
      `/dashboard?periodo=${periodo.value}`
    );
    stats.value = response.data;
  } catch (error: any) {
    console.error("Error al cargar estadísticas:", error);
  } finally {
    statsPending.value = false;
  }
};

onMounted(() => {
  loadStats();
});

watch(periodo, () => {
  loadStats();
});

const money = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "CUP",
  maximumFractionDigits: 2,
});

const metodoPagoLabels: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  OTRO: "Otro",
};

const metodoPagoColors: Record<string, string> = {
  EFECTIVO: "bg-green-100 text-green-700",
  TRANSFERENCIA: "bg-blue-100 text-blue-700",
  TARJETA: "bg-purple-100 text-purple-700",
  OTRO: "bg-gray-100 text-gray-700",
};

const tipoMovimientoLabels: Record<string, string> = {
  INVENTARIO_INICIAL: "Inventario inicial",
  ENTRADA: "Entrada",
  VENTA: "Venta",
  SALIDA: "Salida",
  AJUSTE_POSITIVO: "Ajuste positivo",
  AJUSTE_NEGATIVO: "Ajuste negativo",
};

const tipoMovimientoColors: Record<string, string> = {
  INVENTARIO_INICIAL: "bg-gray-100 text-gray-700",
  ENTRADA: "bg-green-100 text-green-700",
  VENTA: "bg-blue-100 text-blue-700",
  SALIDA: "bg-orange-100 text-orange-700",
  AJUSTE_POSITIVO: "bg-emerald-100 text-emerald-700",
  AJUSTE_NEGATIVO: "bg-red-100 text-red-700",
};
</script>

<template>
  <section class="space-y-6">
    <!-- Encabezado -->
    <div
      class="rounded-lg bg-gradient-to-r from-green-900 to-green-700 p-2 pl-3 text-white shadow-lg flex items-center"
    >
      <p class="text-sm uppercase tracking-[0.3em] text-slate-300 text-white font-medium">
        Dashboard
      </p>
    </div>

    <!-- Filtros de período -->
    <div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm font-medium text-slate-700">Período:</span>
        <div class="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            v-for="p in ['dia', 'semana', 'mes']"
            :key="p"
            type="button"
            :class="[
              'px-4 py-2 text-sm font-medium transition',
              periodo === p
                ? 'bg-green-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50',
            ]"
            @click="periodo = p as any"
          >
            {{ p === "dia" ? "Hoy" : p === "semana" ? "Esta semana" : "Este mes" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tarjetas de estadísticas principales -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div
        class="rounded-lg bg-white border border-green-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Ventas totales:</p>
        <p class="mt-2 text-2xl font-bold text-green-600">
          {{ statsPending ? "..." : money.format(stats?.ventas.total || 0) }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{ statsPending ? "" : `${stats?.ventas.cantidad || 0} transacciones` }}
        </p>
      </div>

      <div
        class="rounded-lg bg-white border border-green-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Entradas:</p>
        <p class="mt-2 text-2xl font-bold text-emerald-600">
          {{ statsPending ? "..." : money.format(stats?.entradas.total || 0) }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{ statsPending ? "" : `${stats?.entradas.cantidad || 0} registros` }}
        </p>
      </div>

      <div
        class="rounded-lg bg-white border border-green-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Salidas:</p>
        <p class="mt-2 text-2xl font-bold text-orange-600">
          {{ statsPending ? "..." : stats?.salidas.cantidad || 0 }}
        </p>
        <p class="mt-1 text-sm text-slate-500">Registros de salida</p>
      </div>

      <div
        class="rounded-lg bg-white border border-green-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Ajustes:</p>
        <p class="mt-2 text-2xl font-bold text-red-600">
          {{ statsPending ? "..." : stats?.ajustes.cantidad || 0 }}
        </p>
        <p class="mt-1 text-sm text-slate-500">Correcciones de stock</p>
      </div>
    </div>

    <!-- Segunda fila: Productos y Ventas por método de pago -->
    <div class="grid gap-4 md:grid-cols-2">
      <!-- Productos -->
      <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 class="text-lg font-semibold text-green-800 mb-4">Productos</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm text-slate-600">Total productos activos:</span>
            <span class="text-lg font-bold text-slate-800">
              {{ statsPending ? "..." : stats?.productos.total || 0 }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-slate-600">Productos con stock bajo:</span>
            <span class="text-lg font-bold text-red-600">
              {{ statsPending ? "..." : stats?.productos.stockBajo || 0 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Ventas por método de pago -->
      <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 class="text-lg font-semibold text-green-800 mb-4">
          Ventas por método de pago
        </h3>
        <div v-if="statsPending" class="text-sm text-slate-500">Cargando...</div>
        <div v-else-if="!stats?.ventas.porMetodoPago" class="text-sm text-slate-500">
          No hay datos
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="(total, metodo) in stats.ventas.porMetodoPago"
            :key="metodo"
            class="flex justify-between items-center"
          >
            <span
              :class="[
                'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                metodoPagoColors[metodo] || 'bg-gray-100 text-gray-700',
              ]"
            >
              {{ metodoPagoLabels[metodo] || metodo }}
            </span>
            <span class="text-sm font-semibold text-slate-800">
              {{ money.format(total) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfico de ventas por día -->
    <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h3 class="text-lg font-semibold text-green-800 mb-4">
        Ventas de los últimos 7 días
      </h3>
      <div v-if="statsPending" class="text-sm text-slate-500">Cargando...</div>
      <div v-else-if="!stats?.ventasPorDia" class="text-sm text-slate-500">
        No hay datos
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="dia in stats.ventasPorDia"
          :key="dia.fecha"
          class="flex items-center gap-4"
        >
          <div class="w-32 text-sm text-slate-600">{{ dia.fecha }}</div>
          <div class="flex-1">
            <div class="h-8 rounded-lg bg-slate-100 overflow-hidden">
              <div
                :class="[
                  'h-full rounded-lg bg-green-600 transition-all',
                  dia.total > 0 ? 'bg-green-600' : 'bg-slate-200',
                ]"
                :style="{
                  width: `${Math.max(
                    5,
                    (dia.total / Math.max(...stats.ventasPorDia.map((d) => d.total), 1)) *
                      100
                  )}%`,
                }"
              ></div>
            </div>
          </div>
          <div class="w-24 text-right">
            <span class="text-sm font-semibold text-slate-800">
              {{ money.format(dia.total) }}
            </span>
            <span class="text-xs text-slate-500 block">{{ dia.cantidad }} ventas</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Productos más vendidos -->
    <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h3 class="text-lg font-semibold text-green-800 mb-4">Productos más vendidos</h3>
      <div v-if="statsPending" class="text-sm text-slate-500">Cargando...</div>
      <div v-else-if="!stats?.ventas.topProductos.length" class="text-sm text-slate-500">
        No hay datos
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr class="text-left text-sm font-semibold text-slate-700">
              <th class="px-4 py-3">#</th>
              <th class="px-4 py-3">Producto</th>
              <th class="px-4 py-3">Código</th>
              <th class="px-4 py-3 text-right">Precio</th>
              <th class="px-4 py-3 text-right">Cantidad vendida</th>
              <th class="px-4 py-3 text-right">Stock actual</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr
              v-for="(producto, index) in stats.ventas.topProductos"
              :key="producto.codigo"
            >
              <td class="px-4 py-3 text-sm text-slate-600">{{ index + 1 }}</td>
              <td class="px-4 py-3 text-sm text-slate-800 font-medium">
                {{ producto.nombre }}
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ producto.codigo }}</td>
              <td class="px-4 py-3 text-sm text-slate-600 text-right">
                {{ money.format(producto.precioVenta) }}
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 text-right font-semibold">
                {{ producto.cantidad.toFixed(3) }}
              </td>
              <td
                class="px-4 py-3 text-sm text-right"
                :class="
                  producto.stockActual <= 0
                    ? 'text-red-600 font-semibold'
                    : 'text-slate-600'
                "
              >
                {{ producto.stockActual.toFixed(3) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Movimientos recientes -->
    <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h3 class="text-lg font-semibold text-green-800 mb-4">Movimientos recientes</h3>
      <div v-if="statsPending" class="text-sm text-slate-500">Cargando...</div>
      <div v-else-if="!stats?.movimientosRecientes.length" class="text-sm text-slate-500">
        No hay movimientos en este período
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr class="text-left text-sm font-semibold text-slate-700">
              <th class="px-4 py-3">Tipo</th>
              <th class="px-4 py-3">Producto</th>
              <th class="px-4 py-3 text-right">Cantidad</th>
              <th class="px-4 py-3 text-right">Stock anterior</th>
              <th class="px-4 py-3 text-right">Stock posterior</th>
              <th class="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="movimiento in stats.movimientosRecientes" :key="movimiento.id">
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                    tipoMovimientoColors[movimiento.tipo] || 'bg-gray-100 text-gray-700',
                  ]"
                >
                  {{ tipoMovimientoLabels[movimiento.tipo] || movimiento.tipo }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-800">
                {{ movimiento.producto.nombre }}
                <span class="text-slate-500">({{ movimiento.producto.codigo }})</span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 text-right">
                {{ movimiento.cantidad.toFixed(3) }}
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 text-right">
                {{ movimiento.stockAnterior.toFixed(3) }}
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 text-right">
                {{ movimiento.stockPosterior.toFixed(3) }}
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">
                {{ new Date(movimiento.createdAt).toLocaleString("es-CU") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
