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

export interface VentaDetalleProducto {
  id: string;
  productoId: string;
  cantidad: string | number;
  precioUnitario: string | number;
  descuento: string | number;
  subtotal: string | number;
  producto: {
    id: string;
    codigo: string;
    nombre: string;
    unidadMedida: string;
  };
}

export interface Venta {
  id: string;
  negocioId: string;
  usuarioId: string;
  dispositivoId: string;
  numero: string | number | bigint;
  subtotal: string | number;
  descuento: string | number;
  impuesto: string | number;
  total: string | number;
  metodoPago: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
  detalleVenta: VentaDetalleProducto[];
  usuario?: {
    id: string;
    nombre: string;
    username: string;
  };
  dispositivo?: {
    id: string;
    nombre: string;
    identificador: string;
  };
}

export interface ProductoParaVenta {
  id: string;
  codigo: string;
  codigoBarras?: string | null;
  nombre: string;
  precioVenta: string | number;
  stockActual: string | number;
  unidadMedida: string;
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

export type MetodoPago = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "OTRO";

export interface Dispositivo {
  id: string;
  negocioId: string;
  nombre: string;
  identificador: string;
  tipo: "DESKTOP" | "LAPTOP" | "TABLET";
  estado: string;
  ultimaSincronizacionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DetalleEntrada {
  id: string;
  entradaId: string;
  productoId: string;
  cantidad: string | number;
  costoUnitario: string | number;
  descuento: string | number;
  subtotal: string | number;
  producto: {
    id: string;
    codigo: string;
    nombre: string;
    unidadMedida: string;
  };
}

export interface Entrada {
  id: string;
  negocioId: string;
  proveedorId: string | null;
  usuarioId: string;
  dispositivoId: string;
  numero: string | number | bigint;
  numeroDocumento: string | null;
  subtotal: string | number;
  descuento: string | number;
  total: string | number;
  observaciones: string | null;
  estado: string;
  createdAt: string;
  updatedAt: string;
  proveedor?: {
    id: string;
    nombre: string;
    telefono: string | null;
    email: string | null;
  };
  usuario?: {
    id: string;
    nombre: string;
    username: string;
  };
  dispositivo?: {
    id: string;
    nombre: string;
    identificador: string;
  };
  detalles: DetalleEntrada[];
}

export interface DetalleSalida {
  id: string;
  salidaId: string;
  productoId: string;
  cantidad: string | number;
  observaciones: string | null;
  producto: {
    id: string;
    codigo: string;
    nombre: string;
    unidadMedida: string;
  };
}

export interface Salida {
  id: string;
  negocioId: string;
  usuarioId: string;
  dispositivoId: string;
  numero: string | number | bigint;
  motivo:
    | "PRODUCTO_DANADO"
    | "PRODUCTO_VENCIDO"
    | "CONSUMO_INTERNO"
    | "PERDIDA"
    | "ROBO"
    | "MUESTRA"
    | "OTRO";
  observaciones: string | null;
  estado: string;
  createdAt: string;
  updatedAt: string;
  usuario?: {
    id: string;
    nombre: string;
    username: string;
  };
  dispositivo?: {
    id: string;
    nombre: string;
    identificador: string;
  };
  detalles: DetalleSalida[];
}

export interface DashboardStats {
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  ventas: {
    total: number;
    cantidad: number;
    porMetodoPago: Record<string, number>;
    topProductos: {
      nombre: string;
      codigo: string;
      cantidad: number;
      precioVenta: number;
      stockActual: number;
    }[];
  };
  entradas: {
    total: number;
    cantidad: number;
  };
  salidas: {
    cantidad: number;
  };
  ajustes: {
    cantidad: number;
  };
  productos: {
    total: number;
    stockBajo: number;
  };
  ventasPorDia: {
    fecha: string;
    total: number;
    cantidad: number;
  }[];
  movimientosRecientes: {
    id: string;
    tipo: string;
    cantidad: number;
    stockAnterior: number;
    stockPosterior: number;
    producto: {
      nombre: string;
      codigo: string;
    };
    createdAt: string;
  }[];
}

export interface Movimiento {
  id: string;
  negocioId: string;
  productoId: string;
  usuarioId: string;
  dispositivoId: string;
  tipo:
    | "INVENTARIO_INICIAL"
    | "ENTRADA"
    | "VENTA"
    | "SALIDA"
    | "AJUSTE_POSITIVO"
    | "AJUSTE_NEGATIVO";
  cantidad: string | number;
  stockAnterior: string | number;
  stockPosterior: string | number;
  referenciaTipo: "VENTA" | "ENTRADA" | "SALIDA" | "AJUSTE";
  referenciaId: string;
  motivo: string | null;
  createdAt: string;
  producto: {
    id: string;
    codigo: string;
    nombre: string;
    unidadMedida: string;
  };
  usuario: {
    id: string;
    nombre: string;
    username: string;
  };
  dispositivo: {
    id: string;
    nombre: string;
    identificador: string;
  };
}

export interface DetalleAjuste {
  id: string;
  ajusteId: string;
  productoId: string;
  cantidad: string | number;
  stockAnterior: string | number;
  stockNuevo: string | number;
  observaciones: string | null;
  producto: {
    id: string;
    codigo: string;
    nombre: string;
    unidadMedida: string;
  };
}

export interface Ajuste {
  id: string;
  negocioId: string;
  usuarioId: string;
  dispositivoId: string;
  numero: string | number | bigint;
  tipo: "POSITIVO" | "NEGATIVO";
  motivo: "DIFERENCIA_CONTEO" | "ERROR_REGISTRO" | "CORRECCION" | "OTRO";
  observaciones: string | null;
  estado: string;
  createdAt: string;
  updatedAt: string;
  detalles: DetalleAjuste[];
  usuario: {
    id: string;
    nombre: string;
    username: string;
  };
  dispositivo: {
    id: string;
    nombre: string;
    identificador: string;
  };
}
