<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import type { ApiResponse, Ajuste, ProductoParaVenta } from "~/types/producto";

const authStore = useAuthStore();
const { $api } = useNuxtApp();

const ajustes = ref<Ajuste[]>([]);
const ajustesPending = ref(true);
const showDetailModal = ref(false);
const selectedAjuste = ref<Ajuste | null>(null);
const showCreateModal = ref(false);

const filtroTipo = ref<"TODOS" | "POSITIVO" | "NEGATIVO">("TODOS");

// ========================================================
// FORMULARIO DE NUEVO AJUSTE
// ========================================================

const tipoAjuste = ref<"POSITIVO" | "NEGATIVO">("POSITIVO");
const motivoAjuste = ref<"DIFERENCIA_CONTEO" | "ERROR_REGISTRO" | "CORRECCION" | "OTRO">(
  "DIFERENCIA_CONTEO"
);
const observacionesAjuste = ref("");
const productosDisponibles = ref<ProductoParaVenta[]>([]);
const productoSeleccionadoId = ref("");
const cantidadAjuste = ref(1);
const formMessage = ref("");

const loadProductosParaAjuste = async () => {
  try {
    const response = await $api<ApiResponse<ProductoParaVenta[]>>("/productos");
    productosDisponibles.value = response.data;
  } catch (error: any) {
    console.error("Error al cargar productos:", error);
  }
};

const agregarProductoAlAjuste = () => {
  formMessage.value = "";

  if (!productoSeleccionadoId.value) {
    formMessage.value = "Selecciona un producto.";
    return;
  }

  const producto = productosDisponibles.value.find(
    (p) => p.id === productoSeleccionadoId.value
  );

  if (!producto) {
    formMessage.value = "Producto no encontrado.";
    return;
  }

  const cantidad = Number(cantidadAjuste.value);

  if (cantidad <= 0) {
    formMessage.value = "La cantidad debe ser mayor a 0.";
    return;
  }

  if (tipoAjuste.value === "NEGATIVO" && cantidad > Number(producto.stockActual)) {
    formMessage.value = `Stock insuficiente. Disponible: ${producto.stockActual}`;
    return;
  }

  // Agregar a un array temporal de detalles
  detallesAjuste.value.push({
    productoId: producto.id,
    cantidad: cantidad,
    producto: {
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      unidadMedida: producto.unidadMedida,
    },
  });

  productoSeleccionadoId.value = "";
  cantidadAjuste.value = 1;
  formMessage.value = "";
};

const eliminarProductoDelAjuste = (index: number) => {
  detallesAjuste.value.splice(index, 1);
};

const detallesAjuste = ref<
  {
    productoId: string;
    cantidad: number;
    producto: {
      id: string;
      codigo: string;
      nombre: string;
      unidadMedida: string;
    };
  }[]
>([]);

const submitAjuste = async () => {
  formMessage.value = "";

  if (detallesAjuste.value.length === 0) {
    formMessage.value = "Agrega al menos un producto al ajuste.";
    return;
  }

  try {
    // Obtener dispositivo activo del usuario
    const dispositivos = await $api<ApiResponse<any[]>>("/dispositivos");
    const dispositivo = dispositivos.data.find((d) => d.estado === "ACTIVO");

    if (!dispositivo) {
      alert("No hay un dispositivo activo disponible para crear el ajuste.");
      return;
    }

    await $api("/ajustes", {
      method: "POST",
      body: {
        dispositivoId: dispositivo.id,
        tipo: tipoAjuste.value,
        motivo: motivoAjuste.value,
        observaciones: observacionesAjuste.value || undefined,
        detalles: detallesAjuste.value.map((d) => ({
          productoId: d.productoId,
          cantidad: d.cantidad,
        })),
      },
    });

    // Limpiar formulario
    tipoAjuste.value = "POSITIVO";
    motivoAjuste.value = "DIFERENCIA_CONTEO";
    observacionesAjuste.value = "";
    detallesAjuste.value = [];
    showCreateModal.value = false;

    await loadAjustes();
  } catch (error: any) {
    alert(error?.data?.message || "No se pudo crear el ajuste");
  }
};

const openCreateModal = () => {
  detallesAjuste.value = [];
  tipoAjuste.value = "POSITIVO";
  motivoAjuste.value = "DIFERENCIA_CONTEO";
  observacionesAjuste.value = "";
  formMessage.value = "";
  showCreateModal.value = true;
  loadProductosParaAjuste();
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  detallesAjuste.value = [];
};

// ========================================================
// DATOS
// ========================================================

const loadAjustes = async () => {
  ajustesPending.value = true;
  try {
    const response = await $api<ApiResponse<Ajuste[]>>("/ajustes");
    ajustes.value = response.data;
  } catch (error: any) {
    console.error("Error al cargar ajustes:", error);
  } finally {
    ajustesPending.value = false;
  }
};

