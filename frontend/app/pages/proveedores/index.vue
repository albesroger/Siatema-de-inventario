<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});
</script>

<template>
  <section class="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
    <p class="text-sm uppercase tracking-[0.3em] text-slate-400">Módulo</p>
    <h1 class="mt-2 text-3xl font-bold text-slate-900">Proveedores</h1>
    <p class="mt-3 text-slate-600">Aquí construiremos la administración de proveedores.</p>
  </section>
</template>