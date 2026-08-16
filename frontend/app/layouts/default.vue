<script setup lang="ts">
import AppSidebar from "~/components/layout/AppSidebar.vue";
import AppTopbar from "~/components/layout/AppTopbar.vue";
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <div class="grid min-h-screen grid-cols-[280px_1fr]">
      <AppSidebar />

      <div class="flex min-h-screen flex-col">
        <AppTopbar />

        <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div class="w-full">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>