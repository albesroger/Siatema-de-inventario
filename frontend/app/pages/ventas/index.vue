<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import type {
  ApiResponse,
  MetodoPago,
  Producto,
  ProductoParaVenta,
  Venta,
  VentaDetalleProducto,
} from "~/types/producto";

const authStore = useAuthStore();
const { $api } = useNuxtApp();

const money = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }
  const normalized = String(value).trim();
  if (!normalized) {
    return 0;
  }
  return Number(normalized);
};

// ========================================================
// FILTROS DEL HISTORIAL
// ========================================================

const filtroEstado = ref<"TODAS" | "COMPLETADA" | "ANULADA">("TODAS");
const filtroFecha = ref<"HOY" | "DIA" | "TODAS">("HOY");
const fechaSeleccionada = ref("");

const ventas = ref<Venta[]>([]);
const ventasPending = ref(true);
const showDetailModal = ref(false);
const selectedVenta = ref<Venta | null>(null);

const loadVentas = async () => {
  ventasPending.value = true;
  try {
    const response = await $api<ApiResponse<Venta[]>>("/ventas");
    ventas.value = response.data;
  } catch (error: any) {
    console.error("Error al cargar ventas:", error);
  } finally {
    ventasPending.value = false;
  }
};

onMounted(() => {
  loadVentas();
});

const ventasFiltradas = computed(() => {
  let resultado = [...ventas.value];

  if (filtroEstado.value !== "TODAS") {
    resultado = resultado.filter((v) => v.estado === filtroEstado.value);
  }

  if (filtroFecha.value === "HOY") {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    resultado = resultado.filter(
      (v) => new Date(v.createdAt) >= inicioHoy && new Date(v.createdAt) < finHoy
    );
  } else if (filtroFecha.value === "DIA" && fechaSeleccionada.value) {
    const inicioDia = new Date(fechaSeleccionada.value);
    const finDia = new Date(fechaSeleccionada.value);
    finDia.setDate(finDia.getDate() + 1);
    resultado = resultado.filter(
      (v) => new Date(v.createdAt) >= inicioDia && new Date(v.createdAt) < finDia
    );
  }

  return resultado;
});

const verDetalle = (venta: Venta) => {
  selectedVenta.value = venta;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedVenta.value = null;
};

const anularVenta = async (venta: Venta) => {
  const confirmed = window.confirm(
    `¿Anular la venta #${venta.numero.toString()}? Esta acción revertirá el stock de los productos.`
  );

  if (!confirmed) return;

  try {
    // Obtener dispositivo activo del usuario
    const dispositivos = await $api<ApiResponse<any[]>>("/dispositivos");
    const dispositivo = dispositivos.data.find((d) => d.estado === "ACTIVO");

    if (!dispositivo) {
      alert("No hay un dispositivo activo disponible para anular la venta.");
      return;
    }

    await $api(`/ventas/${venta.id}/anular`, {
      method: "POST",
      body: {
        dispositivoId: dispositivo.id,
      },
    });

    await loadVentas();
    closeDetailModal();
  } catch (error: any) {
    alert(error?.data?.message || "No se pudo anular la venta");
  }
};

const totalVentas = computed(() => ventas.value.length);
const ventasCompletadas = computed(
  () => ventas.value.filter((v) => v.estado === "COMPLETADA").length
);
const ventasAnuladas = computed(
  () => ventas.value.filter((v) => v.estado === "ANULADA").length
);

const irAReporte = () => {
  navigateTo({
    path: "/reportes",
    query: { tipo: "ventas" },
  });
};

// ========================================================
// PUNTO DE VENTA (NUEVA VENTA)
// ========================================================

const showNewVentaModal = ref(false);
const productosDisponibles = ref<ProductoParaVenta[]>([]);
const dispositivosDisponibles = ref<{ id: string; nombre: string }[]>([]);
const carrito = ref<VentaDetalleProducto[]>([]);
const productoSeleccionadoId = ref("");
const cantidadProducto = ref(1);
const descuentoGeneral = ref(0);
const impuestoGeneral = ref(0);
const metodoPago = ref<MetodoPago>("EFECTIVO");
const dispositivoId = ref("");
const formMessage = ref("");

