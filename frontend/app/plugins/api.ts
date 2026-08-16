export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      if (!import.meta.client) return;

      authStore.cargarSesion();

      if (!authStore.token) return;

      const headers = new Headers(options.headers as HeadersInit | undefined);
      headers.set("Authorization", `Bearer ${authStore.token}`);
      options.headers = headers;
    },
  });

  return {
    provide: {
      api,
    },
  };
});
