<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import type { ApiResponse, Movimiento } from "~/types/producto";

const authStore = useAuthStore();
const { $api } = useNuxtApp();

const movimientos = ref<Movimiento[]>([]);
const movimientosPending = ref(true);
const showDetailModal = ref(false);
const selectedMovimiento = ref<Movimiento | null>(null);

const filtroTipo = ref<
  | "TODOS"
  | "INVENTARIO_INICIAL"
  | "ENTRADA"
  | "VENTA"
  | "SALIDA"
  | "AJUSTE_POSITIVO"
  | "AJUSTE_NEGATIVO"
>("TODOS");

const loadMovimientos = async () => {
  movimientosPending.value = true;
  try {
    const response = await $api<ApiResponse<Movimiento[]>>("/movimientos");
    movimientos.value = response.data;
  } catch (error: any) {
    console.error("Error al cargar movimientos:", error);
  } finally {
    movimientosPending.value = false;
  }
};

onMounted(() => {
  loadMovimientos();
});

const movimientosFiltrados = computed(() => {
  if (filtroTipo.value === "TODOS") return movimientos.value;
  return movimientos.value.filter((m) => m.tipo === filtroTipo.value);
});

const verDetalle = (movimiento: Movimiento) => {
  selectedMovimiento.value = movimiento;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedMovimiento.value = null;
};

const tipoLabels: Record<string, string> = {
  INVENTARIO_INICIAL: "Inventario inicial",
  ENTRADA: "ENTRADA",
  VENTA: "VENTA",
  SALIDA: "SALIDA",
  AJUSTE_POSITIVO: "AJST POSITIVO",
  AJUSTE_NEGATIVO: "AJST NEGATIVO",
};

const tipoBadgeClass: Record<string, string> = {
  INVENTARIO_INICIAL: "bg-gray-100 text-gray-700",
  ENTRADA: "bg-green-100 text-green-700 w-28 justify-center",
  VENTA: "bg-blue-100 text-blue-700 w-28 justify-center",
  SALIDA: "bg-red-100 text-orange-700 w-28 justify-center",
  AJUSTE_POSITIVO: "bg-emerald-100 text-emerald-700 w-28 justify-center",
  AJUSTE_NEGATIVO: "bg-yellow-100 text-orange-700 w-28 justify-center",
};

const totalMovimientos = computed(() => movimientos.value.length);
const movimientosEntrada = computed(
  () => movimientos.value.filter((m) => m.tipo === "ENTRADA").length
);
const movimientosSalida = computed(
  () => movimientos.value.filter((m) => m.tipo === "SALIDA").length
);
const movimientosAjuste = computed(
  () =>
    movimientos.value.filter(
      (m) => m.tipo === "AJUSTE_POSITIVO" || m.tipo === "AJUSTE_NEGATIVO"
    ).length
);

const irAReporte = () => {
  navigateTo({
    path: "/reportes",
    query: { tipo: "movimientos" },
  });
};
</script>

