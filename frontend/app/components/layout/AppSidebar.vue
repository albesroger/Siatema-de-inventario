<script setup lang="ts">
const authStore = useAuthStore();

const navigation = [
  { label: "Dashboard", to: "/" },
  { label: "Ventas", to: "/ventas" },
  { label: "Productos", to: "/productos" },
  { label: "Entradas", to: "/entradas" },
  { label: "Salidas", to: "/salidas" },
  { label: "Categorías", to: "/categorias" },
  { label: "Proveedores", to: "/proveedores" },
  { label: "Movimientos", to: "/movimientos" },
  { label: "Ajustes de inventario", to: "/ajustes-inventario" },
];

const route = useRoute();

const isActive = (to: string) => {
  if (to === "/") {
    return route.path === "/";
  }

  return route.path === to || route.path.startsWith(`${to}/`);
};
</script>

<template>
  <aside class="sticky top-0 flex h-screen flex-col bg-[#064028] text-white">
    <div class="border-b border-white/10 px-6 py-5 space-y-1">
      <p class="text-md uppercase tracking-[0.3em] text-white">
        {{ authStore.negocioNombre }}
      </p>
      <p class="mt-1 text-sm text-white">Panel administrativo</p>
    </div>

    <nav class="flex-1 space-y-1 px-3 py-5">
      <NuxtLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        class="flex items-center rounded-xl px-4 py-3 text-sm font-medium transition text-white"
        :class="
          isActive(item.to)
            ? 'bg-[#064078] text-white'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        "
      >
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="border-t border-white/10 px-6 py-5">
      <p class="text-sm text-white">Gestión rápida y ordenada</p>
      <p class="mt-1 text-xs text-white">Inventario • ventas • ajustes</p>
    </div>
  </aside>
</template>
