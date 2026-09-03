======================================================
  SISTEMA DE INVENTARIO
==================================================

DESCRIPCIÓN
-----------
Sistema de gestión de inventario desarrollado con Nuxt 4 (frontend) y Express.js (backend).
Permite administrar productos, categorías, proveedores, entradas, salidas, ventas,
ajustes de inventario y movimientos.

Se distribuye como una aplicación de escritorio (Windows/macOS) mediante Electron.
La base de datos SQLite es portable y no requiere instalación separada.

TECNOLOGÍAS
-----------
- Frontend: Nuxt 4, Vue 3, TypeScript, Tailwind CSS
- Backend: Express.js, TypeScript, Prisma ORM
- Base de datos: SQLite (via @prisma/adapter-better-sqlite3)
- Escritorio: Electron + electron-builder
- Autenticación: JWT

ESTRUCTURA DEL PROYECTO
-----------------------
Sistema de inventario/
├── electron/
│   ├── main.js                       # Proceso principal de Electron
│   └── preload.js                    # Preload de contextBridge
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma             # Esquema de base de datos (SQLite)
│   │   └── seed.ts                   # Datos iniciales (negocio + admin)
│   ├── src/
│   │   ├── app.ts                    # Configuración de Express + estáticos
│   │   ├── server.ts                 # Servidor HTTP
│   │   ├── config/
│   │   │   ├── database.ts           # Conexión a SQLite via Prisma
│   │   │   └── jwt.ts               # Configuración JWT
│   │   ├── controllers/              # Controladores de cada módulo
│   │   ├── middlewares/               # Auth, validación, roles
│   │   ├── routes/                   # Rutas de la API
│   │   ├── schemas/                  # Esquemas de validación (Zod)
│   │   ├── services/                 # Lógica de negocio
│   │   ├── scripts/init-db.ts        # Inicializa BD para empaquetado
│   │   └── utils/                    # Utilidades
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── pages/                    # Páginas de la aplicación
│   │   ├── components/               # Componentes reutilizables
│   │   ├── layouts/                  # Layouts de la app
│   │   ├── middleware/               # Middleware de autenticación
│   │   ├── plugins/                  # Plugins (API, auth)
│   │   ├── stores/                   # Estado global (Pinia)
│   │   └── types/                    # Tipos TypeScript
│   └── package.json
├── package.json                      # Raíz: Electron, electron-builder
└── README.txt

MODO DESARROLLO (Web)
---------------------

1. Requisitos previos:
   - Node.js >= 18.x
   - npm

2. Instalar dependencias del backend:
   cd Backend
   npm install

3. Configurar base de datos:
   - El archivo Backend/.env ya contiene DATABASE_URL="file:./dev.db"
   - Ejecutar prisma db push para crear las tablas:
     cd Backend
     npx prisma db push

4. Poblar base de datos:
   cd Backend
   npx prisma seed

