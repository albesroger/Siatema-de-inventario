// ========================================================
// Proceso principal de Electron
// ========================================================
// Lanza el backend Express (Backend/dist/server.js) y abre la
// ventana apuntando a http://localhost:<puerto>.
// La base de datos SQLite se copia a la carpeta de datos del
// usuario la primera vez que se ejecuta la app instalada.
const { app, BrowserWindow, dialog } = require("electron");
const net = require("net");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const BASE_PORT = 3000;
const MAX_PORT = 3010;

// ==================== PUERTO LIBRE =====================
const puertoLibre = (puertoInicial, puertoMaximo) =>
  new Promise((resolve, reject) => {
    const probar = (puerto) => {
      if (puerto > puertoMaximo) {
        return reject(new Error("No se encontró un puerto libre"));
      }
      const servidor = net.createServer();
      servidor.once("error", () => probar(puerto + 1));
      servidor.once("listening", () => {
        servidor.close(() => resolve(puerto));
      });
      servidor.listen(puerto, "127.0.0.1");
    };
    probar(puertoInicial);
  });

// ==================== BASE DE DATOS ====================
function asegurarBaseDeDatos() {
  const userData = app.getPath("userData");
  const dbFile = path.join(userData, "inventario.db");

  if (!fs.existsSync(dbFile)) {
    // ExtraResources copiado por electron-builder: resources/db/inventario.db
    // En desarrollo (electron .), se busca en Backend/db/inventario.db.
    const candidatas = [
      path.join(process.resourcesPath, "db", "inventario.db"),
      path.join(__dirname, "..", "Backend", "db", "inventario.db"),
    ];

    const empaquetada = candidatas.find((c) => fs.existsSync(c));

    try {
      if (empaquetada) {
        fs.copyFileSync(empaquetada, dbFile);
        console.log("Base de datos inicial copiada a", dbFile);
      } else {
        console.warn(
          "No se encontró la base de datos empaquetada; se usará una nueva.",
        );
      }
    } catch (e) {
      console.error("No se pudo copiar la base de datos:", e);
    }
  }

  // Dotenv no sobreescribe variables existentes: aquí ganamos nosotros.
  process.env.DATABASE_URL = `file:${dbFile}`;
}

// ==================== SECRETO JWT ======================
function asegurarSecreto() {
  // Se genera una vez y se persiste para que las sesiones sobrevivan
  // a los reinicios de la aplicación.
  const configFile = path.join(app.getPath("userData"), "config.json");
  let config = {};

  try {
    config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
  } catch (_) {
    // archivo nuevo
  }

  if (!config.jwtSecret) {
    config.jwtSecret = crypto.randomBytes(48).toString("base64url");
    try {
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
    } catch (e) {
      console.error("No se pudo guardar el secreto JWT:", e);
    }
  }

  process.env.JWT_SECRET = config.jwtSecret;
  process.env.JWT_EXPIRES_IN = "8h";
}

// ==================== VENTANA ==========================
function crearVentana(puerto) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: "Sistema de Inventario",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.removeMenu();

  win.loadURL(`http://localhost:${puerto}`);

  win.on("closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
      process.exit(0);
    }
  });

  return win;
}

// ==================== ARRANQUE =========================
const lockUnico = app.requestSingleInstanceLock();

if (!lockUnico) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Si ya hay una instancia corriendo, enfocamos su ventana.
    const [ventana] = BrowserWindow.getAllWindows();
    if (ventana) {
      if (ventana.isMinimized()) ventana.restore();
      ventana.focus();
    }
  });

  app.whenReady().then(async () => {
    asegurarBaseDeDatos();
    asegurarSecreto();

    const puerto = await puertoLibre(BASE_PORT, MAX_PORT);
    process.env.PORT = String(puerto);
    process.env.NODE_ENV = "production";
    process.env.CORS_ORIGIN = `http://localhost:${puerto}`;

    try {
      require(path.join(__dirname, "..", "Backend", "dist", "server.js"));
    } catch (error) {
      console.error("Error al iniciar el servidor:", error);
      dialog.showErrorBox(
        "Error al iniciar el servidor",
        String((error && error.message) || error),
      );
      app.quit();
      return;
    }

    crearVentana(puerto);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        crearVentana(puerto);
      }
    });
  });

  app.on("window-all-closed", () => {
    app.quit();
  });
}