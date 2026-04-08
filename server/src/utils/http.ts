import { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function sendSuccess<T>(response: Response, message: string, data?: T, statusCode = 200): void {
  response.status(statusCode).json({
    success: true,
    message,
    data
  });
}

export function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>
) {
  return (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response, next).catch(next);
  };
}
