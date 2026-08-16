import { defineStore } from "pinia";

import type { LoginRequest, LoginResponse, Usuario } from "~/types/auth";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);

  const usuario = ref<Usuario | null>(null);

  const initialized = ref(false);

  const isAuthenticated = computed(() => !!token.value);

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
    const tokenCookie = useCookie<string | null>("token", {
      sameSite: "lax",
    });

    const response = await $api<{
      success: boolean;
      data: LoginResponse;
    }>("/auth/login", {
      method: "POST",
      body: credentials,
    });

    token.value = response.data.token;
    usuario.value = response.data.usuario;
    tokenCookie.value = response.data.token;

    if (import.meta.client) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("usuario", JSON.stringify(response.data.usuario));
    }
  };

  const logout = () => {
    const tokenCookie = useCookie<string | null>("token", {
      sameSite: "lax",
    });

    token.value = null;
    usuario.value = null;
    tokenCookie.value = null;

    if (import.meta.client) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
    }

    navigateTo("/login");
  };

  const cargarSesion = () => {
    if (initialized.value) return;

    const tokenCookie = useCookie<string | null>("token", {
      sameSite: "lax",
    });

    if (tokenCookie.value) {
      token.value = tokenCookie.value;
    }

    if (import.meta.server) {
      initialized.value = true;
      return;
    }

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
    negocioNombre,
    initialized,
    login,
    logout,
    cargarSesion,
  };
});