5. Iniciar servidor backend:
   cd Backend
   npm run dev
   (Servidor en http://localhost:3000)

6. Instalar dependencias del frontend:
   cd frontend
   npm install

7. Iniciar servidor frontend:
   cd frontend
   npm run dev
   (Aplicación en http://localhost:3001)

CREDENCIALES POR DEFECTO
------------------------
Usuario: admin
Contraseña: admin123 (o la definida en SEED_ADMIN_PASSWORD)

Cambia las credenciales por defecto antes de pasar a producción.

MÓDULOS DEL SISTEMA
-------------------
- Productos: Gestión de productos con código, categoría, precios y stock
- Categorías: Clasificación de productos
- Proveedores: Registro de proveedores
- Entradas: Registro de entradas de inventario (compras)
- Salidas: Registro de salidas de inventario
- Ventas: Punto de venta con carrito de compras
- Ajustes de inventario: Correcciones de stock (positivas/negativas)
- Movimientos: Historial completo de todos los movimientos
- Dispositivos: Gestión de dispositivos de punto de venta
- Usuarios: Gestión de usuarios del sistema

API ENDPOINTS
-------------
- /api/auth/*           - Autenticación
- /api/productos/*      - Productos
- /api/categorias/*     - Categorías
- /api/proveedores/*    - Proveedores
- /api/dispositivos/*   - Dispositivos
- /api/entradas/*       - Entradas de inventario
- /api/salidas/*        - Salidas de inventario
- /api/ventas/*         - Ventas
- /api/ajustes/*        - Ajustes de inventario
- /api/movimientos/*    - Movimientos de inventario
- /api/usuarios/*       - Usuarios


======================================================
  APLICACIÓN DE ESCRITORIO (Windows)
==================================================

La app se empaqueta como un instalador (.exe) usando Electron.
El ejecutable incluye el backend, el frontend compilado y la
base de datos SQLite por defecto con datos iniciales.

PREREQUISITOS PARA EMPAQUETAR (Windows)
----------------------------------------
- Node.js >= 18.x
- npm
- Windows 10/11 (no se puede cruzar-compilar desde macOS/Linux)

GENERAR EL INSTALADOR EN WINDOWS
---------------------------------

1. Clonar o copiar el proyecto en la máquina Windows.

2. Instalar todas las dependencias (raíz + subdirectorios):
   cd "Sistema de inventario 1"
   npm install
   cd Backend && npm install && cd ..
   cd frontend && npm install && cd ..

3. Compilar frontend y backend, e inicializar BD empaquetada:
   npm run build:app

4. Re-compilar better-sqlite3 para el ABI de Electron:
   npm run rebuild:native

5. Generar el instalador Windows:
   npm run dist:win

   Los instaladores se generan en la carpeta release/:
   - release/Sistema de Inventario Setup X.Y.Z.exe   (instalador NSIS)
   - release/Sistema de Inventario X.Y.Z.exe          (portable sin instalación)

6. Distribuir el .exe resultante. No requiere Node.js ni bases de datos
   externas en la máquina del usuario final.

MODO DESARROLLO DE ESCRITORIO
------------------------------

Para probar la app de escritorio sin generar el instalador:

   npm run build:app
   npm run rebuild:native
   npm run electron:dev

Esto compila todo y abre la ventana de la app Electron apuntando
al backend integrado (http://localhost:3000).


NOTAS TÉCNICAS
--------------
- La app genera un JWT_SECRET aleatorio en la primera ejecución
  y lo guarda en la carpeta de datos del usuario.
- La BD SQLite se copia a la carpeta de datos del usuario en el
  primer arranque (userData/inventario.db).
- En macOS se ejecuta con: npm run electron:dev
- El rebuild nativo (rebuild:native) solo es necesario al instalar
  o actualizar dependencias, no en cada build.

IMPORTANTE (macOS - ABI del módulo nativo):
  better-sqlite3 necesita compilarse para un ABI distinto según el runtime:
    - Para desarrollo web (Backend: npm run dev, build:app):
        cd Backend && npm rebuild better-sqlite3
    - Para la app de escritorio (Electron: npm run electron:dev):
        npm run rebuild:native
  Si al correr el backend ves el error "NODE_MODULE_VERSION" compilado contra
  otra versión, ejecuta el comando npm rebuild correspondiente.


ESCÁNER DE CÓDIGO DE BARRAS
---------------------------
El sistema es compatible con escáneres de código de barras USB de tipo
"teclado" (los que simulan escribir el código más un Enter, sin necesidad
de drivers ni instalación).

PASO 1 - Cargar el código al producto:
  En Productos -> Nuevo/Editar producto, existe el campo "Código de barras".
  Escribe allí el código que está impreso en las etiquetas (ej. 7501234567894)
  y guarda. Así el sistema vincula el código con el producto.

PASO 2 - Escanear en operación:
  - Ventas (Punto de venta): en "Nueva venta" hay un campo de escaneo.
    Al escanear el código, el producto se agrega automáticamente al carrito.
  - Entradas de inventario: en "Nueva entrada" hay un campo de escaneo.
    Al escanear el código, el producto se agrega automáticamente al detalle.

Si el código escaneado no coincide con ningún producto, el sistema muestra
un aviso y no agrega nada.

NOTAS
-----
- Los roles de usuario son: ADMINISTRADOR, VENDEDOR
- Los montos se manejan en USD por defecto
- El stock se maneja con decimales (3 decimales)
- Los números de documento son autoincrementales por negocio
