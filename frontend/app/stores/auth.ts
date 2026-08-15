import { defineStore } from "pinia";

import type { LoginRequest, LoginResponse, Usuario } from "~/types/auth";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);

  const usuario = ref<Usuario | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  const login = async (credentials: LoginRequest) => {
    const config = useRuntimeConfig();

    const response = await $fetch<{
      success: boolean;
      data: LoginResponse;
    }>(`${config.public.apiBase}/auth/login`, {
      method: "POST",
      body: credentials,
    });

    token.value = response.data.token;
    usuario.value = response.data.usuario;

    localStorage.setItem("token", response.data.token);
    localStorage.setItem("usuario", JSON.stringify(response.data.usuario));
  };

  const logout = () => {
    token.value = null;
    usuario.value = null;

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    navigateTo("/login");
  };

  const cargarSesion = () => {
    if (!import.meta.client) return;

    const storedToken = localStorage.getItem("token");
    const storedUsuario = localStorage.getItem("usuario");

    if (storedToken) {
      token.value = storedToken;
    }

    if (storedUsuario) {
      usuario.value = JSON.parse(storedUsuario);
    }
  };

  return {
    token,
    usuario,
    isAuthenticated,
    login,
    logout,
    cargarSesion,
  };
});
