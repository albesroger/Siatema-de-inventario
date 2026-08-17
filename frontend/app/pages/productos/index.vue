<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import type {
  ApiResponse,
  CategoriaResumen,
  Producto,
  UnidadMedida,
} from "~/types/producto";

const authStore = useAuthStore();
const { $api } = useNuxtApp();

const unidadesMedida: UnidadMedida[] = [
  "UNIDAD",
  "KILOGRAMO",
  "GRAMO",
  "LIBRA",
  "LITRO",
  "MILILITRO",
  "METRO",
  "CENTIMETRO",
  "CAJA",
  "PAQUETE",
  "DOCENA",
];

const form = reactive({
  categoriaId: "",
  codigo: "",
  codigoBarras: "",
  nombre: "",
  descripcion: "",
  unidadMedida: "UNIDAD" as UnidadMedida,
  precioCompra: "",
  precioVenta: "",
  stockMinimo: "",
  stockMaximo: "",
});

const editingId = ref<string | null>(null);
const formMessage = ref("");
const showModal = ref(false);

const loadProductos = async () => {
  const response = await $api<ApiResponse<Producto[]>>("/productos");
  return response.data;
};

const loadCategorias = async () => {
  const response = await $api<ApiResponse<CategoriaResumen[]>>("/categorias");
  return response.data;
};

const {
  data: productosData,
  pending: productosPending,
  refresh: refreshProductos,
} = await useAsyncData(
  `productos-${authStore.usuario?.negocioId ?? "guest"}`,
  loadProductos
);

const {
  data: categoriasData,
  pending: categoriasPending,
  refresh: refreshCategorias,
} = await useAsyncData(
  `categorias-${authStore.usuario?.negocioId ?? "guest"}`,
  loadCategorias
);

const productos = computed(() => productosData.value ?? []);
const categorias = computed(() => categoriasData.value ?? []);

const money = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return undefined;
  }

  return Number(normalized);
};

