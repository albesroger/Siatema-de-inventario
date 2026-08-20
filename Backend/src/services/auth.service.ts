import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { generarToken } from "../config/jwt.js";
import { LoginInput } from "../schemas/auth.schema.js";

export const me = async (usuarioId: string, negocioId: string) => {
  const usuario = await prisma.usuario.findFirst({
    where: {
      id: usuarioId,
      negocioId,
      estado: "ACTIVO",
    },
    include: {
      negocio: {
        select: {
          id: true,
          nombre: true,
          nombre_comercial: true,
        },
      },
    },
  });

  if (!usuario) {
    return null;
  }

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    username: usuario.username,
    rol: usuario.rol,
    negocioId: usuario.negocioId,
    negocio: {
      id: usuario.negocio.id,
      nombre: usuario.negocio.nombre,
      nombreComercial: usuario.negocio.nombre_comercial,
    },
  };
};

export const login = async (data: LoginInput) => {
  // ========================================================
  // 1. BUSCAR USUARIO
  // ========================================================

  const usuario = await prisma.usuario.findFirst({
    where: {
      username: data.username,
    },
    include: {
      negocio: {
        select: {
          id: true,
          nombre: true,
          nombre_comercial: true,
        },
      },
    },
  });

  if (!usuario) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  // ========================================================
  // 2. VALIDAR ESTADO
  // ========================================================

  if (usuario.estado !== "ACTIVO") {
    throw new Error("El usuario está inactivo");
  }

  // ========================================================
  // 3. VERIFICAR PASSWORD
  // ========================================================

  const passwordCorrecta = await bcrypt.compare(
    data.password,
    usuario.passwordHash,
  );

  if (!passwordCorrecta) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  // ========================================================
  // 4. ACTUALIZAR ÚLTIMO ACCESO
  // ========================================================

  await prisma.usuario.update({
    where: {
      id: usuario.id,
    },
    data: {
      ultimoAccesoAt: new Date(),
    },
  });

  // ========================================================
  // 5. GENERAR JWT
  // ========================================================

  const token = generarToken({
    usuarioId: usuario.id,
    negocioId: usuario.negocioId,
    rol: usuario.rol,
  });

  // ========================================================
  // 6. RESPUESTA
  // ========================================================

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      username: usuario.username,
      rol: usuario.rol,
      negocioId: usuario.negocioId,
      negocio: {
        id: usuario.negocio.id,
        nombre: usuario.negocio.nombre,
        nombreComercial: usuario.negocio.nombre_comercial,
      },
    },
  };
};
