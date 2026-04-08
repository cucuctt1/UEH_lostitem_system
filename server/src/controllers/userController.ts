import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import { getMyHistory, getMyProfile, updateMyProfile } from "../services/userService";

export const meController = asyncHandler(async (request: Request, response: Response) => {
  const result = await getMyProfile(request.user!.id);
  sendSuccess(response, "Fetched profile", result);
});

export const updateMeController = asyncHandler(async (request: Request, response: Response) => {
  await updateMyProfile(request.user!.id, request.body);
  sendSuccess(response, "Profile updated");
});

export const myHistoryController = asyncHandler(async (request: Request, response: Response) => {
  const result = await getMyHistory(request.user!.id);
  sendSuccess(response, "Fetched user history", result);
});
