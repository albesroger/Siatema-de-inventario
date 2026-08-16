import bcrypt from "bcryptjs";
import { prisma } from "../src/config/database.js";

const main = async () => {
  const negocio = await prisma.negocio.findFirst();

  if (!negocio) {
    throw new Error("No existe ningún negocio. Crea primero un negocio.");
  }

  const passwordHash = await bcrypt.hash("123456", 12);

  const usuarioExistente = await prisma.usuario.findFirst({
    where: {
      negocioId: negocio.id,
      username: "admin",
    },
  });

  if (usuarioExistente) {
    const passwordHash = await bcrypt.hash("123456", 12);

    await prisma.usuario.update({
      where: {
        id: usuarioExistente.id,
      },
      data: {
        passwordHash,
        estado: "ACTIVO",
        rol: "ADMINISTRADOR",
      },
    });

    console.log("Usuario admin actualizado correctamente");

    return;
  }

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
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
