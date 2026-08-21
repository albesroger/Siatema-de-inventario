======================================================
  SISTEMA DE INVENTARIO
==================================================

DESCRIPCIÓN
-----------
Sistema de gestión de inventario desarrollado con Nuxt 3 (frontend) y Express.js (backend).
Permite administrar productos, categorías, proveedores, entradas, salidas, ventas, ajustes de inventario y movimientos.

TECNOLOGÍAS
-----------
- Frontend: Nuxt 3, Vue 3, TypeScript, Tailwind CSS
- Backend: Express.js, TypeScript, Prisma ORM
- Base de datos: PostgreSQL
- Autenticación: JWT

ESTRUCTURA DEL PROYECTO
-----------------------
Siatema de inventario/
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Esquema de base de datos
│   │   └── seed.ts                # Datos iniciales
│   ├── src/
│   │   ├── app.ts                 # Configuración de Express
│   │   ├── server.ts              # Servidor HTTP
│   │   ├── config/
│   │   │   ├── database.ts        # Conexión a PostgreSQL
│   │   │   └── jwt.ts             # Configuración JWT
│   │   ├── controllers/           # Controladores de cada módulo
│   │   ├── middlewares/            # Auth, validación, roles
│   │   ├── repositories/          # Acceso a datos
│   │   ├── routes/                # Rutas de la API
│   │   ├── schemas/               # Esquemas de validación (Zod)
│   │   ├── services/              # Lógica de negocio
│   │   └── utils/                 # Utilidades
│   └── package.json
└── frontend/
    ├── app/
    │   ├── pages/                 # Páginas de la aplicación
    │   │   ├── productos/
    │   │   ├── categorias/
    │   │   ├── proveedores/
    │   │   ├── entradas/
    │   │   ├── salidas/
    │   │   ├── ventas/
    │   │   ├── ajustes-inventario/
    │   │   └── movimientos/
    │   ├── components/            # Componentes reutilizables
    │   ├── layouts/               # Layouts de la app
    │   ├── middleware/             # Middleware de autenticación
    │   ├── plugins/               # Plugins (API, auth)
    │   ├── stores/                # Estado global (Pinia)
    │   └── types/                 # Tipos TypeScript
    └── package.json

CONFIGURACIÓN E INSTALACIÓN
----------------------------

1. Requisitos previos:
   - Node.js >= 18.x
   - PostgreSQL >= 14.x
   - npm o yarn

2. Configurar base de datos:
   - Crear una base de datos PostgreSQL
   - Copiar Backend/.env.example a Backend/.env
   - Configurar DATABASE_URL en Backend/.env

3. Instalar dependencias del backend:
   cd Backend
   npm install

4. Generar cliente de Prisma:
   cd Backend
   npx prisma generate

5. Ejecutar migraciones:
   cd Backend
   npx prisma migrate dev

6. Poblar base de datos (opcional):
   cd Backend
   npx tsx prisma/seed.ts

7. Iniciar servidor backend:
   cd Backend
   npm run dev
   (Servidor en http://localhost:3000)

8. Instalar dependencias del frontend:
   cd frontend
   npm install

9. Iniciar servidor frontend:
   cd frontend
   npm run dev
   (Aplicación en http://localhost:3001)

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

CREDENCIALES POR DEFECTO
------------------------
El seed crea el usuario "admin" solo si no existe:
- Si defines SEED_ADMIN_PASSWORD en Backend/.env, esa será su contraseña.
- Si no, se genera una aleatoria y se muestra una sola vez al ejecutarlo.

NOTA: el seed nunca modifica la contraseña de un admin existente.
Cambia las credenciales por defecto antes de pasar a producción.

NOTAS
-----
- El sistema usa JWT para autenticación
- Los roles de usuario son: ADMINISTRADOR, VENDEDOR
- Los montos se manejan en USD por defecto
- El stock se maneja con decimales (3 decimales)
- Los números de documento son autoincrementales por negocio
