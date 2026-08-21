import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../src/config/database.js";

const main = async () => {
  const negocio = await prisma.negocio.findFirst();

  if (!negocio) {
    throw new Error("No existe ningún negocio. Crea primero un negocio.");
  }

  const usuarioExistente = await prisma.usuario.findFirst({
    where: {
      negocioId: negocio.id,
      username: "admin",
    },
  });

  if (usuarioExistente) {
    console.log("El usuario admin ya existe; no se modifica su contraseña.");
    return;
  }

  const password =
    process.env.SEED_ADMIN_PASSWORD ||
    crypto.randomBytes(12).toString("base64url");

  const passwordHash = await bcrypt.hash(password, 12);

  const usuario = await prisma.usuario.create({
    data: {
      negocioId: negocio.id,
      nombre: "Administrador",
      username: "admin",
      passwordHash,
      rol: "ADMINISTRADOR",
      estado: "ACTIVO",
    },
  });

  console.log(`Usuario creado: ${usuario.username}`);

  if (process.env.SEED_ADMIN_PASSWORD) {
    console.log("Contraseña definida mediante SEED_ADMIN_PASSWORD.");
  } else {
    console.log(`Contraseña generada: ${password}`);
    console.log("Guárdala ahora: no se volverá a mostrar ni a restablecer.");
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });