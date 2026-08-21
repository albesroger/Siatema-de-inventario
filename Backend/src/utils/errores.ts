import { Prisma } from "../generated/prisma/client.js";

/**
 * Devuelve un mensaje apto para mostrar al cliente.
 *
 * Los errores de negocio (Error con mensaje intencional) se propagan;
 * los errores internos (Prisma, driver, base de datos) se reemplazan
 * por un mensaje genérico para no filtrar detalles del sistema.
 */
export const mensajeSeguro = (error: unknown, fallback: string): string => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return fallback;
  }

  const mensaje = error instanceof Error ? error.message : String(error ?? "");

  // Con driver adapters los errores pueden llegar sin mapear a clases Prisma.
  const esInterno =
    mensaje.includes("Invalid `") ||
    mensaje.includes("write conflict") ||
    mensaje.includes("deadlock") ||
    mensaje.includes("could not serialize") ||
    mensaje.includes("serialization failure") ||
    mensaje.includes("Connection terminated") ||
    mensaje.includes("ECONNREFUSED") ||
    mensaje.includes("syntax for type");

  if (esInterno) {
    return fallback;
  }

  return mensaje || fallback;
};