import express from "express";
import productoRoutes from "./routes/producto.routes.js";
import categoriaRoutes from "./routes/categoria.routes.js";
import proveedorRoutes from "./routes/proveedor.routes.js";
import entradaRoutes from "./routes/entrada.routes.js";
import salidaRoutes from "./routes/salida.routes.js";
import ajusteRoutes from "./routes/ajuste.routes.js";
import ventaRoutes from "./routes/venta.routes.js";

const app = express();

app.use(express.json());

app.use("/api/productos", productoRoutes);

app.use("/api/categorias", categoriaRoutes);

app.use("/api/proveedores", proveedorRoutes);

app.use("/api/entradas", entradaRoutes);

app.use("/api/salidas", salidaRoutes);

app.use("/api/ajustes", ajusteRoutes);

app.use("/api/ventas", ventaRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Servidor funcionando correctamente",
  });
});

export default app;
