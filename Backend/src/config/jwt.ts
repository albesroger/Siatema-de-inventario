import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está configurado");
}

if (JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET es demasiado débil: debe tener al menos 32 caracteres",
  );
}

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30m";

export interface JwtPayload {
  usuarioId: string;
  negocioId: string;
  rol: string;
}

export const generarToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

export const verificarToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS256"],
  }) as JwtPayload;
};
