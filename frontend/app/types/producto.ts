export interface CategoriaResumen {
  id: string;
  nombre: string;
  descripcion: string | null;
  _count?: {
    productos: number;
  };
  estado: string;
}

export interface ProductoCategoria {
  id: string;
  nombre: string;
}

export interface Proveedor {
  id: string;
  negocioId: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  identificacion: string | null;
  observaciones: string | null;
  estado: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    entradas: number;
  };
}

export interface Producto {
  id: string;
  negocioId: string;
  categoriaId: string;
  codigo: string;
  codigoBarras: string | null;
  nombre: string;
  descripcion: string | null;
  unidadMedida: string;
  precioCompra: string | number;
  precioVenta: string | number;
  stockActual: string | number;
  stockMinimo: string | number;
  stockMaximo: string | number | null;
  estado: string;
  createdAt: string;
  updatedAt: string;
  categoria?: ProductoCategoria;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type UnidadMedida =
  | "UNIDAD"
  | "KILOGRAMO"
  | "GRAMO"
  | "LIBRA"
  | "LITRO"
  | "MILILITRO"
  | "METRO"
  | "CENTIMETRO"
  | "CAJA"
  | "PAQUETE"
  | "DOCENA";
