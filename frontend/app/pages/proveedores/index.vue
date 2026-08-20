<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import type { ApiResponse, Proveedor } from "~/types/producto";

const authStore = useAuthStore();
const { $api } = useNuxtApp();

const form = reactive({
  nombre: "",
  identificacion: "",
  telefono: "",
  email: "",
  direccion: "",
  observaciones: "",
});

const editingId = ref<string | null>(null);
const formMessage = ref("");
const showModal = ref(false);

const loadProveedores = async () => {
  const response = await $api<ApiResponse<Proveedor[]>>("/proveedores");
  return response.data;
};

const {
  data: proveedoresData,
  pending: proveedoresPending,
  refresh: refreshProveedores,
} = await useAsyncData(
  `proveedores-${authStore.usuario?.negocioId ?? "guest"}`,
  loadProveedores
);

const proveedores = computed(() => proveedoresData.value ?? []);

const resetForm = () => {
  form.nombre = "";
  form.identificacion = "";
  form.telefono = "";
  form.email = "";
  form.direccion = "";
  form.observaciones = "";
  editingId.value = null;
  formMessage.value = "";
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

const fillForm = (proveedor: Proveedor) => {
  editingId.value = proveedor.id;
  form.nombre = proveedor.nombre;
  form.identificacion = proveedor.identificacion ?? "";
  form.telefono = proveedor.telefono ?? "";
  form.email = proveedor.email ?? "";
  form.direccion = proveedor.direccion ?? "";
  form.observaciones = proveedor.observaciones ?? "";
  formMessage.value = "";
  showModal.value = true;
};

const openNew = () => {
  resetForm();
  showModal.value = true;
};

const openEdit = (proveedor: Proveedor) => {
  fillForm(proveedor);
};

const submitProveedor = async () => {
  formMessage.value = "";

  if (!form.nombre) {
    formMessage.value = "El nombre es obligatorio.";
    return;
  }

  if (/^\d+$/.test(form.nombre.trim())) {
    formMessage.value = "El nombre del proveedor no puede ser solo números.";
    return;
  }

  const payload = {
    nombre: form.nombre.trim(),
    identificacion: form.identificacion.trim() || undefined,
    telefono: form.telefono.trim() || undefined,
    email: form.email.trim() || undefined,
    direccion: form.direccion.trim() || undefined,
    observaciones: form.observaciones.trim() || undefined,
  };

  try {
    if (editingId.value) {
      await $api(`/proveedores/${editingId.value}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      await $api("/proveedores", {
        method: "POST",
        body: payload,
      });
    }

    await refreshProveedores();
    closeModal();
  } catch (error: any) {
    formMessage.value =
      error?.data?.message || error?.message || "No se pudo guardar el proveedor";
  }
};

const eliminarProveedor = async (proveedor: Proveedor) => {
  const confirmed = window.confirm(`¿Eliminar el proveedor ${proveedor.nombre}?`);

  if (!confirmed) return;

  try {
    await $api(`/proveedores/${proveedor.id}`, {
      method: "DELETE",
    });

    if (editingId.value === proveedor.id) {
      closeModal();
    }

    await refreshProveedores();
  } catch (error: any) {
    formMessage.value =
      error?.data?.message || error?.message || "No se pudo eliminar el proveedor";
  }
};

const totalProveedores = computed(() => proveedores.value.length);

const proveedoresConEntradas = computed(
  () =>
    proveedores.value.filter((p) => p._count?.entradas && p._count.entradas > 0).length
);

const proveedoresSinEntradas = computed(
  () =>
    proveedores.value.filter((p) => !p._count?.entradas || p._count.entradas === 0).length
);
</script>

<template>
  <section class="space-y-3">
    <div
      class="rounded-lg bg-gradient-to-r from-green-900 to-green-700 p-2 pl-3 text-white shadow-lg flex items-center"
    >
      <p class="text-sm uppercase tracking-[0.3em] text-slate-300 text-white font-medium">
        Proveedores
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Proveedores:</p>
        <p class="text-xl font-bold text-slate-800">{{ totalProveedores }}</p>
      </div>

      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Con entradas:</p>
        <p class="text-xl font-bold text-slate-800">{{ proveedoresConEntradas }}</p>
      </div>

      <div
        class="flex gap-2 aling-center rounded-lg bg-white px-4 py-3 border border-green-400 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Sin entradas:</p>
        <p class="text-xl font-bold text-slate-800">{{ proveedoresSinEntradas }}</p>
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
          Agregar proveedor
        </button>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-green-800">Listado de proveedores</h2>
            <p class="mt-1 text-sm text-slate-500">
              Consulta, edita o elimina proveedores.
            </p>
          </div>

          <div class="text-sm text-slate-500">
            {{
              proveedoresPending
                ? "Cargando proveedores..."
                : `${proveedores.length} registros`
            }}
          </div>
        </div>

        <div class="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr
                class="text-left text-sm font-semibold uppercase tracking-wide text-green-800"
              >
                <th class="px-4 py-3">Proveedor</th>
                <th class="px-4 py-3">Identificación</th>
                <th class="px-4 py-3">Teléfono</th>
                <th class="px-4 py-3">Email</th>
                <th class="px-4 py-3">Dirección</th>
                <th class="px-4 py-3">Entradas</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="!proveedoresPending && proveedores.length === 0">
                <td colspan="8" class="px-4 py-10 text-center text-sm text-slate-500">
                  No hay proveedores registrados todavía.
                </td>
              </tr>

              <tr
                v-for="proveedor in proveedores"
                :key="proveedor.id"
                class="align-center"
              >
                <td class="px-4 py-2">
                  <p class="font-medium text-slate-800">{{ proveedor.nombre }}</p>
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ proveedor.identificacion || "—" }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ proveedor.telefono || "—" }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ proveedor.email || "—" }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ proveedor.direccion || "—" }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                  {{ proveedor._count?.entradas ?? 0 }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      proveedor.estado === 'ACTIVO'
                        ? 'bg-green-100 text-green-700 w-20 justify-center'
                        : 'bg-red-100 text-red-700 w-20 justify-center',
                    ]"
                  >
                    {{ proveedor.estado }}
                  </span>
                </td>

                <td class="px-4 py-2">
                  <div v-if="authStore.isAdmin" class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                      @click="openEdit(proveedor)"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      class="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      @click="eliminarProveedor(proveedor)"
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
              {{ editingId ? "Editar proveedor" : "Nuevo proveedor" }}
            </h3>
            <button type="button" class="text-slate-500" @click="closeModal">✕</button>
          </div>

          <form class="mt-4" @submit.prevent="submitProveedor">
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

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-md font-medium text-slate-700"
                    >Identificación</label
                  >
                  <input
                    v-model="form.identificacion"
                    type="text"
                    class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label class="mb-2 block text-md font-medium text-slate-700"
                    >Teléfono</label
                  >
                  <input
                    v-model="form.telefono"
                    type="text"
                    class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-md font-medium text-slate-700"
                    >Email</label
                  >
                  <input
                    v-model="form.email"
                    type="email"
                    class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label class="mb-2 block text-md font-medium text-slate-700"
                    >Dirección</label
                  >
                  <input
                    v-model="form.direccion"
                    type="text"
                    class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label class="mb-2 block text-md font-medium text-slate-700"
                  >Observaciones</label
                >
                <textarea
                  v-model="form.observaciones"
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
