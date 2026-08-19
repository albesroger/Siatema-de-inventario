<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import type {
  ApiResponse,
  MetodoPago,
  ProductoParaVenta,
  Venta,
  VentaDetalleProducto,
} from "~/types/producto";

const authStore = useAuthStore();
const { $api } = useNuxtApp();

const money = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }
  const normalized = String(value).trim();
  if (!normalized) {
    return 0;
  }
  return Number(normalized);
};

// ========================================================
// FILTROS DEL HISTORIAL
// ========================================================

const filtroEstado = ref<"TODAS" | "COMPLETADA" | "ANULADA">("TODAS");
const filtroFecha = ref<"HOY" | "DIA" | "TODAS">("HOY");
const fechaSeleccionada = ref("");

const ventas = ref<Venta[]>([]);
const ventasPending = ref(true);
const showDetailModal = ref(false);
const selectedVenta = ref<Venta | null>(null);

const loadVentas = async () => {
  ventasPending.value = true;
  try {
    const response = await $api<ApiResponse<Venta[]>>("/ventas");
    ventas.value = response.data;
  } catch (error: any) {
    console.error("Error al cargar ventas:", error);
  } finally {
    ventasPending.value = false;
  }
};

onMounted(() => {
  loadVentas();
});

const ventasFiltradas = computed(() => {
  let resultado = [...ventas.value];

  if (filtroEstado.value !== "TODAS") {
    resultado = resultado.filter((v) => v.estado === filtroEstado.value);
  }

  if (filtroFecha.value === "HOY") {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    resultado = resultado.filter(
      (v) => new Date(v.createdAt) >= inicioHoy && new Date(v.createdAt) < finHoy
    );
  } else if (filtroFecha.value === "DIA" && fechaSeleccionada.value) {
    const inicioDia = new Date(fechaSeleccionada.value);
    const finDia = new Date(fechaSeleccionada.value);
    finDia.setDate(finDia.getDate() + 1);
    resultado = resultado.filter(
      (v) => new Date(v.createdAt) >= inicioDia && new Date(v.createdAt) < finDia
    );
  }

  return resultado;
});

const verDetalle = (venta: Venta) => {
  selectedVenta.value = venta;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedVenta.value = null;
};

const anularVenta = async (venta: Venta) => {
  const confirmed = window.confirm(
    `¿Anular la venta #${venta.numero.toString()}? Esta acción revertirá el stock de los productos.`
  );

  if (!confirmed) return;

  try {
    // Obtener dispositivo activo del usuario
    const dispositivos = await $api<ApiResponse<any[]>>("/dispositivos");
    const dispositivo = dispositivos.data.find((d) => d.estado === "ACTIVO");

    if (!dispositivo) {
      alert("No hay un dispositivo activo disponible para anular la venta.");
      return;
    }

    await $api(`/ventas/${venta.id}/anular`, {
      method: "POST",
      body: {
        dispositivoId: dispositivo.id,
      },
    });

    await loadVentas();
    closeDetailModal();
  } catch (error: any) {
    alert(error?.data?.message || "No se pudo anular la venta");
  }
};

const totalVentas = computed(() => ventas.value.length);
const ventasCompletadas = computed(
  () => ventas.value.filter((v) => v.estado === "COMPLETADA").length
);
const ventasAnuladas = computed(
  () => ventas.value.filter((v) => v.estado === "ANULADA").length
);

const irAReporte = () => {
  navigateTo({
    path: "/reportes",
    query: { tipo: "ventas" },
  });
};
</script>

