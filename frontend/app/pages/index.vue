<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const authStore = useAuthStore();

const quickActions = [
  { title: "Productos", description: "Gestiona tu catálogo principal", to: "/productos" },
  { title: "Proveedores", description: "Controla tus proveedores", to: "/proveedores" },
  { title: "Ventas", description: "Revisa y registra ventas", to: "/ventas" },
  { title: "Inventario", description: "Consulta movimientos y stock", to: "/inventario" },
];
</script>

<template>
  <section class="space-y-8">
    <div class="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-8 text-white shadow-lg">
      <p class="text-sm uppercase tracking-[0.3em] text-slate-300">Bienvenido</p>
      <h1 class="mt-3 text-3xl font-bold">Hola, {{ authStore.usuario?.nombre }}</h1>
      <p class="mt-3 max-w-2xl text-slate-300">
        Este es tu panel de control para administrar productos, ventas, proveedores e inventario.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <NuxtLink
        v-for="action in quickActions"
        :key="action.to"
        :to="action.to"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <h3 class="text-lg font-semibold text-slate-900">{{ action.title }}</h3>
        <p class="mt-2 text-sm text-slate-500">{{ action.description }}</p>
      </NuxtLink>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p class="text-sm text-slate-500">Usuario activo</p>
        <p class="mt-2 text-xl font-semibold text-slate-900">{{ authStore.usuario?.username }}</p>
      </div>

      <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p class="text-sm text-slate-500">Rol</p>
        <p class="mt-2 text-xl font-semibold text-slate-900">{{ authStore.usuario?.rol }}</p>
      </div>

      <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p class="text-sm text-slate-500">Negocio</p>
        <p class="mt-2 text-xl font-semibold text-slate-900">{{ authStore.usuario?.negocioId }}</p>
      </div>
    </div>
  </section>
</template>
