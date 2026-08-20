export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore();

  if (import.meta.server) {
    const cookieHeader = useRequestHeaders(["cookie"])?.cookie || "";
    const hasToken = cookieHeader
      .split(";")
      .some((part) => part.trim().startsWith("token="));

    if (!hasToken) {
      return navigateTo("/login");
    }

    return;
  }

  await authStore.cargarSesion();

  if (!authStore.isAuthenticated) {
    return navigateTo("/login");
  }
});