import express from "express";
import productoRoutes from "./routes/producto.routes.js";
import categoriaRoutes from "./routes/categoria.routes.js";
import proveedorRoutes from "./routes/proveedor.routes.js";
import dispositivoRoutes from "./routes/dispositivo.routes.js";
import entradaRoutes from "./routes/entrada.routes.js";
import salidaRoutes from "./routes/salida.routes.js";
import ajusteRoutes from "./routes/ajuste.routes.js";
import movimientoRoutes from "./routes/movimiento.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import ventaRoutes from "./routes/venta.routes.js";
import authRoutes from "./routes/auth.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import cors from "cors";

const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGIN || "http://localhost:3001"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.use("/api/productos", productoRoutes);

app.use("/api/categorias", categoriaRoutes);

app.use("/api/proveedores", proveedorRoutes);

app.use("/api/dispositivos", dispositivoRoutes);

app.use("/api/entradas", entradaRoutes);

app.use("/api/salidas", salidaRoutes);

app.use("/api/ajustes", ajusteRoutes);

app.use("/api/movimientos", movimientoRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/ventas", ventaRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/usuarios", usuarioRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Servidor funcionando correctamente",
  });
});

export default app;