const resetForm = () => {
  form.categoriaId = "";
  form.codigo = "";
  form.codigoBarras = "";
  form.nombre = "";
  form.descripcion = "";
  form.unidadMedida = "UNIDAD";
  form.precioCompra = "";
  form.precioVenta = "";
  form.stockMinimo = "";
  form.stockMaximo = "";
  editingId.value = null;
  formMessage.value = "";
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

const fillForm = (producto: Producto) => {
  editingId.value = producto.id;
  form.categoriaId = producto.categoriaId;
  form.codigo = producto.codigo;
  form.codigoBarras = producto.codigoBarras ?? "";
  form.nombre = producto.nombre;
  form.descripcion = producto.descripcion ?? "";
  form.unidadMedida = producto.unidadMedida as UnidadMedida;
  form.precioCompra = String(producto.precioCompra);
  form.precioVenta = String(producto.precioVenta);
  form.stockMinimo = String(producto.stockMinimo);
  form.stockMaximo = producto.stockMaximo ? String(producto.stockMaximo) : "";
  formMessage.value = "";
  showModal.value = true;
};

const openNew = () => {
  resetForm();
  showModal.value = true;
};

const openEdit = (producto: Producto) => {
  fillForm(producto);
};

const submitProducto = async () => {
  formMessage.value = "";

  if (
    !form.categoriaId ||
    !form.codigo ||
    !form.nombre ||
    !form.precioCompra ||
    !form.precioVenta
  ) {
    formMessage.value = "Completa los campos obligatorios.";
    return;
  }

  if (/^\d+$/.test(form.nombre.trim())) {
    formMessage.value = "El nombre del producto no puede ser solo números.";
    return;
  }

  const payload = {
    categoriaId: form.categoriaId,
    codigo: form.codigo.trim(),
    codigoBarras: form.codigoBarras.trim() || undefined,
    nombre: form.nombre.trim(),
    descripcion: form.descripcion.trim() || undefined,
    unidadMedida: form.unidadMedida,
    precioCompra: numberValue(form.precioCompra),
    precioVenta: numberValue(form.precioVenta),
    stockMinimo: numberValue(form.stockMinimo),
    stockMaximo: numberValue(form.stockMaximo),
  };

  try {
    if (editingId.value) {
      await $api(`/productos/${editingId.value}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      await $api("/productos", {
        method: "POST",
        body: payload,
      });
    }

    await refreshProductos();
    closeModal();
  } catch (error: any) {
    formMessage.value =
      error?.data?.message || error?.message || "No se pudo guardar el producto";
  }
};

const eliminarProducto = async (producto: Producto) => {
  const confirmed = window.confirm(`¿Eliminar el producto ${producto.nombre}?`);

  if (!confirmed) return;

  try {
    await $api(`/productos/${producto.id}`, {
      method: "DELETE",
    });

    if (editingId.value === producto.id) {
      closeModal();
    }

    await refreshProductos();
  } catch (error: any) {
    formMessage.value =
      error?.data?.message || error?.message || "No se pudo eliminar el producto";
  }
};

const totalProductos = computed(() => productos.value.length);

const totalProductosInactivos = computed(
  () => productos.value.filter((p) => p.estado === "INACTIVO").length
);

const stockBajo = computed(
  () =>
    productos.value.filter(
      (producto) => Number(producto.stockActual) <= Number(producto.stockMinimo)
    ).length
);

const categoriaNombre = (categoriaId: string) => {
  return (
    categorias.value.find((categoria) => categoria.id === categoriaId)?.nombre ||
    "Sin categoría"
  );
};
</script>

<template>
  <section class="space-y-3">
    <div
      class="rounded-lg bg-gradient-to-r from-green-900 to-green-700 p-2 pl-3 text-white shadow-lg flex items-center"
    >
      <p class="text-sm uppercase tracking-[0.3em] text-slate-300 text-white font-medium">
        Productos
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <div class="rounded-lg bg-white p-5 py-2 shadow-sm ring-1 ring-slate-200">
        <p class="text-lg text-slate-700 font-medium">Productos activos:</p>
        <p class="mt-2 text-2xl font-bold text-slate-800">{{ totalProductos }}</p>
      </div>

      <div class="rounded-lg bg-white p-5 py-2 shadow-sm ring-1 ring-slate-200">
        <p class="text-lg text-slate-700 font-medium">Categorías disponibles:</p>
        <p class="mt-2 text-2xl font-bold text-slate-800">{{ categorias.length }}</p>
      </div>

      <div class="rounded-lg bg-white p-5 py-2 shadow-sm ring-1 ring-slate-200">
        <p class="text-lg text-slate-700 font-medium">Stock bajo:</p>
        <p class="mt-2 text-2xl font-bold text-slate-800">{{ stockBajo }}</p>
      </div>

      <div class="rounded-lg bg-white p-5 py-2 shadow-sm ring-1 ring-slate-200">
        <p class="text-lg text-slate-700 font-medium">Productos inactivos:</p>
        <p class="mt-2 text-2xl font-bold text-slate-800">
          {{ totalProductosInactivos }}
        </p>
      </div>
    </div>

    <div class="space-y-4">
      <div
        class="rounded-lg bg-white p-2 pl-3 shadow-sm ring-1 ring-slate-200 flex flex-col justify-center items-start gap-4"
      >
        <button
          class="rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
          @click="openNew"
        >
          Agregar producto
        </button>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-green-800">Listado de productos</h2>
            <p class="mt-1 text-sm text-slate-500">
              Consulta, edita o elimina productos activos.
            </p>
          </div>

          <div class="text-sm text-slate-500">
            {{
              productosPending ? "Cargando productos..." : `${productos.length} registros`
            }}
          </div>
        </div>

        <div class="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr
                class="text-left text-sm font-semibold uppercase tracking-wide text-green-800"
              >
                <th class="px-4 py-3">Producto</th>
                <th class="px-4 py-3">Código</th>
                <th class="px-4 py-3">Categoría</th>
                <th class="px-4 py-3">Stock</th>
                <th class="px-4 py-3">Precios</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="!productosPending && productos.length === 0">
                <td colspan="7" class="px-4 py-10 text-center text-sm text-slate-500">
                  No hay productos registrados todavía.
                </td>
              </tr>

              <tr v-for="producto in productos" :key="producto.id" class="align-top">
                <td class="px-4 py-2">
                  <p class="font-semibold text-slate-800">{{ producto.nombre }}</p>
                </td>

                <td class="px-4 py-2">
                  <p class="text-sm text-slate-600 font-medium">{{ producto.codigo }}</p>
                  <p class="text-xs text-slate-400">{{ producto.unidadMedida }}</p>
                </td>

                <td class="px-4 py-2 text-sm text-slate-700 font-medium">
                  {{
                    producto.categoria?.nombre || categoriaNombre(producto.categoriaId)
                  }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  <p class="text-slate-700 font-medium">
                    Actual: {{ producto.stockActual }}
                  </p>
                  <p>Mín: {{ producto.stockMinimo }}</p>
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  <p>Compra: {{ money.format(Number(producto.precioCompra)) }}</p>
                  <p>Venta: {{ money.format(Number(producto.precioVenta)) }}</p>
                </td>

                <td class="px-4 py-4 text-sm text-slate-600 font-medium">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      producto.estado === 'ACTIVO'
                        ? 'bg-green-100 text-green-700 w-20 justify-center'
                        : 'bg-red-100 text-red-700 w-20 justify-center',
                    ]"
                  >
                    {{ producto.estado }}
                  </span>
                </td>

                <td class="px-4 py-2">
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                      @click="openEdit(producto)"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      class="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      @click="eliminarProducto(producto)"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal (teleport) -->
    <teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>

        <div class="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-green-700">
              {{ editingId ? "Editar producto" : "Nuevo producto" }}
            </h3>
            <button type="button" class="text-slate-500" @click="closeModal">✕</button>
          </div>

          <form class="mt-4" @submit.prevent="submitProducto">
            <div class="space-y-4">
              <div>
                <label class="mb-2 block text-md font-medium text-slate-700"
                  >Categoría *</label
                >
                <select
                  v-model="form.categoriaId"
                  class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Selecciona una categoría</option>
                  <option
                    v-for="categoria in categorias"
                    :key="categoria.id"
                    :value="categoria.id"
                  >
                    {{ categoria.nombre }}
                  </option>
                </select>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-md font-medium text-slate-700"
                    >Código *</label
                  >
                  <input
                    v-model="form.codigo"
                    type="text"
                    class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label class="mb-2 block text-md font-medium text-slate-700"
                    >Código barras</label
                  >
                  <input
                    v-model="form.codigoBarras"
                    type="text"
                    class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label class="mb-2 block text-md font-medium text-slate-700"
                  >Nombre *</label
                >
                <input
                  v-model="form.nombre"
                  type="text"
                  class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label class="mb-2 block text-md font-medium text-slate-700"
                  >Descripción</label
                >
                <textarea
                  v-model="form.descripcion"
                  rows="3"
                  class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                ></textarea>
              </div>

              <div>
                <label class="mb-2 block text-md font-medium text-slate-700"
                  >Unidad de medida</label
                >
                <select
                  v-model="form.unidadMedida"
                  class="w-full text-sm rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option v-for="unidad in unidadesMedida" :key="unidad" :value="unidad">
                    {{ unidad }}
                  </option>
                </select>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-md font-medium text-slate-700"
                    >Precio compra *</label
                  >
                  <input
                    v-model="form.precioCompra"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label class="mb-2 block text-md font-medium text-slate-700"
                    >Precio venta *</label
                  >
                  <input
                    v-model="form.precioVenta"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-md font-medium text-slate-700"
                    >Stock mínimo</label
                  >
                  <input
                    v-model="form.stockMinimo"
                    type="number"
                    min="0"
                    step="0.001"
                    class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label class="mb-2 block text-md font-medium text-slate-700"
                    >Stock máximo</label
                  >
                  <input
                    v-model="form.stockMaximo"
                    type="number"
                    min="0"
                    step="0.001"
                    class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div
                v-if="formMessage"
                class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                {{ formMessage }}
              </div>

              <div class="flex gap-2 pt-4">
                <button
                  type="submit"
                  class="rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2 font-semibold text-white"
                >
                  {{ editingId ? "Actualizar" : "Guardar" }}
                </button>
                <button
                  type="button"
                  class="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100"
                  @click="closeModal"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </teleport>
  </section>
</template>
