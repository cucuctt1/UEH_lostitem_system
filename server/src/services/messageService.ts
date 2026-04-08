import { AppError } from "../utils/http";
import {
  createMessage,
  findConversationById,
  findOrCreateConversation,
  listConversationsForUser,
  listMessages
} from "../models/messageModel";
import { createNotification } from "../models/notificationModel";
import { getMatchById, setMatchStatus } from "../models/matchModel";
import { setPostStatus } from "../models/postModel";
import { Conversation, Message } from "../domain/entities";

export async function listConversationMessages(conversationId: number, requesterId: number) {
  const conversation = await findConversationById(conversationId);
  if (!conversation) {
    throw new AppError(404, "Conversation not found");
  }

  if (conversation.user_one_id !== requesterId && conversation.user_two_id !== requesterId) {
    throw new AppError(403, "You do not have access to this conversation");
  }

  const messages = await listMessages(conversationId);
  return {
    conversation: Conversation.fromDb(conversation).toApiView(),
    messages: messages.map((message) => Message.fromDb(message).toApiView())
  };
}

export async function sendMessageWorkflow(input: {
  senderId: number;
  conversationId?: number;
  postId?: number;
  receiverId?: number;
  text?: string;
  imageUrl?: string;
}) {
  const normalizedText = input.text?.trim();

  if (!normalizedText && !input.imageUrl) {
    throw new AppError(400, "Either text or image is required");
  }

  let conversationId = input.conversationId;

  if (!conversationId) {
    if (!input.postId || !input.receiverId) {
      throw new AppError(400, "postId and receiverId are required when conversationId is missing");
    }
    conversationId = await findOrCreateConversation(input.postId, input.senderId, input.receiverId);
  }

  const conversation = await findConversationById(conversationId);
  if (!conversation) {
    throw new AppError(404, "Conversation not found");
  }

  if (conversation.user_one_id !== input.senderId && conversation.user_two_id !== input.senderId) {
    throw new AppError(403, "You are not in this conversation");
  }

  const messageId = await createMessage(
    conversationId,
    input.senderId,
    normalizedText ?? null,
    input.imageUrl ?? null
  );

  const receiverId = conversation.user_one_id === input.senderId ? conversation.user_two_id : conversation.user_one_id;
  await createNotification({
    userId: receiverId,
    type: "new_message",
    title: "New message",
    body: "You received a new message about an item.",
    referenceType: "conversation",
    referenceId: conversationId
  });

  return {
    messageId,
    conversationId
  };
}

export async function listMyConversations(userId: number) {
  const rows = await listConversationsForUser(userId);
  return rows.map((row) => Conversation.fromDb(row).toApiView());
}

export async function confirmReturnWorkflow(conversationId: number, userId: number, matchId: number): Promise<void> {
  const conversation = await findConversationById(conversationId);
  if (!conversation) {
    throw new AppError(404, "Conversation not found");
  }
  if (conversation.user_one_id !== userId && conversation.user_two_id !== userId) {
    throw new AppError(403, "You are not in this conversation");
  }

  const match = await getMatchById(matchId);
  if (!match) {
    throw new AppError(404, "Match not found");
  }

  const conversationPostInMatch =
    match.lost_post_id === conversation.post_id || match.found_post_id === conversation.post_id;

  if (!conversationPostInMatch) {
    throw new AppError(400, "This match does not belong to the selected conversation item");
  }

  if (match.status === "rejected") {
    throw new AppError(400, "Cannot confirm return for a rejected match");
  }

  if (match.status === "returned") {
    return;
  }

  await setMatchStatus(matchId, "returned");
  await setPostStatus(match.lost_post_id, "returned");
  await setPostStatus(match.found_post_id, "returned");
}
