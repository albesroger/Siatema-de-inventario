export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore();
  const tokenCookie = useCookie<string | null>("token");

  if (import.meta.server) {
    if (!tokenCookie.value) {
      return navigateTo("/login");
    }

    authStore.cargarSesion();
    return;
  }

  authStore.cargarSesion();

  if (!authStore.isAuthenticated) {
    return navigateTo("/login");
  }
});
