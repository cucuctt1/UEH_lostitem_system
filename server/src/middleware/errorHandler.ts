import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { AppError } from "../utils/http";

export function notFound(_request: Request, response: Response): void {
  response.status(404).json({
    success: false,
    message: "Route not found"
  });
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
    response.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
    return;
  }

  response.status(500).json({
    success: false,
    message: "Internal server error"
  });
}
