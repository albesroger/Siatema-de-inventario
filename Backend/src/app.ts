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
import helmet from "helmet";

const app = express();

app.use(helmet());

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

app.use(express.json({ limit: "1mb" }));

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

// Middleware global de errores: última barrera para no filtrar
// detalles internos al cliente.
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Error no controlado:", error);

    if (res.headersSent) {
      return;
    }

    const candidato = error as { status?: unknown; statusCode?: unknown };

    const status =
      (typeof candidato?.status === "number" && candidato.status) ||
      (typeof candidato?.statusCode === "number" && candidato.statusCode) ||
      500;

    res
      .status(status >= 400 && status < 600 ? status : 500)
      .json({
        success: false,
        message:
          status === 413
            ? "El cuerpo de la solicitud es demasiado grande"
            : "Error interno del servidor",
      });
  },
);

export default app;
