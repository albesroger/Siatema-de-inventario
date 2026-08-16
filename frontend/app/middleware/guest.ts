export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore();
  const tokenCookie = useCookie<string | null>("token");

  if (import.meta.server) {
    if (tokenCookie.value) {
      return navigateTo("/");
    }

    return;
  }

  authStore.cargarSesion();

  if (authStore.isAuthenticated) {
    return navigateTo("/");
  }
});
