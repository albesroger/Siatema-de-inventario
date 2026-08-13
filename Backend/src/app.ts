import express from "express";
import productoRoutes from "./routes/producto.routes.js";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Servidor funcionando correctamente",
  });
});

app.use("/api/productos", productoRoutes);

export default app;
