import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../utils/http";

export function validateBody(schema: z.ZodTypeAny) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join("; ");
      throw new AppError(400, message || "Invalid request body");
    }

    request.body = result.data;
    next();
  };
}

export function validateQuery(schema: z.ZodTypeAny) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join("; ");
      throw new AppError(400, message || "Invalid query parameters");
    }

    request.query = result.data;
    next();
  };
}
