<script setup lang="ts">
const authStore = useAuthStore();
</script>

<template>
  <header
    class="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur"
  >
    <div>
      <p class="text-sm font-medium text-slate-500">{{ authStore.negocioNombre }}</p>
      <h2 class="text-lg font-semibold text-slate-900">Sistema de Inventario</h2>
    </div>

    <div class="flex items-center gap-4">
      <div class="text-right">
        <p class="font-medium text-slate-900">{{ authStore.usuario?.nombre }}</p>
        <p class="text-sm text-slate-500">{{ authStore.usuario?.rol }}</p>
      </div>

      <button
        class="rounded-lg bg-green-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        @click="authStore.logout"
      >
        Cerrar sesión
      </button>
    </div>
  </header>
</template>
