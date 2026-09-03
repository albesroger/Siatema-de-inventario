<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import type { ApiResponse, Entrada, Producto, Proveedor } from "~/types/producto";

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

// ========================================================
// NUEVA ENTRADA
// ========================================================

const showNewEntradaModal = ref(false);
const dispositivosDisponibles = ref<{ id: string; nombre: string }[]>([]);
const proveedoresDisponibles = ref<Proveedor[]>([]);
const productosDisponibles = ref<Producto[]>([]);
const selectedDispositivoId = ref("");
const proveedorId = ref("");
const numeroDocumento = ref("");
const descuentoEntrada = ref(0);
const observacionesEntrada = ref("");
const productoSeleccionadoId = ref("");
const cantidadEntrada = ref(1);
const costoUnitarioEntrada = ref(0);
const detallesEntrada = ref<
  {
    id: string;
    productoId: string;
    cantidad: number;
    costoUnitario: number;
    descuento: number;
  }[]
>([]);
const formMessage = ref("");

const loadDispositivosEntrada = async () => {
  const response = await $api<ApiResponse<{ id: string; nombre: string; estado: string }[]>>(
    "/dispositivos"
  );
  dispositivosDisponibles.value = response.data.filter((d) => d.estado === "ACTIVO");
};

const loadProveedoresEntrada = async () => {
  const response = await $api<ApiResponse<Proveedor[]>>("/proveedores");
  proveedoresDisponibles.value = response.data.filter((p) => p.estado === "ACTIVO");
};

const loadProductosEntrada = async () => {
  const response = await $api<ApiResponse<Producto[]>>("/productos");
  productosDisponibles.value = response.data.filter((p) => p.estado === "ACTIVO");
};

// Escáner de código de barras (USB tipo teclado)
const scanEntradaRef = ref<HTMLInputElement | null>(null);

watch(scanEntradaRef, (el) => {
  if (el) el.focus();
});

const scanEntradaInput = ref("");
const scanEntradaMsg = ref("");

const procesarScanEntrada = () => {
  const codigo = scanEntradaInput.value.trim();
  scanEntradaMsg.value = "";
  if (!codigo) return;

  const producto = productosDisponibles.value.find(
    (p) =>
      (p.codigoBarras && p.codigoBarras === codigo) ||
      p.codigo === codigo
  );

  if (!producto) {
    scanEntradaMsg.value = `No se encontró ningún producto con el código: ${codigo}`;
    scanEntradaInput.value = "";
    return;
  }

  productoSeleccionadoId.value = producto.id;
  cantidadEntrada.value = 1;
  agregarProductoEntrada();
  scanEntradaInput.value = "";
  nextTick(() => scanEntradaRef.value?.focus());
};

const openNewEntrada = async () => {
  formMessage.value = "";
  detallesEntrada.value = [];
  proveedorId.value = "";
  numeroDocumento.value = "";
  descuentoEntrada.value = 0;
  observacionesEntrada.value = "";
  selectedDispositivoId.value = "";
  showNewEntradaModal.value = true;
  await Promise.all([
    loadDispositivosEntrada(),
    loadProveedoresEntrada(),
    loadProductosEntrada(),
  ]);
  nextTick(() => scanEntradaRef.value?.focus());
};

const closeNewEntrada = () => {
  showNewEntradaModal.value = false;
  formMessage.value = "";
};

const agregarProductoEntrada = () => {
  formMessage.value = "";

  if (!productoSeleccionadoId.value) {
    formMessage.value = "Selecciona un producto.";
    return;
  }

  if (detallesEntrada.value.some((d) => d.productoId === productoSeleccionadoId.value)) {
    formMessage.value = "El producto ya está en la entrada.";
    return;
  }

  const cantidad = Number(cantidadEntrada.value);

  if (cantidad <= 0) {
    formMessage.value = "La cantidad debe ser mayor a 0.";
    return;
  }

  const costo = Number(costoUnitarioEntrada.value);

  if (costo < 0) {
    formMessage.value = "El costo unitario no puede ser negativo.";
    return;
  }

  detallesEntrada.value.push({
    id: crypto.randomUUID(),
    productoId: productoSeleccionadoId.value,
    cantidad,
    costoUnitario: costo,
    descuento: 0,
  });

  productoSeleccionadoId.value = "";
  cantidadEntrada.value = 1;
  costoUnitarioEntrada.value = 0;
};

