<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import type { ApiResponse, Entrada } from "~/types/producto";

const authStore = useAuthStore();
const { $api } = useNuxtApp();

const entradas = ref<Entrada[]>([]);
const entradasPending = ref(true);
const showDetailModal = ref(false);
const selectedEntrada = ref<Entrada | null>(null);

const filtroEstado = ref<"TODAS" | "COMPLETADA" | "ANULADA">("TODAS");

const loadEntradas = async () => {
  entradasPending.value = true;
  try {
    const response = await $api<ApiResponse<Entrada[]>>("/entradas");
    entradas.value = response.data;
  } catch (error: any) {
    console.error("Error al cargar entradas:", error);
  } finally {
    entradasPending.value = false;
  }
};

onMounted(() => {
  loadEntradas();
});

const entradasFiltradas = computed(() => {
  if (filtroEstado.value === "TODAS") return entradas.value;
  return entradas.value.filter((e) => e.estado === filtroEstado.value);
});

const verDetalle = (entrada: Entrada) => {
  selectedEntrada.value = entrada;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedEntrada.value = null;
};

const anularEntrada = async (entrada: Entrada) => {
  const confirmed = window.confirm(
    `¿Anular la entrada #${entrada.numero.toString()}? Esta acción revertirá el stock de los productos.`
  );

  if (!confirmed) return;

  try {
    // Obtener dispositivo activo del usuario
    const dispositivos = await $api<ApiResponse<any[]>>("/dispositivos");
    const dispositivo = dispositivos.data.find((d) => d.estado === "ACTIVO");

    if (!dispositivo) {
      alert("No hay un dispositivo activo disponible para anular la entrada.");
      return;
    }

    await $api(`/entradas/${entrada.id}/anular`, {
      method: "PATCH",
      body: {
        dispositivoId: dispositivo.id,
      },
    });

    await loadEntradas();
    closeDetailModal();
  } catch (error: any) {
    alert(error?.data?.message || "No se pudo anular la entrada");
  }
};

const motivoLabels: Record<string, string> = {
  PRODUCTO_DANADO: "Producto dañado",
  PRODUCTO_VENCIDO: "Producto vencido",
  CONSUMO_INTERNO: "Consumo interno",
  PERDIDA: "Pérdida",
  ROBO: "Robo",
  MUESTRA: "Muestra",
  OTRO: "Otro",
};

const totalEntradas = computed(() => entradas.value.length);
const entradasCompletadas = computed(
  () => entradas.value.filter((e) => e.estado === "COMPLETADA").length
);
const entradasAnuladas = computed(
  () => entradas.value.filter((e) => e.estado === "ANULADA").length
);
</script>

