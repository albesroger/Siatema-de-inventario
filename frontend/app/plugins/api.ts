export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    credentials: "include",
    onRequest({ options }) {
      const token = authStore.token;

      if (!token) return;

      const headers = new Headers(options.headers as HeadersInit | undefined);
      headers.set("Authorization", `Bearer ${token}`);
      options.headers = headers;
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        authStore.logout();
      }
    },
  });

  return {
    provide: {
      api,
    },
  };
});