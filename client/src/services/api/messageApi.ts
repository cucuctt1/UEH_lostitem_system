import { ApiEnvelope, Conversation, Message } from "../../types";
import { apiClient } from "./client";

export interface SendMessagePayload {
  conversationId?: number;
  postId?: number;
  receiverId?: number;
  text?: string;
  imageUrl?: string;
  imageFile?: File;
}

export async function listConversationsApi(): Promise<Conversation[]> {
  const { data } = await apiClient.get<ApiEnvelope<Conversation[]>>("/messages/conversations");
  return data.data;
}

export async function listMessagesApi(conversationId: number): Promise<{
  conversation: {
    id: number;
    post_id: number;
    user_one_id: number;
    user_two_id: number;
  };
  messages: Message[];
}> {
  const { data } = await apiClient.get<ApiEnvelope<any>>(`/messages/${conversationId}`);
  return data.data;
}

export async function sendMessageApi(payload: SendMessagePayload): Promise<{ messageId: number; conversationId: number }> {
  const formData = new FormData();

  if (typeof payload.conversationId === "number") {
    formData.append("conversationId", String(payload.conversationId));
  }
  if (typeof payload.postId === "number") {
    formData.append("postId", String(payload.postId));
  }
  if (typeof payload.receiverId === "number") {
    formData.append("receiverId", String(payload.receiverId));
  }
  if (payload.text) {
    formData.append("text", payload.text);
  }
  if (payload.imageUrl) {
    formData.append("imageUrl", payload.imageUrl);
  }
  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }

  const { data } = await apiClient.post<ApiEnvelope<{ messageId: number; conversationId: number }>>(
    "/messages",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
  return data.data;
}

export async function confirmReturnApi(conversationId: number, matchId: number): Promise<void> {
  await apiClient.post(`/messages/${conversationId}/confirm-return`, { matchId });
}

export async function createConversationApi(postId: number, receiverId: number): Promise<{ conversationId: number }> {
  const { data } = await apiClient.post<ApiEnvelope<{ conversationId: number }>>("/messages/conversations", {
    postId,
    receiverId
  });
  return data.data;
}

export async function requestVerificationApi(conversationId: number, imageFile?: File): Promise<void> {
  const formData = new FormData();
  if (imageFile) {
    formData.append("image", imageFile);
  }

  await apiClient.post(`/messages/${conversationId}/request-verification`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}