<template>
  <section class="space-y-3">
    <div
      class="rounded-lg bg-gradient-to-r from-green-900 to-green-700 p-2 pl-3 text-white shadow-lg flex items-center"
    >
      <p class="text-sm uppercase tracking-[0.3em] text-slate-300 text-white font-medium">
        Entradas
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-lg bg-white p-5 py-2 shadow-sm ring-1 ring-slate-200">
        <p class="text-lg text-slate-700 font-medium">Total entradas:</p>
        <p class="mt-2 text-2xl font-bold text-slate-800">{{ totalEntradas }}</p>
      </div>

      <div class="rounded-lg bg-white p-5 py-2 shadow-sm ring-1 ring-slate-200">
        <p class="text-lg text-slate-700 font-medium">Completadas:</p>
        <p class="mt-2 text-2xl font-bold text-green-600">{{ entradasCompletadas }}</p>
      </div>

      <div class="rounded-lg bg-white p-5 py-2 shadow-sm ring-1 ring-slate-200">
        <p class="text-lg text-slate-700 font-medium">Anuladas:</p>
        <p class="mt-2 text-2xl font-bold text-red-600">{{ entradasAnuladas }}</p>
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
          Nueva entrada
        </button>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-green-800">Listado de entradas</h2>
            <p class="mt-1 text-sm text-slate-500">
              Consulta el historial de entradas de inventario.
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
          </div>

          <div class="text-sm text-slate-500">
            {{
              entradasPending
                ? "Cargando entradas..."
                : `${entradasFiltradas.length} registros`
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
                <th class="px-4 py-3">Proveedor</th>
                <th class="px-4 py-3">Documento</th>
                <th class="px-4 py-3">Total</th>
                <th class="px-4 py-3">Productos</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="!entradasPending && entradasFiltradas.length === 0">
                <td colspan="8" class="px-4 py-10 text-center text-sm text-slate-500">
                  No hay entradas registradas todavía.
                </td>
              </tr>

              <tr
                v-for="entrada in entradasFiltradas"
                :key="entrada.id"
                class="align-center"
              >
                <td class="px-4 py-2">
                  <p class="font-medium text-slate-800 text-sm">
                    #{{ entrada.numero.toString() }}
                  </p>
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ entrada.proveedor?.nombre || "—" }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ entrada.numeroDocumento || "—" }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                  ${{ Number(entrada.total).toFixed(2) }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ entrada.detalles?.length ?? 0 }} items
                </td>

                <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      entrada.estado === 'COMPLETADA'
                        ? 'bg-green-100 text-green-700 justify-center'
                        : 'bg-red-100 text-red-700 justify-center w-24',
                    ]"
                  >
                    {{ entrada.estado }}
                  </span>
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ new Date(entrada.createdAt).toLocaleDateString("es-CU") }}
                </td>

                <td class="px-4 py-2">
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                      @click="verDetalle(entrada)"
                    >
                      Detalles
                    </button>

                    <button
                      v-if="entrada.estado === 'COMPLETADA'"
                      type="button"
                      class="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      @click="anularEntrada(entrada)"
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
              Entrada #{{ selectedEntrada?.numero.toString() }}
            </h3>
            <button type="button" class="text-slate-500" @click="closeDetailModal">
              ✕
            </button>
          </div>

          <div v-if="selectedEntrada" class="mt-4 space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <p class="text-sm font-medium text-slate-500">Proveedor</p>
                <p class="text-slate-800">
                  {{ selectedEntrada.proveedor?.nombre || "—" }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Número de documento</p>
                <p class="text-slate-800">{{ selectedEntrada.numeroDocumento || "—" }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Usuario</p>
                <p class="text-slate-800">{{ selectedEntrada.usuario?.nombre || "—" }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Dispositivo</p>
                <p class="text-slate-800">
                  {{ selectedEntrada.dispositivo?.nombre || "—" }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Estado</p>
                <span
                  :class="[
                    'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                    selectedEntrada.estado === 'COMPLETADA'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700',
                  ]"
                >
                  {{ selectedEntrada.estado }}
                </span>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Fecha</p>
                <p class="text-slate-800">
                  {{ new Date(selectedEntrada.createdAt).toLocaleString("es-CU") }}
                </p>
              </div>
            </div>

            <div v-if="selectedEntrada.observaciones" class="rounded-lg bg-slate-50 p-3">
              <p class="text-sm font-medium text-slate-500">Observaciones</p>
              <p class="text-slate-800">{{ selectedEntrada.observaciones }}</p>
            </div>

            <div class="rounded-lg border border-slate-200 overflow-hidden">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr class="text-left text-sm font-semibold text-slate-700">
                    <th class="px-4 py-3">Producto</th>
                    <th class="px-4 py-3">Cantidad</th>
                    <th class="px-4 py-3">Costo unitario</th>
                    <th class="px-4 py-3">Descuento</th>
                    <th class="px-4 py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  <tr v-for="detalle in selectedEntrada.detalles" :key="detalle.id">
                    <td class="px-4 py-3 text-sm text-slate-800">
                      {{ detalle.producto.nombre }}
                      <span class="text-slate-500">({{ detalle.producto.codigo }})</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      {{ Number(detalle.cantidad).toFixed(3) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      ${{ Number(detalle.costoUnitario).toFixed(2) }}
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
                  ${{ Number(selectedEntrada.subtotal).toFixed(2) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-slate-500">Descuento</p>
                <p class="text-lg font-semibold text-slate-800">
                  ${{ Number(selectedEntrada.descuento).toFixed(2) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-slate-500">Total</p>
                <p class="text-xl font-bold text-green-700">
                  ${{ Number(selectedEntrada.total).toFixed(2) }}
                </p>
              </div>
            </div>

            <div
              v-if="selectedEntrada.estado === 'COMPLETADA'"
              class="flex justify-end pt-4"
            >
              <button
                type="button"
                class="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                @click="anularEntrada(selectedEntrada)"
              >
                Anular entrada
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </section>
</template>
