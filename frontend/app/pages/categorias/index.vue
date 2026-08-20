<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import type { ApiResponse, CategoriaResumen } from "~/types/producto";

const authStore = useAuthStore();
const { $api } = useNuxtApp();

const form = reactive({
  nombre: "",
  descripcion: "",
});

const editingId = ref<string | null>(null);
const formMessage = ref("");
const showModal = ref(false);

const loadCategorias = async () => {
  const response = await $api<ApiResponse<CategoriaResumen[]>>("/categorias");
  return response.data;
};

const {
  data: categoriasData,
  pending: categoriasPending,
  refresh: refreshCategorias,
} = await useAsyncData(
  `categorias-${authStore.usuario?.negocioId ?? "guest"}`,
  loadCategorias
);

const categorias = computed(() => categoriasData.value ?? []);

const resetForm = () => {
  form.nombre = "";
  form.descripcion = "";
  editingId.value = null;
  formMessage.value = "";
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

const fillForm = (categoria: CategoriaResumen) => {
  editingId.value = categoria.id;
  form.nombre = categoria.nombre;
  form.descripcion = categoria.descripcion ?? "";
  formMessage.value = "";
  showModal.value = true;
};

const openNew = () => {
  resetForm();
  showModal.value = true;
};

const openEdit = (categoria: CategoriaResumen) => {
  fillForm(categoria);
};

const submitCategoria = async () => {
  formMessage.value = "";

  if (!form.nombre) {
    formMessage.value = "El nombre es obligatorio.";
    return;
  }

  if (/^\d+$/.test(form.nombre.trim())) {
    formMessage.value = "El nombre de la categoría no puede ser solo números.";
    return;
  }

  const payload = {
    nombre: form.nombre.trim(),
    descripcion: form.descripcion.trim() || undefined,
  };

  try {
    if (editingId.value) {
      await $api(`/categorias/${editingId.value}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      await $api("/categorias", {
        method: "POST",
        body: payload,
      });
    }

    await refreshCategorias();
    closeModal();
  } catch (error: any) {
    formMessage.value =
      error?.data?.message || error?.message || "No se pudo guardar la categoría";
  }
};

const eliminarCategoria = async (categoria: CategoriaResumen) => {
  const confirmed = window.confirm(`¿Eliminar la categoría ${categoria.nombre}?`);
  if (!confirmed) return;

  try {
    await $api(`/categorias/${categoria.id}`, { method: "DELETE" });
    await refreshCategorias();
  } catch (error: any) {
    formMessage.value =
      error?.data?.message || error?.message || "No se pudo eliminar la categoría";
  }
};
</script>

<template>
  <section class="space-y-3">
    <div
      class="rounded-lg bg-gradient-to-r from-green-900 to-green-700 p-2 pl-3 text-white shadow-lg flex items-center"
    >
      <p class="text-sm uppercase tracking-[0.3em] text-slate-300 text-white font-medium">
        Categorías
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Categorías:</p>
        <p class="text-xl font-bold text-slate-800">{{ categorias.length }}</p>
      </div>

      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Con productos:</p>
        <p class="text-xl font-bold text-slate-800">
          {{
            categorias.filter((c) => c._count?.productos && c._count.productos > 0).length
          }}
        </p>
      </div>

      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Sin productos:</p>
        <p class="text-xl font-bold text-slate-800">
          {{
            categorias.filter((c) => !c._count?.productos || c._count.productos === 0)
              .length
          }}
        </p>
      </div>
    </div>

    <div class="space-y-4">
      <div
        class="rounded-lg bg-white p-2 pl-3 shadow-sm ring-1 ring-slate-200 flex flex-col justify-center items-start gap-4"
      >
        <button
          v-if="authStore.isAdmin"
          class="rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
          @click="openNew"
        >
          Agregar categoría
        </button>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-green-800">Listado de categorías</h2>
            <p class="mt-1 text-sm text-slate-500">
              Consulta, edita o elimina categorías.
            </p>
          </div>

          <div class="text-lg text-slate-700 font-medium">
            {{
              categoriasPending
                ? "Cargando categorías..."
                : `${categorias.length} registros`
            }}
          </div>
        </div>

        <div class="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr
                class="text-left text-sm font-semibold uppercase tracking-wide text-green-800"
              >
                <th class="px-4 py-3">Categoría</th>
                <th class="px-4 py-3">Descripción</th>
                <th class="px-4 py-3">Productos</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="!categoriasPending && categorias.length === 0">
                <td
                  colspan="4"
                  class="px-4 py-10 text-center text-lg text-slate-700 font-medium"
                >
                  No hay categorías registradas todavía.
                </td>
              </tr>

              <tr
                v-for="categoria in categorias"
                :key="categoria.id"
                class="align-center"
              >
                <td class="px-4 py-2">
                  <p class="font-medium text-slate-800">{{ categoria.nombre }}</p>
                </td>

                <td class="px-4 py-2 text-md text-slate-600">
                  {{ categoria.descripcion || "—" }}
                </td>

                <td class="px-4 py-2 text-md font-medium text-slate-600">
                  {{ categoria._count?.productos ?? 0 }}
                </td>

                <td class="px-4 py-2 text-md text-slate-600 font-medium">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      categoria.estado === 'ACTIVO'
                        ? 'bg-green-100 text-green-700 w-20 justify-center'
                        : 'bg-red-100 text-red-700 w-20 justify-center',
                    ]"
                  >
                    {{ categoria.estado }}
                  </span>
                </td>

                <td class="px-4 py-2">
                  <div v-if="authStore.isAdmin" class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                      @click="openEdit(categoria)"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      @click="eliminarCategoria(categoria)"
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

    <!-- Modal -->
    <teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>

        <div class="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-green-700">
              {{ editingId ? "Editar categoría" : "Nueva categoría" }}
            </h3>
            <button type="button" class="text-slate-500" @click="closeModal">✕</button>
          </div>

          <form class="mt-4" @submit.prevent="submitCategoria">
            <div class="space-y-4">
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
