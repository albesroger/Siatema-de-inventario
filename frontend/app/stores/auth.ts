import { defineStore } from "pinia";

import type { LoginRequest, LoginResponse, Usuario } from "~/types/auth";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);

  const usuario = ref<Usuario | null>(null);

  const initialized = ref(false);

  const isAuthenticated = computed(() => !!token.value);

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

    if (import.meta.client) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("usuario", JSON.stringify(response.data.usuario));
    }
  };

  const logout = () => {
    token.value = null;
    usuario.value = null;

    if (import.meta.client) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
    }

    navigateTo("/login");
  };

  const cargarSesion = () => {
    if (!import.meta.client || initialized.value) return;

    const storedToken = localStorage.getItem("token");
    const storedUsuario = localStorage.getItem("usuario");

    if (storedToken) {
      token.value = storedToken;
    }

    if (storedUsuario) {
      usuario.value = JSON.parse(storedUsuario);
    }

    initialized.value = true;
  };

  return {
    token,
    usuario,
    isAuthenticated,
    initialized,
    login,
    logout,
    cargarSesion,
  };
});
