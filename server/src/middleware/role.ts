import { NextFunction, Request, Response } from "express";
import { Role } from "../types";
import { AppError } from "../utils/http";

export function requireRole(...roles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    if (!roles.includes(request.user.role)) {
      throw new AppError(403, "Insufficient permissions");
    }

    next();
  };
}
