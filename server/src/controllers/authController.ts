import { Request, Response } from "express";
import { login } from "../services/authService";
import { asyncHandler, sendSuccess } from "../utils/http";

export const loginController = asyncHandler(async (request: Request, response: Response) => {
  const { email, password } = request.body;
  const result = await login(email, password);
  sendSuccess(response, "Login successful", result);
});
