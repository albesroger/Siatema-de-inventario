<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const authStore = useAuthStore();
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <header class="bg-white border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-slate-900">Sistema de Inventario</h1>

          <p class="text-sm text-slate-500">Panel principal</p>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="font-medium text-slate-900">
              {{ authStore.usuario?.nombre }}
            </p>

            <p class="text-sm text-slate-500">
              {{ authStore.usuario?.rol }}
            </p>
          </div>

          <button
            class="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            @click="authStore.logout"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-10">
      <h2 class="text-2xl font-bold text-slate-900">
        Bienvenido, {{ authStore.usuario?.nombre }}
      </h2>

      <p class="mt-2 text-slate-600">Selecciona un módulo para comenzar.</p>
    </main>
  </div>
</template>
