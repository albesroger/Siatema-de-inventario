<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import type {
  ApiResponse,
  MetodoPago,
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

// ========================================================
// DATOS PARA NUEVA VENTA (PUNTO DE VENTA)
// ========================================================

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
const showModal = ref(false);
const editingId = ref<string | null>(null);

const loadProductosParaVenta = async () => {
  const response = await $api<ApiResponse<ProductoParaVenta[]>>(
    "/productos?paraVenta=true"
  );
  productosDisponibles.value = response.data.filter((p) => Number(p.stockActual) > 0);
};

const loadDispositivos = async () => {
  const response = await $api<ApiResponse<{ id: string; nombre: string }[]>>(
    "/dispositivos"
  );
  dispositivosDisponibles.value = response.data;
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
      cantidad: cantidad,
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

    carrito.value = [];
    descuentoGeneral.value = 0;
    impuestoGeneral.value = 0;
    metodoPago.value = "EFECTIVO";
    dispositivoId.value = "";
    formMessage.value = "";

    await refreshVentas();
    await loadProductosParaVenta();
  } catch (error: any) {
    formMessage.value =
      error?.data?.message || error?.message || "No se pudo registrar la venta";
  }
};

// ========================================================
// LISTADO DE VENTAS
// ========================================================

const loadVentas = async () => {
  const response = await $api<ApiResponse<Venta[]>>("/ventas");
  return response.data;
};

const {
  data: ventasData,
  pending: ventasPending,
  refresh: refreshVentas,
} = await useAsyncData(`ventas-${authStore.usuario?.negocioId ?? "guest"}`, loadVentas);

const ventas = computed(() => ventasData.value ?? []);

const verDetalle = (venta: Venta) => {
  editingId.value = venta.id;
  showModal.value = true;
};

const anularVenta = async (venta: Venta) => {
  const confirmed = window.confirm(
    `¿Anular la venta #${venta.numero}? Se devolverá el stock.`
  );

  if (!confirmed) return;

  try {
    await $api(`/ventas/${venta.id}/anular`, {
      method: "PATCH",
      body: { motivo: "Anulación desde el listado" },
    });

    await refreshVentas();
    if (editingId.value === venta.id) {
      showModal.value = false;
    }
  } catch (error: any) {
    alert(error?.data?.message || error?.message || "No se pudo anular la venta");
  }
};

const totalVentas = computed(() => ventas.value.length);
const ventasCompletadas = computed(
  () => ventas.value.filter((v) => v.estado === "COMPLETADA").length
);
const ventasAnuladas = computed(
  () => ventas.value.filter((v) => v.estado === "ANULADA").length
);
const montoTotalVentas = computed(() =>
  ventas.value
    .filter((v) => v.estado === "COMPLETADA")
    .reduce((sum, v) => sum + Number(v.total), 0)
);