<template>
  <section class="space-y-3">
    <div
      class="rounded-lg bg-gradient-to-r from-green-900 to-green-700 p-2 pl-3 text-white shadow-lg flex items-center"
    >
      <p class="text-sm uppercase tracking-[0.3em] text-slate-300 text-white font-medium">
        Ventas
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div
        class="rounded-lg bg-white border border-green-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Total ventas:</p>
        <p class="mt-2 text-2xl font-bold text-slate-800">{{ totalVentas }}</p>
      </div>

      <div
        class="rounded-lg bg-white border border-green-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Completadas:</p>
        <p class="mt-2 text-2xl font-bold text-green-600">{{ ventasCompletadas }}</p>
      </div>

      <div
        class="rounded-lg bg-white border border-red-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Anuladas:</p>
        <p class="mt-2 text-2xl font-bold text-red-600">{{ ventasAnuladas }}</p>
      </div>
    </div>

    <div class="space-y-4">
      <div
        class="rounded-lg bg-white p-2 pl-3 shadow-sm ring-1 ring-slate-200 flex flex-col justify-center items-start gap-4"
      >
        <button
          class="rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
          @click=""
        >
          Nueva venta
        </button>
      
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-green-800">Historial de ventas</h2>
            <p class="mt-1 text-sm text-slate-500">
              Consulta el detalle de cada venta realizada.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                v-for="estado in ['TODAS', 'COMPLETADA', 'ANULADA']"
                :key="estado"
                type="button"
                :class="[
                  'px-3 py-1.5 text-sm font-medium transition',
                  filtroEstado === estado
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ]"
                @click="filtroEstado = estado as any"
              >
                {{
                  estado === "TODAS"
                    ? "Todas"
                    : estado === "COMPLETADA"
                    ? "Completadas"
                    : "Anuladas"
                }}
              </button>
            </div>

            <div class="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                v-for="fecha in ['HOY', 'DIA', 'TODAS']"
                :key="fecha"
                type="button"
                :class="[
                  'px-3 py-1.5 text-sm font-medium transition',
                  filtroFecha === fecha
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ]"
                @click="filtroFecha = fecha as any"
              >
                {{
                  fecha === "HOY"
                    ? "Hoy"
                    : fecha === "DIA"
                    ? "Día"
                    : "Todas"
                }}
              </button>
            </div>

            <input
              v-if="filtroFecha === 'DIA'"
              v-model="fechaSeleccionada"
              type="date"
              class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            />
          </div>

          <div class="text-sm text-slate-500">
            {{
              ventasPending
                ? "Cargando ventas..."
                : `${ventasFiltradas.length} registros`
            }}
          </div>
        </div>

        <div class="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr
                class="text-left text-sm font-semibold uppercase tracking-wide text-green-800"
              >
                <th class="px-4 py-3">Número</th>
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Método de pago</th>
                <th class="px-4 py-3">Total</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="!ventasPending && ventasFiltradas.length === 0">
                <td colspan="6" class="px-4 py-10 text-center text-sm text-slate-500">
                  No hay ventas registradas todavía.
                </td>
              </tr>

              <tr
                v-for="venta in ventasFiltradas"
                :key="venta.id"
                class="align-center"
              >
                <td class="px-4 py-2">
                  <p class="font-medium text-slate-800 text-sm">
                    #{{ venta.numero.toString() }}
                  </p>
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ new Date(venta.createdAt).toLocaleDateString("es-CU") }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ venta.metodoPago }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                  ${{ Number(venta.total).toFixed(2) }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      venta.estado === 'COMPLETADA'
                        ? 'bg-green-100 text-green-700 justify-center'
                        : 'bg-red-100 text-red-700 justify-center w-24',
                    ]"
                  >
                    {{ venta.estado }}
                  </span>
                </td>

                <td class="px-4 py-2">
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                      @click="verDetalle(venta)"
                    >
                      Detalles
                    </button>

                    <button
                      v-if="venta.estado === 'COMPLETADA'"
                      type="button"
                      class="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      @click="anularVenta(venta)"
                    >
                      Anular
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
              Venta #{{ selectedVenta?.numero.toString() }}
            </h3>
            <button type="button" class="text-slate-500" @click="closeDetailModal">
              ✕
            </button>
          </div>

          <div v-if="selectedVenta" class="mt-4 space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <p class="text-sm font-medium text-slate-500">Usuario</p>
                <p class="text-slate-800">{{ selectedVenta.usuario?.nombre || "—" }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Dispositivo</p>
                <p class="text-slate-800">
                  {{ selectedVenta.dispositivo?.nombre || "—" }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Método de pago</p>
                <p class="text-slate-800">{{ selectedVenta.metodoPago }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Estado</p>
                <span
                  :class="[
                    'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                    selectedVenta.estado === 'COMPLETADA'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700',
                  ]"
                >
                  {{ selectedVenta.estado }}
                </span>
              </div>
              <div class="md:col-span-2">
                <p class="text-sm font-medium text-slate-500">Fecha</p>
                <p class="text-slate-800">
                  {{ new Date(selectedVenta.createdAt).toLocaleString("es-CU") }}
                </p>
              </div>
            </div>

            <div class="rounded-lg border border-slate-200 overflow-hidden">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr class="text-left text-sm font-semibold text-slate-700">
                    <th class="px-4 py-3">Producto</th>
                    <th class="px-4 py-3">Cantidad</th>
                    <th class="px-4 py-3">Precio unitario</th>
                    <th class="px-4 py-3">Descuento</th>
                    <th class="px-4 py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  <tr v-for="detalle in selectedVenta.detalleVenta" :key="detalle.id">
                    <td class="px-4 py-3 text-sm text-slate-800">
                      {{ detalle.producto.nombre }}
                      <span class="text-slate-500">({{ detalle.producto.codigo }})</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      {{ Number(detalle.cantidad).toFixed(3) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      ${{ Number(detalle.precioUnitario).toFixed(2) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      ${{ Number(detalle.descuento).toFixed(2) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600 font-medium">
                      ${{ Number(detalle.subtotal).toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex justify-end gap-2 rounded-lg bg-slate-50 p-4">
              <div class="text-right">
                <p class="text-sm text-slate-500">Subtotal</p>
                <p class="text-lg font-semibold text-slate-800">
                  ${{ Number(selectedVenta.subtotal).toFixed(2) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-slate-500">Descuento</p>
                <p class="text-lg font-semibold text-slate-800">
                  ${{ Number(selectedVenta.descuento).toFixed(2) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-slate-500">Impuesto</p>
                <p class="text-lg font-semibold text-slate-800">
                  ${{ Number(selectedVenta.impuesto).toFixed(2) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-slate-500">Total</p>
                <p class="text-xl font-bold text-green-700">
                  ${{ Number(selectedVenta.total).toFixed(2) }}
                </p>
              </div>
            </div>

            <div
              v-if="selectedVenta.estado === 'COMPLETADA'"
              class="flex justify-end pt-4"
            >
              <button
                type="button"
                class="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                @click="anularVenta(selectedVenta)"
              >
                Anular venta
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </section>
</template>
