import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../config/jwt";
import { AppError } from "../utils/http";

export function requireAuth(request: Request, _response: Response, next: NextFunction): void {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "Authorization token is required");
  }

  const token = header.split(" ")[1];
  const payload = verifyAccessToken(token);

  request.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    fullName: payload.fullName
  };

  next();
}
