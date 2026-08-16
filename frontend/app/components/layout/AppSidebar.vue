<script setup lang="ts">
const authStore = useAuthStore();

const navigation = [
  { label: "Inicio", to: "/" },
  { label: "Productos", to: "/productos" },
  { label: "Proveedores", to: "/proveedores" },
  { label: "Ventas", to: "/ventas" },
  { label: "Inventario", to: "/inventario" },
];

const route = useRoute();
</script>

<template>
  <aside class="sticky top-0 flex h-screen flex-col bg-slate-950 text-white">
    <div class="border-b border-white/10 px-6 py-5">
      <p class="text-xs uppercase tracking-[0.3em] text-slate-400">{{ authStore.negocioNombre }}</p>
      <h1 class="mt-2 text-xl font-bold">Inventario</h1>
      <p class="mt-1 text-sm text-slate-400">Panel administrativo</p>
    </div>

    <nav class="flex-1 space-y-1 px-3 py-5">
      <NuxtLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        class="flex items-center rounded-xl px-4 py-3 text-sm font-medium transition"
        :class="route.path === item.to ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'"
      >
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="border-t border-white/10 px-6 py-5">
      <p class="text-sm text-slate-300">Gestión rápida y ordenada</p>
      <p class="mt-1 text-xs text-slate-500">Inventario • ventas • ajustes</p>
    </div>
  </aside>
</template>