<script setup lang="ts">
definePageMeta({
  middleware: "guest",
  layout: "auth",
});

const authStore = useAuthStore();

const username = ref("");
const password = ref("");

const loading = ref(false);
const errorMessage = ref("");

const handleLogin = async () => {
  errorMessage.value = "";

  if (!username.value || !password.value) {
    errorMessage.value = "Completa usuario y contraseña";
    return;
  }

  loading.value = true;

  try {
    await authStore.login({
      username: username.value,
      password: password.value,
    });

    await navigateTo("/");
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.message || "Usuario o contraseña incorrectos";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-2xl shadow-green-300 p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-green-600">Iniciar sesión</h1>

          <p class="mt-2 text-green-700">Sistema de gestión de inventario</p>
        </div>

        <form class="space-y-5" @submit.prevent="handleLogin">
          <div>
            <label for="username" class="block text-md font-medium text-slate-700 mb-2">
              Usuario
            </label>

            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              placeholder="Introduce tu usuario"
              class="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label for="password" class="block text-md font-medium text-slate-700 mb-2">
              Contraseña
            </label>

            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="Introduce tu contraseña"
              class="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div
            v-if="errorMessage"
            class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ loading ? "Iniciando sesión..." : "Iniciar sesión" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
