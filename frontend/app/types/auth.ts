export interface Usuario {
  id: string;
  nombre: string;
  username: string;
  rol: string;
  negocioId: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface LoginRequest {
  username: string;
  password: string;
}
