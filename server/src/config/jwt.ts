import jwt from "jsonwebtoken";
import { env } from "./env";
import { AuthUser } from "../types";

interface TokenPayload {
  sub: number;
  email: string;
  role: AuthUser["role"];
  fullName: string;
}

export function signAccessToken(user: AuthUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    issuer: "lost-found-system"
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret, { issuer: "lost-found-system" }) as unknown as TokenPayload;
}
