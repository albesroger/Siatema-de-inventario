import { defineStore } from "pinia";

import type { LoginRequest, LoginResponse, Usuario } from "~/types/auth";

const decodificarJwt = (token: string): { exp: number } | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
};

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);

  const usuario = ref<Usuario | null>(null);

  const initialized = ref(false);

  const sessionValid = ref(false);

  const isAuthenticated = computed(() => !!token.value || sessionValid.value);

  const isAdmin = computed(() => usuario.value?.rol === "ADMINISTRADOR");

  const negocioNombre = computed(() => {
    if (!usuario.value?.negocio) {
      return "Mi negocio";
    }

    return (
      usuario.value.negocio.nombreComercial || usuario.value.negocio.nombre
    );
  });

  const login = async (credentials: LoginRequest) => {
    const { $api } = useNuxtApp();

    const response = await $api<{
      success: boolean;
      data: LoginResponse;
    }>("/auth/login", {
      method: "POST",
      body: credentials,
    });

    token.value = response.data.token;
    usuario.value = response.data.usuario;
    sessionValid.value = true;
  };

  const logout = async () => {
    token.value = null;
    usuario.value = null;
    sessionValid.value = false;

    try {
      const { $api } = useNuxtApp();
      await $api("/auth/logout", { method: "POST" });
    } catch {
      /* sin red o sin sesión activa */
    }

    navigateTo("/login");
  };

  const verificarExpiracion = () => {
    if (!import.meta.client) return;

    const tokenActual = token.value;
    if (!tokenActual) return;

    const decoded = decodificarJwt(tokenActual);
    if (!decoded || !decoded.exp) return;

    const ahora = Math.floor(Date.now() / 1000);
    const tiempoRestante = decoded.exp - ahora;

    if (tiempoRestante <= 0) {
      logout();
      return;
    }

    setTimeout(() => {
      logout();
    }, tiempoRestante * 1000);
  };

  const cargarSesion = async () => {
    if (initialized.value) return;

    if (import.meta.server) {
      initialized.value = true;
      return;
    }

    if (token.value) {
      initialized.value = true;
      verificarExpiracion();
      return;
    }

    try {
      const { $api } = useNuxtApp();
      const response = await $api<{
        success: boolean;
        data: Usuario;
      }>("/auth/me");

      usuario.value = response.data;
      sessionValid.value = true;
    } catch {
      usuario.value = null;
      sessionValid.value = false;
    }

    initialized.value = true;
  };

  return {
    token,
    usuario,
    isAuthenticated,
    isAdmin,
    negocioNombre,
    initialized,
    sessionValid,
    login,
    logout,
    cargarSesion,
    verificarExpiracion,
  };
});