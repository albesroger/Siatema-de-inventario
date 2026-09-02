import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/database.js";

const esConflictoSerializacion = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2034";
  }

  // Con driver adapters el error puede llegar sin mapear a
  // PrismaClientKnownRequestError; detectamos por mensaje.
  const mensaje = error instanceof Error ? error.message : String(error);

  return (
    mensaje.includes("write conflict") ||
    mensaje.includes("deadlock") ||
    mensaje.includes("could not serialize") ||
    mensaje.includes("serialization failure")
  );
};

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Ejecuta una transacción y reintenta automáticamente ante conflictos
 * de serialización (P2034).
 *
 * Esto evita:
 * - Condiciones de carrera (TOCTOU) al validar y actualizar stock.
 * - Colisiones en la generación de números de documento concurrentes.
 *
 * Nota: SQLite escribe de forma estrictamente serializada, por lo que
 * no se especifica un isolation level explícito.
 */
export const transaccionSerializada = async <T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  intentosMaximos = 5,
): Promise<T> => {
  let ultimoError: unknown;

  for (let intento = 1; intento <= intentosMaximos; intento++) {
    try {
      return await prisma.$transaction(fn);
    } catch (error) {
      ultimoError = error;

      if (!esConflictoSerializacion(error) || intento === intentosMaximos) {
        throw error;
      }

      await esperar(25 * intento + Math.random() * 50);
    }
  }

  throw ultimoError;
};