onMounted(() => {
  loadAjustes();
});

const ajustesFiltrados = computed(() => {
  if (filtroTipo.value === "TODOS") return ajustes.value;
  return ajustes.value.filter((a) => a.tipo === filtroTipo.value);
});

const verDetalle = (ajuste: Ajuste) => {
  selectedAjuste.value = ajuste;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedAjuste.value = null;
};

const motivoLabels: Record<string, string> = {
  DIFERENCIA_CONTEO: "Diferencia de conteo",
  ERROR_REGISTRO: "Error de registro",
  CORRECCION: "Corrección",
  OTRO: "Otro",
};

const totalAjustes = computed(() => ajustes.value.length);
const ajustesPositivos = computed(
  () => ajustes.value.filter((a) => a.tipo === "POSITIVO").length
);
const ajustesNegativos = computed(
  () => ajustes.value.filter((a) => a.tipo === "NEGATIVO").length
);
</script>

<template>
  <section class="space-y-3">
    <div
      class="rounded-lg bg-gradient-to-r from-green-900 to-green-700 p-2 pl-3 text-white shadow-lg flex items-center"
    >
      <p class="text-sm uppercase tracking-[0.3em] text-slate-300 text-white font-medium">
        Ajustes de inventario
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div
        class="rounded-lg bg-white border border-green-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Total ajustes:</p>
        <p class="mt-2 text-2xl font-bold text-slate-800">{{ totalAjustes }}</p>
      </div>

      <div
        class="rounded-lg bg-white border border-green-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Positivos:</p>
        <p class="mt-2 text-2xl font-bold text-emerald-600">{{ ajustesPositivos }}</p>
      </div>

      <div
        class="rounded-lg bg-white border border-green-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Negativos:</p>
        <p class="mt-2 text-2xl font-bold text-red-600">{{ ajustesNegativos }}</p>
      </div>
    </div>

    <div class="space-y-4">
      <div
        class="rounded-lg bg-white p-2 pl-3 shadow-sm ring-1 ring-slate-200 flex flex-col justify-center items-start gap-4"
      >
        <button
          class="rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
          @click="openCreateModal"
        >
          Nuevo ajuste
        </button>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-green-800">Listado de ajustes</h2>
            <p class="mt-1 text-sm text-slate-500">
              Consulta el historial de ajustes de inventario.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                v-for="tipo in ['TODOS', 'POSITIVO', 'NEGATIVO']"
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
                {{
                  tipo === "TODOS"
                    ? "Todos"
                    : tipo === "POSITIVO"
                    ? "Positivos"
                    : "Negativos"
                }}
              </button>
            </div>
          </div>

          <div class="text-sm text-slate-500">
            {{
              ajustesPending
                ? "Cargando ajustes..."
                : `${ajustesFiltrados.length} registros`
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
                <th class="px-4 py-3">Tipo</th>
                <th class="px-4 py-3">Motivo</th>
                <th class="px-4 py-3">Productos</th>
                <th class="px-4 py-3">Usuario</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="!ajustesPending && ajustesFiltrados.length === 0">
                <td colspan="8" class="px-4 py-10 text-center text-sm text-slate-500">
                  No hay ajustes registrados todavía.
                </td>
              </tr>

              <tr
                v-for="ajuste in ajustesFiltrados"
                :key="ajuste.id"
                class="align-center"
              >
                <td class="px-4 py-2">
                  <p class="font-medium text-slate-800 text-sm">
                    #{{ ajuste.numero.toString() }}
                  </p>
                </td>

                <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      ajuste.tipo === 'POSITIVO'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700',
                    ]"
                  >
                    {{ ajuste.tipo }}
                  </span>
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ motivoLabels[ajuste.motivo] || ajuste.motivo }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ ajuste.detalles?.length ?? 0 }} items
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ ajuste.usuario?.nombre || "—" }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      ajuste.estado === 'COMPLETADA'
                        ? 'bg-green-100 text-green-700 justify-center'
                        : 'bg-red-100 text-red-700 justify-center w-24',
                    ]"
                  >
                    {{ ajuste.estado }}
                  </span>
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ new Date(ajuste.createdAt).toLocaleDateString("es-CU") }}
                </td>

                <td class="px-4 py-2">
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                      @click="verDetalle(ajuste)"
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
              Ajuste #{{ selectedAjuste?.numero.toString() }}
            </h3>
            <button type="button" class="text-slate-500" @click="closeDetailModal">
              ✕
            </button>
          </div>

          <div v-if="selectedAjuste" class="mt-4 space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <p class="text-sm font-medium text-slate-500">Tipo</p>
                <span
                  :class="[
                    'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                    selectedAjuste.tipo === 'POSITIVO'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700',
                  ]"
                >
                  {{ selectedAjuste.tipo }}
                </span>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Motivo</p>
                <p class="text-slate-800">
                  {{ motivoLabels[selectedAjuste.motivo] || selectedAjuste.motivo }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Usuario</p>
                <p class="text-slate-800">{{ selectedAjuste.usuario?.nombre || "—" }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Dispositivo</p>
                <p class="text-slate-800">
                  {{ selectedAjuste.dispositivo?.nombre || "—" }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Estado</p>
                <span
                  :class="[
                    'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                    selectedAjuste.estado === 'COMPLETADA'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700',
                  ]"
                >
                  {{ selectedAjuste.estado }}
                </span>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Fecha</p>
                <p class="text-slate-800">
                  {{ new Date(selectedAjuste.createdAt).toLocaleString("es-CU") }}
                </p>
              </div>
            </div>

            <div v-if="selectedAjuste.observaciones" class="rounded-lg bg-slate-50 p-3">
              <p class="text-sm font-medium text-slate-500">Observaciones</p>
              <p class="text-slate-800">{{ selectedAjuste.observaciones }}</p>
            </div>

            <div class="rounded-lg border border-slate-200 overflow-hidden">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr class="text-left text-sm font-semibold text-slate-700">
                    <th class="px-4 py-3">Producto</th>
                    <th class="px-4 py-3">Cantidad</th>
                    <th class="px-4 py-3">Stock anterior</th>
                    <th class="px-4 py-3">Stock nuevo</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  <tr v-for="detalle in selectedAjuste.detalles" :key="detalle.id">
                    <td class="px-4 py-3 text-sm text-slate-800">
                      {{ detalle.producto.nombre }}
                      <span class="text-slate-500">({{ detalle.producto.codigo }})</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      {{ Number(detalle.cantidad).toFixed(3) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      {{ Number(detalle.stockAnterior).toFixed(3) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      {{ Number(detalle.stockNuevo).toFixed(3) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Modal de crear ajuste -->
    <teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/50" @click="closeCreateModal"></div>

        <div
          class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-green-700">
              Nuevo ajuste de inventario
            </h3>
            <button type="button" class="text-slate-500" @click="closeCreateModal">
              ✕
            </button>
          </div>

          <div class="mt-4 space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-slate-700"
                  >Tipo de ajuste</label
                >
                <select
                  v-model="tipoAjuste"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="POSITIVO">Positivo (agregar stock)</option>
                  <option value="NEGATIVO">Negativo (reducir stock)</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700">Motivo</label>
                <select
                  v-model="motivoAjuste"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="DIFERENCIA_CONTEO">Diferencia de conteo</option>
                  <option value="ERROR_REGISTRO">Error de registro</option>
                  <option value="CORRECCION">Corrección</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700"
                >Observaciones (opcional)</label
              >
              <textarea
                v-model="observacionesAjuste"
                rows="2"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Observaciones adicionales..."
              ></textarea>
            </div>

            <div class="rounded-lg border border-slate-200 p-4">
              <p class="text-sm font-semibold text-slate-700 mb-3">Agregar productos</p>

              <div class="grid gap-3 md:grid-cols-3">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-slate-700">Producto</label>
                  <select
                    v-model="productoSeleccionadoId"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar producto...</option>
                    <option
                      v-for="producto in productosDisponibles"
                      :key="producto.id"
                      :value="producto.id"
                    >
                      {{ producto.nombre }} ({{ producto.codigo }}) - Stock:
                      {{ Number(producto.stockActual).toFixed(3) }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700">Cantidad</label>
                  <input
                    v-model.number="cantidadAjuste"
                    type="number"
                    min="0.001"
                    step="0.001"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div class="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  class="rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
                  @click="agregarProductoAlAjuste"
                >
                  Agregar producto
                </button>
              </div>

              <p v-if="formMessage" class="mt-2 text-sm text-red-600">
                {{ formMessage }}
              </p>
            </div>

            <!-- Lista de productos agregados -->
            <div
              v-if="detallesAjuste.length > 0"
              class="rounded-lg border border-slate-200 overflow-hidden"
            >
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr class="text-left text-sm font-semibold text-slate-700">
                    <th class="px-4 py-3">Producto</th>
                    <th class="px-4 py-3">Cantidad</th>
                    <th class="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  <tr v-for="(detalle, index) in detallesAjuste" :key="index">
                    <td class="px-4 py-3 text-sm text-slate-800">
                      {{ detalle.producto.nombre }}
                      <span class="text-slate-500">({{ detalle.producto.codigo }})</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      {{ Number(detalle.cantidad).toFixed(3) }}
                    </td>
                    <td class="px-4 py-3">
                      <button
                        type="button"
                        class="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50"
                        @click="eliminarProductoDelAjuste(index)"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex justify-end gap-2 pt-4">
              <button
                type="button"
                class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                @click="closeCreateModal"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                @click="submitAjuste"
              >
                Guardar ajuste
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </section>
</template>