<template>
  <section class="space-y-3">
    <div
      class="rounded-lg bg-gradient-to-r from-green-900 to-green-700 p-2 pl-3 text-white shadow-lg flex items-center"
    >
      <p class="text-sm uppercase tracking-[0.3em] text-slate-300 text-white font-medium">
        Movimientos
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Total movimientos:</p>
        <p class="text-xl font-bold text-slate-800">{{ totalMovimientos }}</p>
      </div>

      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Entradas:</p>
        <p class="text-xl font-bold text-green-600">{{ movimientosEntrada }}</p>
      </div>

      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Salidas:</p>
        <p class="text-xl font-bold text-orange-600">{{ movimientosSalida }}</p>
      </div>

      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Ajustes:</p>
        <p class="text-xl font-bold text-yellow-500">{{ movimientosAjuste }}</p>
      </div>
    </div>

    <div class="space-y-4">
      <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-green-800">Listado de movimientos</h2>
            <p class="mt-1 text-sm text-slate-500">
              Consulta el historial completo de movimientos de inventario.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                v-for="tipo in [
                  'TODOS',
                  'INVENTARIO_INICIAL',
                  'ENTRADA',
                  'VENTA',
                  'SALIDA',
                  'AJUSTE_POSITIVO',
                  'AJUSTE_NEGATIVO',
                ]"
                :key="tipo"
                type="button"
                :class="[
                  'px-3 py-1.5 text-sm font-medium transition',
                  filtroTipo === tipo
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ]"
                @click="filtroTipo = tipo as any"
              >
                {{ tipo === "TODOS" ? "Todos" : tipoLabels[tipo] || tipo }}
              </button>
            </div>
          
          </div>

          <div class="text-sm text-slate-500 align-top">
            {{
              movimientosPending
                ? "Cargando movimientos..."
                : `${movimientosFiltrados.length} registros`
            }}
          </div>
  
        </div>

        <div class="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr
                class="text-left text-sm font-semibold uppercase tracking-wide text-green-800"
              >
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Tipo</th>
                <th class="px-4 py-3">Producto</th>
                <th class="px-4 py-3">Cantidad</th>
                <th class="px-4 py-3">Stock anterior</th>
                <th class="px-4 py-3">Stock posterior</th>
                <th class="px-4 py-3">Usuario</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="!movimientosPending && movimientosFiltrados.length === 0">
                <td colspan="8" class="px-4 py-10 text-center text-sm text-slate-500">
                  No hay movimientos registrados todavía.
                </td>
              </tr>

              <tr
                v-for="movimiento in movimientosFiltrados"
                :key="movimiento.id"
                class="align-center"
              >
                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ new Date(movimiento.createdAt).toLocaleDateString("es-CU") }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      tipoBadgeClass[movimiento.tipo] || 'bg-gray-100 text-gray-700',
                    ]"
                  >
                    {{ tipoLabels[movimiento.tipo] || movimiento.tipo }}
                  </span>
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ movimiento.producto.nombre }}
                  <span class="text-slate-500">({{ movimiento.producto.codigo }})</span>
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ Number(movimiento.cantidad).toFixed(3) }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ Number(movimiento.stockAnterior).toFixed(3) }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ Number(movimiento.stockPosterior).toFixed(3) }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ movimiento.usuario.nombre }}
                </td>

                <td class="px-4 py-2">
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                      @click="verDetalle(movimiento)"
                    >
                      Detalles
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de detalle -->
    <teleport to="body">
      <div
        v-if="showDetailModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/50" @click="closeDetailModal"></div>

        <div
          class="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-green-700">
              Movimiento #{{ selectedMovimiento?.id.slice(0, 8) }}
            </h3>
            <button type="button" class="text-slate-500" @click="closeDetailModal">
              ✕
            </button>
          </div>

          <div v-if="selectedMovimiento" class="mt-4 space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <p class="text-sm font-medium text-slate-500">Tipo</p>
                <p class="text-slate-800">
                  {{ tipoLabels[selectedMovimiento.tipo] || selectedMovimiento.tipo }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Producto</p>
                <p class="text-slate-800">
                  {{ selectedMovimiento.producto.nombre }}
                  <span class="text-slate-500"
                    >({{ selectedMovimiento.producto.codigo }})</span
                  >
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Cantidad</p>
                <p class="text-slate-800">
                  {{ Number(selectedMovimiento.cantidad).toFixed(3) }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Stock anterior</p>
                <p class="text-slate-800">
                  {{ Number(selectedMovimiento.stockAnterior).toFixed(3) }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Stock posterior</p>
                <p class="text-slate-800">
                  {{ Number(selectedMovimiento.stockPosterior).toFixed(3) }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Referencia</p>
                <p class="text-slate-800">
                  {{ selectedMovimiento.referenciaTipo }} #
                  {{ selectedMovimiento.referenciaId.slice(0, 8) }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Usuario</p>
                <p class="text-slate-800">{{ selectedMovimiento.usuario.nombre }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Dispositivo</p>
                <p class="text-slate-800">
                  {{ selectedMovimiento.dispositivo.nombre }}
                </p>
              </div>
              <div class="md:col-span-2">
                <p class="text-sm font-medium text-slate-500">Fecha</p>
                <p class="text-slate-800">
                  {{ new Date(selectedMovimiento.createdAt).toLocaleString("es-CU") }}
                </p>
              </div>
            </div>

            <div v-if="selectedMovimiento.motivo" class="rounded-lg bg-slate-50 p-3">
              <p class="text-sm font-medium text-slate-500">Motivo</p>
              <p class="text-slate-800">{{ selectedMovimiento.motivo }}</p>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </section>
</template>
