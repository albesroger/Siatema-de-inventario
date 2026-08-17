import express from "express";
import productoRoutes from "./routes/producto.routes.js";
import categoriaRoutes from "./routes/categoria.routes.js";
import proveedorRoutes from "./routes/proveedor.routes.js";
import dispositivoRoutes from "./routes/dispositivo.routes.js";
import entradaRoutes from "./routes/entrada.routes.js";
import salidaRoutes from "./routes/salida.routes.js";
import ajusteRoutes from "./routes/ajuste.routes.js";
import ventaRoutes from "./routes/venta.routes.js";
import authRoutes from "./routes/auth.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3001",
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