const loadProductosParaVenta = async () => {
  const response = await $api<ApiResponse<Producto[]>>("/productos");
  productosDisponibles.value = response.data
    .filter((p) => p.estado === "ACTIVO" && Number(p.stockActual) > 0)
    .map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      precioVenta: p.precioVenta,
      stockActual: p.stockActual,
      unidadMedida: p.unidadMedida,
    }));
};

const loadDispositivos = async () => {
  const response = await $api<ApiResponse<{ id: string; nombre: string; estado: string }[]>>(
    "/dispositivos"
  );
  dispositivosDisponibles.value = response.data.filter((d) => d.estado === "ACTIVO");
};

const openNewVenta = async () => {
  formMessage.value = "";
  carrito.value = [];
  descuentoGeneral.value = 0;
  impuestoGeneral.value = 0;
  metodoPago.value = "EFECTIVO";
  dispositivoId.value = "";
  showNewVentaModal.value = true;
  await Promise.all([loadProductosParaVenta(), loadDispositivos()]);
};

const closeNewVenta = () => {
  showNewVentaModal.value = false;
  formMessage.value = "";
};

const agregarAlCarrito = () => {
  formMessage.value = "";

  if (!productoSeleccionadoId.value) {
    formMessage.value = "Selecciona un producto.";
    return;
  }

  const producto = productosDisponibles.value.find(
    (p) => p.id === productoSeleccionadoId.value
  );

  if (!producto) {
    formMessage.value = "Producto no encontrado.";
    return;
  }

  const cantidad = Number(cantidadProducto.value);

  if (cantidad <= 0) {
    formMessage.value = "La cantidad debe ser mayor a 0.";
    return;
  }

  if (cantidad > Number(producto.stockActual)) {
    formMessage.value = `Stock insuficiente. Disponible: ${producto.stockActual}`;
    return;
  }

  const existente = carrito.value.find((item) => item.productoId === producto.id);

  if (existente) {
    const nuevaCantidad = Number(existente.cantidad) + cantidad;
    if (nuevaCantidad > Number(producto.stockActual)) {
      formMessage.value = `Stock insuficiente. Disponible: ${producto.stockActual}`;
      return;
    }
    existente.cantidad = nuevaCantidad;
    existente.subtotal = Number(existente.cantidad) * Number(producto.precioVenta);
  } else {
    carrito.value.push({
      id: crypto.randomUUID(),
      productoId: producto.id,
      cantidad,
      precioUnitario: Number(producto.precioVenta),
      descuento: 0,
      subtotal: cantidad * Number(producto.precioVenta),
      producto: {
        id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        unidadMedida: producto.unidadMedida,
      },
    });
  }

  productoSeleccionadoId.value = "";
  cantidadProducto.value = 1;
  formMessage.value = "";
};

const eliminarDelCarrito = (itemId: string) => {
  carrito.value = carrito.value.filter((item) => item.id !== itemId);
};

const actualizarCantidad = (itemId: string, cantidad: number) => {
  const item = carrito.value.find((i) => i.id === itemId);
  const producto = productosDisponibles.value.find((p) => p.id === item?.productoId);

  if (!item || !producto) return;

  if (cantidad <= 0) {
    eliminarDelCarrito(itemId);
    return;
  }

  if (cantidad > Number(producto.stockActual)) {
    formMessage.value = `Stock insuficiente. Disponible: ${producto.stockActual}`;
    return;
  }

  item.cantidad = cantidad;
  item.subtotal = cantidad * Number(item.precioUnitario);
  formMessage.value = "";
};

const subtotalCarrito = computed(() =>
  carrito.value.reduce((sum, item) => sum + Number(item.subtotal), 0)
);

const totalCarrito = computed(() => {
  const subtotal = subtotalCarrito.value;
  const descuento = Number(descuentoGeneral.value);
  const impuesto = Number(impuestoGeneral.value);
  return Math.max(0, subtotal - descuento + impuesto);
});