const eliminarDetalleEntrada = (id: string) => {
  detallesEntrada.value = detallesEntrada.value.filter((d) => d.id !== id);
};

const nombreProductoEntrada = (productoId: string) =>
  productosDisponibles.value.find((p) => p.id === productoId)?.nombre || "—";

const subtotalDetalleEntrada = (detalle: {
  cantidad: number;
  costoUnitario: number;
  descuento: number;
}) => Math.max(0, detalle.cantidad * detalle.costoUnitario - detalle.descuento);

const subtotalEntradas = computed(() =>
  detallesEntrada.value.reduce((sum, detalle) => sum + subtotalDetalleEntrada(detalle), 0)
);

const totalEntradasCalculado = computed(() =>
  Math.max(0, subtotalEntradas.value - Number(descuentoEntrada.value))
);

const submitEntrada = async () => {
  formMessage.value = "";

  if (detallesEntrada.value.length === 0) {
    formMessage.value = "Agrega al menos un producto a la entrada.";
    return;
  }

  if (!selectedDispositivoId.value) {
    formMessage.value = "Selecciona un dispositivo.";
    return;
  }

  const payload = {
    proveedorId: proveedorId.value || undefined,
    dispositivoId: selectedDispositivoId.value,
    numeroDocumento: numeroDocumento.value.trim() || undefined,
    descuento: Number(descuentoEntrada.value),
    observaciones: observacionesEntrada.value.trim() || undefined,
    detalles: detallesEntrada.value.map((d) => ({
      productoId: d.productoId,
      cantidad: Number(d.cantidad),
      costoUnitario: Number(d.costoUnitario),
      descuento: Number(d.descuento),
    })),
  };

  try {
    await $api("/entradas", {
      method: "POST",
      body: payload,
    });

    await loadEntradas();
    closeNewEntrada();
  } catch (error: any) {
    formMessage.value =
      error?.data?.message || error?.message || "No se pudo registrar la entrada";
  }
};
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
      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Total entradas:</p>
        <p class="text-xl font-bold text-slate-800">{{ totalEntradas }}</p>
      </div>

      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Completadas:</p>
        <p class="text-xl font-bold text-green-600">{{ entradasCompletadas }}</p>
      </div>

      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Anuladas:</p>
        <p class="text-xl font-bold text-red-600">{{ entradasAnuladas }}</p>
      </div>
    </div>

    <div class="space-y-4">
      <div
        class="rounded-lg bg-white p-2 pl-3 shadow-sm ring-1 ring-slate-200 flex flex-col justify-center items-start gap-4"
      >
        <button
          class="rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
          @click="openNewEntrada"
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

    <!-- Modal: Nueva entrada -->
    <teleport to="body">
      <div
        v-if="showNewEntradaModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/50" @click="closeNewEntrada"></div>

        <div
          class="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lg"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-green-700">Nueva entrada</h3>
            <button type="button" class="text-slate-500" @click="closeNewEntrada">✕</button>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-md font-medium text-slate-700"
                >Dispositivo *</label
              >
              <select
                v-model="selectedDispositivoId"
                class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Selecciona un dispositivo</option>
                <option
                  v-for="dispositivo in dispositivosDisponibles"
                  :key="dispositivo.id"
                  :value="dispositivo.id"
                >
                  {{ dispositivo.nombre }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-2 block text-md font-medium text-slate-700"
                >Proveedor</label
              >
              <select
                v-model="proveedorId"
                class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Sin proveedor</option>
                <option
                  v-for="proveedor in proveedoresDisponibles"
                  :key="proveedor.id"
                  :value="proveedor.id"
                >
                  {{ proveedor.nombre }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-2 block text-md font-medium text-slate-700"
                >Número de documento</label
              >
              <input
                v-model="numeroDocumento"
                type="text"
                class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label class="mb-2 block text-md font-medium text-slate-700"
                >Descuento general</label
              >
              <input
                v-model.number="descuentoEntrada"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div class="md:col-span-2">
              <label class="mb-2 block text-md font-medium text-slate-700"
                >Observaciones</label
              >
              <textarea
                v-model="observacionesEntrada"
                rows="2"
                class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              ></textarea>
            </div>
          </div>

          <div class="mt-4 rounded-lg border border-slate-200 p-4">
            <p class="text-sm font-semibold text-slate-700 mb-3">Agregar productos</p>

            <div class="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <label class="mb-1 block text-xs font-medium text-slate-600"
                >Escáner de código de barras</label
              >
              <input
                ref="scanEntradaRef"
                v-model="scanEntradaInput"
                type="text"
                :autofocus="true"
                class="w-full rounded-xl border border-blue-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Escanea un código de barras y presiona Enter..."
                @keydown.enter="procesarScanEntrada"
              />
              <p v-if="scanEntradaMsg" class="mt-1 text-xs text-red-600">
                {{ scanEntradaMsg }}
              </p>
              <p v-else class="mt-1 text-xs text-slate-500">
                Escanea el código del producto para agregarlo automáticamente al detalle.
              </p>
            </div>

            <div class="grid gap-3 md:grid-cols-4">
              <div>
                <select
                  v-model="productoSeleccionadoId"
                  class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Selecciona un producto</option>
                  <option
                    v-for="producto in productosDisponibles"
                    :key="producto.id"
                    :value="producto.id"
                  >
                    {{ producto.nombre }}
                  </option>
                </select>
              </div>

              <div>
                <input
                  v-model.number="cantidadEntrada"
                  type="number"
                  min="1"
                  step="0.001"
                  placeholder="Cantidad"
                  class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <input
                  v-model.number="costoUnitarioEntrada"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Costo unitario"
                  class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <button
                  type="button"
                  class="w-full rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
                  @click="agregarProductoEntrada"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-sm font-semibold text-slate-700 mb-2">Detalles</p>

            <div class="overflow-hidden rounded-lg border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr class="text-left text-sm font-semibold text-slate-700">
                    <th class="px-4 py-3">Producto</th>
                    <th class="px-4 py-3">Cantidad</th>
                    <th class="px-4 py-3">Costo unit.</th>
                    <th class="px-4 py-3">Subtotal</th>
                    <th class="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  <tr v-if="detallesEntrada.length === 0">
                    <td colspan="5" class="px-4 py-8 text-center text-sm text-slate-500">
                      No hay productos agregados todavía.
                    </td>
                  </tr>
                  <tr v-for="detalle in detallesEntrada" :key="detalle.id">
                    <td class="px-4 py-2 text-sm text-slate-800">
                      {{ nombreProductoEntrada(detalle.productoId) }}
                    </td>
                    <td class="px-4 py-2 text-sm text-slate-600">
                      {{ Number(detalle.cantidad).toFixed(3) }}
                    </td>
                    <td class="px-4 py-2 text-sm text-slate-600">
                      ${{ Number(detalle.costoUnitario).toFixed(2) }}
                    </td>
                    <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                      ${{ subtotalDetalleEntrada(detalle).toFixed(2) }}
                    </td>
                    <td class="px-4 py-2 text-right">
                      <button
                        type="button"
                        class="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50"
                        @click="eliminarDetalleEntrada(detalle.id)"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="mt-4 flex justify-end">
            <div class="text-right">
              <p class="text-sm text-slate-500">
                Subtotal: ${{ subtotalEntradas.toFixed(2) }}
              </p>
              <p class="text-xl font-bold text-green-700">
                Total: ${{ totalEntradasCalculado.toFixed(2) }}
              </p>
            </div>
          </div>

          <div
            v-if="formMessage"
            class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {{ formMessage }}
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100"
              @click="closeNewEntrada"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2 font-semibold text-white"
              @click="submitEntrada"
            >
              Registrar entrada
            </button>
          </div>
        </div>
      </div>
    </teleport>

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
