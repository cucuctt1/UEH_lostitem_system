import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import {
  confirmReturnWorkflow,
  listConversationMessages,
  listMyConversations,
  sendMessageWorkflow
} from "../services/messageService";
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
