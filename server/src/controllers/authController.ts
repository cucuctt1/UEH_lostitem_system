import { Request, Response } from "express";
import { login, register } from "../services/authService";
import { asyncHandler, sendSuccess } from "../utils/http";

export const loginController = asyncHandler(async (request: Request, response: Response) => {
  const { email, password } = request.body;
  const result = await login(email, password);
  sendSuccess(response, "Login successful", result);
});

export const registerController = asyncHandler(async (request: Request, response: Response) => {
  const { email, password, fullName } = request.body;
  const result = await register(email, password, fullName);
  sendSuccess(response, "Registration successful", result, 201);
});
