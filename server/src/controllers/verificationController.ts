import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import { markPostFound, finderHanded, adminResolveRequest } from "../services/verificationService";

export const markFoundController = asyncHandler(async (request: Request, response: Response) => {
  const postId = Number(request.params.id);
  const uploadedImageUrl = request.file ? (request.file && `/uploads/${request.file.filename}`) : undefined;
  const requestId = await markPostFound(postId, request.user!.id, uploadedImageUrl);
  sendSuccess(response, "Marked found", { requestId });
});

export const finderHandedController = asyncHandler(async (request: Request, response: Response) => {
  const conversationId = Number(request.params.conversationId);
  const uploadedImageUrl = request.file ? (request.file && `/uploads/${request.file.filename}`) : undefined;
  const requestId = await finderHanded(conversationId, request.user!.id, uploadedImageUrl);
  sendSuccess(response, "Handed reported", { requestId });
});

export const adminResolveController = asyncHandler(async (request: Request, response: Response) => {
  const requestId = Number(request.params.requestId);
  const approve = Boolean(request.body.approve);
  const result = await adminResolveRequest(requestId, request.user!.id, approve);
  sendSuccess(response, "Resolved", result);
});
