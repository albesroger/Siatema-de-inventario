// Preload mínimo. No se necesita IPC por ahora; se mantiene para
// usos futuros (impresión, exportación a archivo, etc.).
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("appInfo", {
  version: process.env.npm_package_version || "1.0.0",
});