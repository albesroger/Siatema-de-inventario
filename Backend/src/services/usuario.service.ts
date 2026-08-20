import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";

export const crearUsuario = async (
  data: {
    nombre: string;
    username: string;
    password: string;
    rol: "ADMINISTRADOR" | "VENDEDOR";
    estado: "ACTIVO" | "INACTIVO";
  },
  negocioId: string,
) => {
  // ========================================================
  // 1. VERIFICAR USERNAME
  // ========================================================

  const usuarioExistente = await prisma.usuario.findFirst({
    where: {
      negocioId,
      username: data.username,
    },
  });

  if (usuarioExistente) {
    throw new Error("El username ya existe en este negocio");
  }

  // ========================================================
  // 2. HASH PASSWORD
  // ========================================================

  const passwordHash = await bcrypt.hash(data.password, 12);

  // ========================================================
  // 3. CREAR USUARIO
  // ========================================================

  const usuario = await prisma.usuario.create({
    data: {
      negocioId,
      nombre: data.nombre,
      username: data.username,
      passwordHash,
      rol: data.rol,
      estado: data.estado,
    },

    select: {
      id: true,
      negocioId: true,
      nombre: true,
      username: true,
      rol: true,
      estado: true,
      ultimoAccesoAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return usuario;
};

export const listarUsuarios = async (negocioId: string) => {
  return prisma.usuario.findMany({
    where: {
      negocioId,
    },

    select: {
      id: true,
      negocioId: true,
      nombre: true,
      username: true,
      rol: true,
      estado: true,
      ultimoAccesoAt: true,
      createdAt: true,
      updatedAt: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

export const obtenerUsuarioPorId = async (id: string, negocioId: string) => {
  const usuario = await prisma.usuario.findFirst({
    where: {
      id,
      negocioId,
    },

    select: {
      id: true,
      negocioId: true,
      nombre: true,
      username: true,
      rol: true,
      estado: true,
      ultimoAccesoAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  return usuario;
};

export const actualizarUsuario = async (
  id: string,
  negocioId: string,
  data: {
    nombre?: string;
    username?: string;
    password?: string;
    rol?: "ADMINISTRADOR" | "VENDEDOR";
    estado?: "ACTIVO" | "INACTIVO";
  },
) => {
  const usuario = await prisma.usuario.findFirst({
    where: {
      id,
      negocioId,
    },
  });

  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  if (data.username && data.username !== usuario.username) {
    const existente = await prisma.usuario.findFirst({
      where: {
        negocioId,
        username: data.username,
        NOT: {
          id,
        },
      },
    });

    if (existente) {
      throw new Error("El username ya está siendo utilizado");
    }
  }

  const updateData: {
    nombre?: string;
    username?: string;
    passwordHash?: string;
    rol?: "ADMINISTRADOR" | "VENDEDOR";
    estado?: "ACTIVO" | "INACTIVO";
  } = {};

  if (data.nombre !== undefined) {
    updateData.nombre = data.nombre;
  }

  if (data.username !== undefined) {
    updateData.username = data.username;
  }

  if (data.password !== undefined) {
    updateData.passwordHash = await bcrypt.hash(data.password, 12);
  }

  if (data.rol !== undefined) {
    updateData.rol = data.rol;
  }

  if (data.estado !== undefined) {
    updateData.estado = data.estado;
  }

  return prisma.usuario.update({
    where: {
      id,
    },

    data: updateData,

    select: {
      id: true,
      negocioId: true,
      nombre: true,
      username: true,
      rol: true,
      estado: true,
      ultimoAccesoAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};
