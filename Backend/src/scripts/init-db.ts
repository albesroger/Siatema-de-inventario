import "dotenv/config";
import { execSync } from "child_process";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Inicializa la base de datos SQLite que se empaqueta con la app de
 * escritorio: crea el esquema (prisma db push), el negocio por defecto
 * y el usuario administrador.
 *
 * Uso (desde Backend/):
 *   DATABASE_URL="file:./db/inventario.db" npx tsx src/scripts/init-db.ts
 */
const main = async () => {
  const dbUrl = process.env.DATABASE_URL!;

  console.log(`Inicializando base de datos en ${dbUrl} ...`);

  // Crea las tablas según el schema. El CLI de Prisma toma DATABASE_URL
  // de las variables de entorno (gana sobre .env).
  execSync("npx prisma db push", {
    stdio: "inherit",
    env: { ...process.env },
  });

  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  const prisma = new PrismaClient({ adapter });

  const negocio = await prisma.negocio.findFirst();

  if (!negocio) {
    const creado = await prisma.negocio.create({
      data: { nombre: "Mi Negocio", moneda: "CUP" },
    });
    console.log("Negocio creado:", creado.nombre);
  } else {
    console.log("Negocio existente:", negocio.nombre);
  }

  const admin = await prisma.usuario.findFirst({
    where: { username: "admin" },
  });

  if (!admin) {
    const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
    const passwordHash = await bcrypt.hash(password, 12);
    const negocioId = (await prisma.negocio.findFirst())!.id;

    await prisma.usuario.create({
      data: {
        negocioId,
        nombre: "Administrador",
        username: "admin",
        passwordHash,
        rol: "ADMINISTRADOR",
        estado: "ACTIVO",
      },
    });
    console.log(`Usuario admin creado. Contraseña por defecto: ${password}`);
  } else {
    console.log("Usuario admin ya existe; no se modifica.");
  }

  await prisma.$disconnect();
  console.log("Base de datos inicializada correctamente.");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});