onMounted(async () => {
  await loadProductosParaVenta();
  await loadDispositivos();
});
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

    <div class="grid gap-4 md:grid-cols-4">
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
        <p class="mt-2 text-2xl font-bold text-slate-800">{{ ventasCompletadas }}</p>
      </div>

      <div
        class="rounded-lg bg-white border border-red-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Anuladas:</p>
        <p class="mt-2 text-2xl font-bold text-red-600">{{ ventasAnuladas }}</p>
      </div>

      <div
        class="rounded-lg bg-white border border-green-400 p-5 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <p class="text-lg text-slate-700 font-medium">Monto total:</p>
        <p class="mt-2 text-2xl font-bold text-slate-800">
          {{ money.format(montoTotalVentas) }}
        </p>
      </div>
    </div>

    <div class="space-y-4">
      <div
        class="rounded-lg bg-white p-2 pl-3 shadow-sm ring-1 ring-slate-200 flex flex-col justify-center items-start gap-4"
      >
        <button
          class="rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
          @click="
            carrito = [];
            descuentoGeneral = 0;
            impuestoGeneral = 0;
            metodoPago = 'EFECTIVO';
            dispositivoId = '';
            formMessage = '';
            showModal = true;
          "
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
                type="button"
                :class="[
                  'px-3 py-1.5 text-sm font-medium transition',
                  filtroEstado === 'TODAS'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ]"
                @click="filtroEstado = 'TODAS'"
              >
                Todas
              </button>
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 text-sm font-medium transition',
                  filtroEstado === 'COMPLETADA'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ]"
                @click="filtroEstado = 'COMPLETADA'"
              >
                Completadas
              </button>
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 text-sm font-medium transition',
                  filtroEstado === 'ANULADA'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ]"
                @click="filtroEstado = 'ANULADA'"
              >
                Anuladas
              </button>
            </div>

            <div class="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 text-sm font-medium transition',
                  filtroFecha === 'HOY'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ]"
                @click="filtroFecha = 'HOY'"
              >
                Hoy
              </button>
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 text-sm font-medium transition',
                  filtroFecha === 'DIA'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ]"
                @click="filtroFecha = 'DIA'"
              >
                Día
              </button>
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 text-sm font-medium transition',
                  filtroFecha === 'TODAS'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ]"
                @click="filtroFecha = 'TODAS'"
              >
                Todas
              </button>
            </div>

            <input
              v-if="filtroFecha === 'DIA'"
              v-model="fechaSeleccionada"
              type="date"
              class="rounded-xl border border-slate-300 px-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div class="text-sm text-slate-500">
            {{
              ventasPending ? "Cargando ventas..." : `${ventasFiltradas.length} registros`
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
                <th class="px-4 py-3">Total</th>
                <th class="px-4 py-3">Método pago</th>
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

              <tr v-for="venta in ventasFiltradas" :key="venta.id" class="align-center">
                <td class="px-4 py-2">
                  <p class="text-sm font-medium text-slate-800">#{{ venta.numero }}</p>
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{
                    new Date(venta.createdAt).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600 font-medium">
                  {{ money.format(Number(venta.total)) }}
                </td>

                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ venta.metodoPago }}
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
                      Detalle
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

    <!-- Modal Nueva Venta -->
    <teleport to="body">
      <div
        v-if="showModal && !editingId"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/50" @click="showModal = false"></div>

        <div
          class="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-green-700">Nueva venta</h3>
            <button
              type="button"
              class="text-slate-500"
              @click="
                showModal = false;
                carrito = [];
                formMessage = '';
              "
            >
              ✕
            </button>
          </div>

          <form class="mt-4" @submit.prevent="submitVenta">
            <div class="space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
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
                      v-for="disp in dispositivosDisponibles"
                      :key="disp.id"
                      :value="disp.id"
                    >
                      {{ disp.nombre }}
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

              <div class="rounded-lg border border-slate-200 p-4">
                <h4 class="text-md font-semibold text-slate-700 mb-3">
                  Agregar productos
                </h4>
                <div class="grid gap-4 md:grid-cols-3">
                  <div class="md:col-span-2">
                    <label class="mb-2 block text-sm font-medium text-slate-700"
                      >Producto</label
                    >
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
                        {{ producto.nombre }} - Stock: {{ producto.stockActual }}
                        {{ producto.unidadMedida }}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-medium text-slate-700"
                      >Cantidad</label
                    >
                    <input
                      v-model="cantidadProducto"
                      type="number"
                      min="1"
                      step="1"
                      class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  class="mt-3 rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
                  @click="agregarAlCarrito"
                >
                  Agregar
                </button>
              </div>

              <div v-if="carrito.length > 0" class="rounded-lg border border-slate-200">
                <table class="min-w-full divide-y divide-slate-200">
                  <thead class="bg-slate-50">
                    <tr
                      class="text-left text-sm font-semibold uppercase tracking-wide text-green-800"
                    >
                      <th class="px-4 py-3">Producto</th>
                      <th class="px-4 py-3">Cantidad</th>
                      <th class="px-4 py-3">Precio unit.</th>
                      <th class="px-4 py-3">Subtotal</th>
                      <th class="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 bg-white">
                    <tr v-for="item in carrito" :key="item.id">
                      <td class="px-4 py-3">
                        <p class="font-medium text-slate-800">
                          {{ item.producto.nombre }}
                        </p>
                        <p class="text-xs text-slate-400">
                          {{ item.producto.codigo }}
                        </p>
                      </td>
                      <td class="px-4 py-3">
                        <input
                          type="number"
                          :value="item.cantidad"
                          min="1"
                          step="1"
                          class="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          @input="
                            actualizarCantidad(
                              item.id,
                              Number(($event.target as HTMLInputElement).value)
                            )
                          "
                        />
                      </td>
                      <td class="px-4 py-3 text-sm text-slate-600">
                        {{ money.format(Number(item.precioUnitario)) }}
                      </td>
                      <td class="px-4 py-3 text-sm text-slate-600 font-medium">
                        {{ money.format(Number(item.subtotal)) }}
                      </td>
                      <td class="px-4 py-3">
                        <button
                          type="button"
                          class="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50"
                          @click="eliminarDelCarrito(item.id)"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="carrito.length > 0" class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-md font-medium text-slate-700"
                    >Descuento general</label
                  >
                  <input
                    v-model="descuentoGeneral"
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
                    v-model="impuestoGeneral"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full rounded-xl border border-slate-300 px-2 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div v-if="carrito.length > 0" class="rounded-lg bg-slate-50 p-4">
                <div class="flex justify-between text-sm text-slate-600">
                  <span>Subtotal:</span>
                  <span>{{ money.format(subtotalCarrito) }}</span>
                </div>
                <div class="flex justify-between text-sm text-slate-600">
                  <span>Descuento:</span>
                  <span>- {{ money.format(Number(descuentoGeneral)) }}</span>
                </div>
                <div class="flex justify-between text-sm text-slate-600">
                  <span>Impuesto:</span>
                  <span>+ {{ money.format(Number(impuestoGeneral)) }}</span>
                </div>
                <div class="mt-2 flex justify-between text-lg font-bold text-slate-800">
                  <span>Total:</span>
                  <span>{{ money.format(totalCarrito) }}</span>
                </div>
              </div>

              <div
                v-if="formMessage"
                class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                {{ formMessage }}
              </div>

              <div class="flex gap-2 pt-4">
                <button
                  type="submit"
                  :disabled="carrito.length === 0"
                  class="rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Registrar venta
                </button>
                <button
                  type="button"
                  class="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100"
                  @click="
                    showModal = false;
                    carrito = [];
                    formMessage = '';
                  "
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Detalle Venta -->
      <div
        v-if="showModal && editingId"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/50" @click="showModal = false"></div>

        <div
          class="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-green-700">
              Detalle de venta #{{ ventas.find((v) => v.id === editingId)?.numero }}
            </h3>
            <button type="button" class="text-slate-500" @click="showModal = false">
              ✕
            </button>
          </div>

          <div v-if="editingId" class="mt-4 space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <p class="text-sm text-slate-500">Fecha:</p>
                <p class="font-medium text-slate-800">
                  {{
                    new Date(
                      ventas.find((v) => v.id === editingId)!.createdAt
                    ).toLocaleString("es-ES")
                  }}
                </p>
              </div>
              <div>
                <p class="text-sm text-slate-500">Estado:</p>
                <p class="font-medium text-slate-800">
                  {{ ventas.find((v) => v.id === editingId)!.estado }}
                </p>
              </div>
              <div>
                <p class="text-sm text-slate-500">Método de pago:</p>
                <p class="font-medium text-slate-800">
                  {{ ventas.find((v) => v.id === editingId)!.metodoPago }}
                </p>
              </div>
              <div>
                <p class="text-sm text-slate-500">Total:</p>
                <p class="font-medium text-slate-800">
                  {{
                    money.format(
                      Number(ventas.find((v) => v.id === editingId)!.total)
                    )
                  }}
                </p>
              </div>
            </div>

            <div class="rounded-lg border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr
                    class="text-left text-sm font-semibold uppercase tracking-wide text-green-800"
                  >
                    <th class="px-4 py-3">Producto</th>
                    <th class="px-4 py-3">Cantidad</th>
                    <th class="px-4 py-3">Precio unit.</th>
                    <th class="px-4 py-3">Descuento</th>
                    <th class="px-4 py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  <tr
                    v-for="detalle in ventas.find((v) => v.id === editingId)
                      ?.detalleVenta"
                    :key="detalle.id"
                  >
                    <td class="px-4 py-3">
                      <p class="font-medium text-slate-800">
                        {{ detalle.producto.nombre }}
                      </p>
                      <p class="text-xs text-slate-400">
                        {{ detalle.producto.codigo }}
                      </p>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      {{ detalle.cantidad }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      {{ money.format(Number(detalle.precioUnitario)) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600">
                      {{ money.format(Number(detalle.descuento)) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-600 font-medium">
                      {{ money.format(Number(detalle.subtotal)) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex justify-end">
              <button
                type="button"
                class="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100"
                @click="showModal = false"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </section>
</template>
