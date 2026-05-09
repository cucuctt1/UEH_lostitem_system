import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import {
  confirmReturnWorkflow,
  listConversationMessages,
  listMyConversations,
  sendMessageWorkflow
} from "../services/messageService";
import { createOrFindConversation, requestVerificationWorkflow } from "../services/messageService";
import { toUploadUrl } from "../config/multer";

export const listConversationsController = asyncHandler(async (request: Request, response: Response) => {
  const conversations = await listMyConversations(request.user!.id);
  sendSuccess(response, "Fetched conversations", conversations);
});

export const getMessagesController = asyncHandler(async (request: Request, response: Response) => {
  const conversationId = Number(request.params.conversationId);
  const result = await listConversationMessages(conversationId, request.user!.id);
  sendSuccess(response, "Fetched messages", result);
});

export const sendMessageController = asyncHandler(async (request: Request, response: Response) => {
  const uploadedImageUrl = request.file ? toUploadUrl(request.file.filename) : undefined;

  const result = await sendMessageWorkflow({
    senderId: request.user!.id,
    conversationId: request.body.conversationId,
    postId: request.body.postId,
    receiverId: request.body.receiverId,
    text: request.body.text,
    imageUrl: uploadedImageUrl ?? request.body.imageUrl
  });

  sendSuccess(response, "Message sent", result, 201);
});

export const confirmReturnController = asyncHandler(async (request: Request, response: Response) => {
  const conversationId = Number(request.params.conversationId);
  await confirmReturnWorkflow(conversationId, request.user!.id, request.body.matchId);
  sendSuccess(response, "Return confirmed");
});

export const createConversationController = asyncHandler(async (request: Request, response: Response) => {
  const postId = Number(request.body.postId);
  const receiverId = Number(request.body.receiverId);
  const conversationId = await createOrFindConversation(postId, request.user!.id, receiverId);
  sendSuccess(response, "Conversation ready", { conversationId }, 201);
});

export const requestVerificationController = asyncHandler(async (request: Request, response: Response) => {
  const conversationId = Number(request.params.conversationId);
  const uploadedImageUrl = request.file ? toUploadUrl(request.file.filename) : undefined;
  await requestVerificationWorkflow(conversationId, request.user!.id, uploadedImageUrl);
  sendSuccess(response, "Verification requested");
});
