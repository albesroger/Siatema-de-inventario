import express from "express";
import productoRoutes from "./routes/producto.routes.js";
import categoriaRoutes from "./routes/categoria.routes.js";
import proveedorRoutes from "./routes/proveedor.routes.js";

const app = express();

app.use(express.json());

app.use("/api/productos", productoRoutes);

app.use("/api/categorias", categoriaRoutes);

app.use("/api/proveedores", proveedorRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Servidor funcionando correctamente",
  });
});

export default app;
