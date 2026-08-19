<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import type { ApiResponse } from "~/types/producto";

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();

const tipoReporte = ref<"ventas" | "movimientos">("ventas");
const periodo = ref<"dia" | "semana" | "mes">("dia");

const ventas = ref<any[]>([]);
const movimientos = ref<any[]>([]);
const loading = ref(false);

const money = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const cargarDatos = async () => {
  loading.value = true;
  try {
    if (tipoReporte.value === "ventas") {
      const response = await $api<ApiResponse<any[]>>(`/ventas?periodo=${periodo.value}`);
      ventas.value = response.data;
      movimientos.value = [];
    } else {
      const response = await $api<ApiResponse<any[]>>(
        `/movimientos?periodo=${periodo.value}`
      );
      movimientos.value = response.data;
      ventas.value = [];
    }
  } catch (error: any) {
    console.error("Error al cargar datos:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (route.query.tipo) {
    tipoReporte.value = route.query.tipo as "ventas" | "movimientos";
  }
  if (route.query.periodo) {
    periodo.value = route.query.periodo as "dia" | "semana" | "mes";
  }
  cargarDatos();
});

watch([tipoReporte, periodo], () => {
  cargarDatos();
});

const imprimirReporte = () => {
  window.print();
};

const totalVentas = computed(() => {
  return ventas.value.reduce((sum, v) => sum + Number(v.total || 0), 0);
});

const totalCantidadVentas = computed(() => ventas.value.length);
</script>

<template>
  <section class="space-y-6">
    <!-- Encabezado -->
    <div
      class="rounded-lg bg-gradient-to-r from-green-900 to-green-700 p-2 pl-3 text-white shadow-lg flex items-center justify-between"
    >
      <p class="text-sm uppercase tracking-[0.3em] text-slate-300 text-white font-medium">
        Reportes
      </p>
      <button
        class="rounded-lg bg-white px-3 py-1 text-sm font-medium text-green-700 hover:bg-slate-100"
        @click="imprimirReporte"
      >
        🖨️ Imprimir / Guardar PDF
      </button>
    </div>

    <!-- Filtros -->
    <div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-slate-700">Tipo:</label>
          <select
            v-model="tipoReporte"
            class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          >
            <option value="ventas">Ventas</option>
            <option value="movimientos">Movimientos</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-slate-700">Período:</label>
          <select
            v-model="periodo"
            class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          >
            <option value="dia">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Reporte de Ventas -->
    <div
      v-if="tipoReporte === 'ventas'"
      class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-green-800">Reporte de Ventas</h2>
        <p class="text-sm text-slate-500 mt-1">
          Período:
          {{
            periodo === "dia" ? "Hoy" : periodo === "semana" ? "Esta semana" : "Este mes"
          }}
        </p>
        <p class="text-sm text-slate-500">
          Generado: {{ new Date().toLocaleString("es-CU") }}
        </p>
      </div>

      <div v-if="loading" class="text-center text-sm text-slate-500 py-8">
        Cargando...
      </div>
      <div
        v-else-if="ventas.length === 0"
        class="text-center text-sm text-slate-500 py-8"
      >
        No hay ventas en este período
      </div>
      <div v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr class="text-left text-sm font-semibold text-slate-700">
                <th class="px-4 py-3">Número</th>
                <th class="px-4 py-3">Fecha</th>

                <th class="px-4 py-3">Método de pago</th>
                <th class="px-4 py-3 text-right">Subtotal</th>
                <th class="px-4 py-3 text-right">Descuento</th>
                <th class="px-4 py-3 text-right">Impuesto</th>
                <th class="px-4 py-3 text-right">Total</th>
                <th class="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="venta in ventas" :key="venta.id">
                <td class="px-4 py-3 text-sm text-slate-800 font-medium">
                  #{{ venta.numero }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">
                  {{ new Date(venta.createdAt).toLocaleDateString("es-CU") }}
                </td>

                <td class="px-4 py-3 text-sm text-slate-600">{{ venta.metodoPago }}</td>
                <td class="px-4 py-3 text-sm text-slate-600 text-right">
                  {{ money.format(Number(venta.subtotal)) }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600 text-right">
                  {{ money.format(Number(venta.descuento)) }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600 text-right">
                  {{ money.format(Number(venta.impuesto)) }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-800 font-semibold text-right">
                  {{ money.format(Number(venta.total)) }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ venta.estado }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 flex justify-end">
          <div class="text-right">
            <p class="text-sm text-slate-500">Total de ventas</p>
            <p class="text-2xl font-bold text-green-700">
              {{ money.format(totalVentas) }}
            </p>
            <p class="text-sm text-slate-500">{{ totalCantidadVentas }} transacciones</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Reporte de Movimientos -->
    <div
      v-if="tipoReporte === 'movimientos'"
      class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-green-800">Reporte de Movimientos</h2>
        <p class="text-sm text-slate-500 mt-1">
          Período:
          {{
            periodo === "dia" ? "Hoy" : periodo === "semana" ? "Esta semana" : "Este mes"
          }}
        </p>
        <p class="text-sm text-slate-500">
          Generado: {{ new Date().toLocaleString("es-CU") }}
        </p>
      </div>

      <div v-if="loading" class="text-center text-sm text-slate-500 py-8">
        Cargando...
      </div>
      <div
        v-else-if="movimientos.length === 0"
        class="text-center text-sm text-slate-500 py-8"
      >
        No hay movimientos en este período
      </div>
      <div v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr class="text-left text-sm font-semibold text-slate-700">
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Tipo</th>
                <th class="px-4 py-3">Producto</th>
                <th class="px-4 py-3 text-right">Cantidad</th>
                <th class="px-4 py-3 text-right">Stock anterior</th>
                <th class="px-4 py-3 text-right">Stock posterior</th>
                <th class="px-4 py-3">Usuario</th>
                <th class="px-4 py-3">Referencia</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="mov in movimientos" :key="mov.id">
                <td class="px-4 py-3 text-sm text-slate-600">
                  {{ new Date(mov.createdAt).toLocaleDateString("es-CU") }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ mov.tipo }}</td>
                <td class="px-4 py-3 text-sm text-slate-800">
                  {{ mov.producto?.nombre || "—" }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600 text-right">
                  {{ Number(mov.cantidad).toFixed(3) }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600 text-right">
                  {{ Number(mov.stockAnterior).toFixed(3) }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600 text-right">
                  {{ Number(mov.stockPosterior).toFixed(3) }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">
                  {{ mov.usuario?.nombre || "—" }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">
                  {{ mov.referenciaTipo }} #{{ mov.referenciaId?.slice(0, 8) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 flex justify-end">
          <div class="text-right">
            <p class="text-sm text-slate-500">Total de movimientos</p>
            <p class="text-2xl font-bold text-green-700">{{ movimientos.length }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  section,
  section * {
    visibility: visible;
  }
  section {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .no-print {
    display: none !important;
  }
}
</style>
