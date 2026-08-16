export interface Negocio {
  id: string;
  nombre: string;
  nombreComercial: string | null;
}

export interface Usuario {
  id: string;
  nombre: string;
  username: string;
  rol: string;
  negocioId: string;
  negocio: Negocio;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface LoginRequest {
  username: string;
  password: string;
}