const submitVenta = async () => {
  formMessage.value = "";

  if (carrito.value.length === 0) {
    formMessage.value = "Agrega al menos un producto a la venta.";
    return;
  }

  if (!dispositivoId.value) {
    formMessage.value = "Selecciona un dispositivo.";
    return;
  }

  const payload = {
    dispositivoId: dispositivoId.value,
    descuento: Number(descuentoGeneral.value),
    impuesto: Number(impuestoGeneral.value),
    metodoPago: metodoPago.value,
    detalles: carrito.value.map((item) => ({
      productoId: item.productoId,
      cantidad: Number(item.cantidad),
      descuento: Number(item.descuento),
    })),
  };

  try {
    await $api("/ventas", {
      method: "POST",
      body: payload,
    });

    await loadVentas();
    closeNewVenta();
  } catch (error: any) {
    formMessage.value =
      error?.data?.message || error?.message || "No se pudo registrar la venta";
  }
};
</script>

<template>
  <section class="space-y-3">
    <div
      class="rounded-lg bg-gradient-to-r from-green-900 to-green-700 p-2 pl-3 text-white shadow-lg flex items-center"
    >
      <p class="text-sm uppercase tracking-[0.3em] text-slate-300 text-white font-medium">
        Ventas
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div
        class="rounded-lg bg-white border border-green-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Total ventas:</p>
        <p class="mt-2 text-2xl font-bold text-slate-800">{{ totalVentas }}</p>
      </div>

      <div
        class="rounded-lg bg-white border border-green-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Completadas:</p>
        <p class="mt-2 text-2xl font-bold text-green-600">{{ ventasCompletadas }}</p>
      </div>

      <div
        class="rounded-lg bg-white border border-red-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Anuladas:</p>
        <p class="mt-2 text-2xl font-bold text-red-600">{{ ventasAnuladas }}</p>
      </div>
    </div>

    <div class="space-y-4">
      <div
        class="rounded-lg bg-white p-2 pl-3 shadow-sm ring-1 ring-slate-200 flex flex-col justify-center items-start gap-4"
      >
        <button
          class="rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
          @click="openNewVenta"
        >
          Nueva venta
        </button>
      
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-green-800">Historial de ventas</h2>
            <p class="mt-1 text-sm text-slate-500">
              Consulta el detalle de cada venta realizada.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                v-for="estado in ['TODAS', 'COMPLETADA', 'ANULADA']"
                :key="estado"
                type="button"
                :class="[
                  'px-3 py-1.5 text-sm font-medium transition',
                  filtroEstado === estado
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ]"
                @click="filtroEstado = estado as any"
              >
                {{
                  estado === "TODAS"
                    ? "Todas"
                    : estado === "COMPLETADA"
                    ? "Completadas"
                    : "Anuladas"
                }}
              </button>
            </div>

            <div class="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                v-for="fecha in ['HOY', 'DIA', 'TODAS']"
                :key="fecha"
                type="button"
                :class="[
                  'px-3 py-1.5 text-sm font-medium transition',
                  filtroFecha === fecha
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ]"
                @click="filtroFecha = fecha as any"
              >
                {{
                  fecha === "HOY"
                    ? "Hoy"
                    : fecha === "DIA"
                    ? "Día"
                    : "Todas"
                }}
              </button>
            </div>

            <input
              v-if="filtroFecha === 'DIA'"
              v-model="fechaSeleccionada"
              type="date"
              class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            />
          </div>

          <div class="text-sm text-slate-500">
            {{
              ventasPending
                ? "Cargando ventas..."
                : `${ventasFiltradas.length} registros`
            }}
          </div>
        </div>

        <div class="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr
                class="text-left text-sm font-semibold uppercase tracking-wide text-green-800"
              >
                <th class="px-4 py-3">Número</th>
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Método de pago</th>
                <th class="px-4 py-3">Total</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="!ventasPending && ventasFiltradas.length === 0">
                <td colspan="6" class="px-4 py-10 text-center text-sm text-slate-500">
                  No hay ventas registradas todavía.
                </td>
              </tr>

              <tr
                v-for="venta in ventasFiltradas"
                :key="venta.id"
                class="align-center"
              >
                <td class="px-4 py-2">
                  <p class="font-medium text-slate-800 text-sm">
                    #{{ venta.numero.toString() }}
                  </p>
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ new Date(venta.createdAt).toLocaleDateString("es-CU") }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ venta.metodoPago }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                  ${{ Number(venta.total).toFixed(2) }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      venta.estado === 'COMPLETADA'
                        ? 'bg-green-100 text-green-700 justify-center'
                        : 'bg-red-100 text-red-700 justify-center w-24',
                    ]"
                  >
                    {{ venta.estado }}
                  </span>
                </td>

                <td class="px-4 py-2">
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                      @click="verDetalle(venta)"
                    >
                      Detalles
                    </button>

                    <button
                      v-if="venta.estado === 'COMPLETADA'"
                      type="button"
                      class="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      @click="anularVenta(venta)"
                    >
                      Anular
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal: Nueva venta (punto de venta) -->
    <teleport to="body">
      <div
        v-if="showNewVentaModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/50" @click="closeNewVenta"></div>

        <div
          class="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lg"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-green-700">Nueva venta</h3>
            <button type="button" class="text-slate-500" @click="closeNewVenta">✕</button>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-md font-medium text-slate-700"
                >Dispositivo *</label
              >
              <select
                v-model="dispositivoId"
                class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Selecciona un dispositivo</option>
                <option
                  v-for="dispositivo in dispositivosDisponibles"
                  :key="dispositivo.id"
                  :value="dispositivo.id"
                >
                  {{ dispositivo.nombre }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-2 block text-md font-medium text-slate-700"
                >Método de pago *</label
              >
              <select
                v-model="metodoPago"
                class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>

          <div class="mt-4 rounded-lg border border-slate-200 p-4">
            <p class="text-sm font-semibold text-slate-700 mb-3">Agregar productos</p>

            <div class="grid gap-3 md:grid-cols-3">
              <div class="md:col-span-1">
                <select
                  v-model="productoSeleccionadoId"
                  class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Selecciona un producto</option>
                  <option
                    v-for="producto in productosDisponibles"
                    :key="producto.id"
                    :value="producto.id"
                  >
                    {{ producto.nombre }} (Stock: {{ producto.stockActual }})
                  </option>
                </select>
              </div>

              <div>
                <input
                  v-model.number="cantidadProducto"
                  type="number"
                  min="1"
                  step="0.001"
                  placeholder="Cantidad"
                  class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <button
                  type="button"
                  class="w-full rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
                  @click="agregarAlCarrito"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-sm font-semibold text-slate-700 mb-2">Carrito</p>

            <div class="overflow-hidden rounded-lg border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr class="text-left text-sm font-semibold text-slate-700">
                    <th class="px-4 py-3">Producto</th>
                    <th class="px-4 py-3">Precio</th>
                    <th class="px-4 py-3">Cantidad</th>
                    <th class="px-4 py-3">Subtotal</th>
                    <th class="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  <tr v-if="carrito.length === 0">
                    <td colspan="5" class="px-4 py-8 text-center text-sm text-slate-500">
                      El carrito está vacío. Agrega productos.
                    </td>
                  </tr>
                  <tr v-for="item in carrito" :key="item.id">
                    <td class="px-4 py-2 text-sm text-slate-800">{{ item.producto.nombre }}</td>
                    <td class="px-4 py-2 text-sm text-slate-600">
                      ${{ Number(item.precioUnitario).toFixed(2) }}
                    </td>
                    <td class="px-4 py-2 text-sm text-slate-600">
                      <input
                        :value="item.cantidad"
                        type="number"
                        min="1"
                        step="0.001"
                        class="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                        @change="
                          actualizarCantidad(
                            item.id,
                            Number(($event.target as HTMLInputElement).value)
                          )
                        "
                      />
                    </td>
                    <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                      ${{ Number(item.subtotal).toFixed(2) }}
                    </td>
                    <td class="px-4 py-2 text-right">
                      <button
                        type="button"
                        class="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50"
                        @click="eliminarDelCarrito(item.id)"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-2 block text-md font-medium text-slate-700"
                  >Descuento</label
                >
                <input
                  v-model.number="descuentoGeneral"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label class="mb-2 block text-md font-medium text-slate-700"
                  >Impuesto</label
                >
                <input
                  v-model.number="impuestoGeneral"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div class="flex flex-col items-end justify-end gap-1">
              <p class="text-sm text-slate-500">
                Subtotal: ${{ subtotalCarrito.toFixed(2) }}
              </p>
              <p class="text-xl font-bold text-green-700">
                Total: ${{ totalCarrito.toFixed(2) }}
              </p>
            </div>
          </div>

          <div
            v-if="formMessage"
            class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {{ formMessage }}
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100"
              @click="closeNewVenta"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2 font-semibold text-white"
              @click="submitVenta"
            >
              Registrar venta
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Modal de detalle -->
    <teleport to="body">
      <div
        v-if="showDetailModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/50" @click="closeDetailModal"></div>

        <div
          class="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-green-700">
              Venta #{{ selectedVenta?.numero.toString() }}
            </h3>
            <button type="button" class="text-slate-500" @click="closeDetailModal">
              ✕
            </button>
          </div>

          <div v-if="selectedVenta" class="mt-4 space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <p class="text-sm font-medium text-slate-500">Usuario</p>
                <p class="text-slate-800">{{ selectedVenta.usuario?.nombre || "—" }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Dispositivo</p>
                <p class="text-slate-800">
                  {{ selectedVenta.dispositivo?.nombre || "—" }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Método de pago</p>
                <p class="text-slate-800">{{ selectedVenta.metodoPago }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Estado</p>
                <span
                  :class="[
                    'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                    selectedVenta.estado === 'COMPLETADA'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700',
                  ]"
                >
                  {{ selectedVenta.estado }}
                </span>
              </div>
              <div class="md:col-span-2">
                <p class="text-sm font-medium text-slate-500">Fecha</p>
                <p class="text-slate-800">
                  {{ new Date(selectedVenta.createdAt).toLocaleString("es-CU") }}
                </p>
              </div>
            </div>

            <div class="rounded-lg border border-slate-200 overflow-hidden">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr class="text-left text-sm font-semibold text-slate-700">
                    <th class="px-4 py-3">Producto</th>
                    <th class="px-4 py-3">Cantidad</th>
                    <th class="px-4 py-3">Precio unitario</th>
                    <th class="px-4 py-3">Descuento</th>
                    <th class="px-4 py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  <tr v-for="detalle in selectedVenta.detalleVenta" :key="detalle.id">
                    <td class="px-4 py-3 text-sm text-slate-800">
                      {{ detalle.producto.nombre }}
                      <span class="text-slate-500">({{ detalle.producto.codigo }})</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      {{ Number(detalle.cantidad).toFixed(3) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      ${{ Number(detalle.precioUnitario).toFixed(2) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      ${{ Number(detalle.descuento).toFixed(2) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600 font-medium">
                      ${{ Number(detalle.subtotal).toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex justify-end gap-2 rounded-lg bg-slate-50 p-4">
              <div class="text-right">
                <p class="text-sm text-slate-500">Subtotal</p>
                <p class="text-lg font-semibold text-slate-800">
                  ${{ Number(selectedVenta.subtotal).toFixed(2) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-slate-500">Descuento</p>
                <p class="text-lg font-semibold text-slate-800">
                  ${{ Number(selectedVenta.descuento).toFixed(2) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-slate-500">Impuesto</p>
                <p class="text-lg font-semibold text-slate-800">
                  ${{ Number(selectedVenta.impuesto).toFixed(2) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-slate-500">Total</p>
                <p class="text-xl font-bold text-green-700">
                  ${{ Number(selectedVenta.total).toFixed(2) }}
                </p>
              </div>
            </div>

            <div
              v-if="selectedVenta.estado === 'COMPLETADA'"
              class="flex justify-end pt-4"
            >
              <button
                type="button"
                class="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                @click="anularVenta(selectedVenta)"
              >
                Anular venta
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </section>
</template>
