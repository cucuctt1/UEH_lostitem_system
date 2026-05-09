import { AppError } from "../utils/http";
import { createVerificationRequest, getVerificationRequestById, resolveVerificationRequest } from "../models/verificationModel";
import { getPostById, setPostStatus } from "../models/postModel";
import { createNotification } from "../models/notificationModel";
import { findConversationById, createMessage } from "../models/messageModel";
import { toUploadUrl } from "../config/multer";

export async function markPostFound(postId: number, requesterId: number, evidenceUrl?: string | null) {
  const post = await getPostById(postId);
  if (!post) {
    throw new AppError(404, "Post not found");
  }

  // Idempotent: if already found or returned, just return
  if (post.status === "found" || post.status === "returned") {
    return null;
  }

  await setPostStatus(postId, "found");

  const requestId = await createVerificationRequest({
    postId,
    requesterId,
    requestType: "owner_mark_found",
    evidenceUrl: evidenceUrl ?? null
  });

  // notify admins and (optionally) matched parties via notifications
  await createNotification({
    userId: post.user_id,
    type: "post_status",
    title: "Bài đã được đánh dấu đã tìm thấy",
    body: `Bài #${postId} được người đăng đánh dấu là đã tìm thấy. Yêu cầu xác minh #${requestId}`,
    referenceType: "post",
    referenceId: postId
  });

  // notify admins
  await createNotification({
    userId: 1, // placeholder: system/admin notifier - real implementation should notify all admins or a queue
    type: "matching_result",
    title: "Yêu cầu xác minh: bài đã tìm thấy",
    body: `Bài #${postId} đã được đánh dấu tìm thấy (request #${requestId})`,
    referenceType: "post",
    referenceId: postId
  });

  return requestId;
}

export async function finderHanded(conversationId: number, requesterId: number, imageUrl?: string | null) {
  const conv = await findConversationById(conversationId);
  if (!conv) {
    throw new AppError(404, "Conversation not found");
  }

  // create an in-chat message summarizing handed-over
  const text = `Người nhặt báo đã trao đồ (yêu cầu xác minh).`;
  await createMessage(conversationId, requesterId, text, imageUrl ?? null);

  const requestId = await createVerificationRequest({
    postId: conv.post_id,
    conversationId,
    requesterId,
    requestType: "handover",
    evidenceUrl: imageUrl ?? null
  });

  // notify owner
  const ownerId = conv.user_one_id === requesterId ? conv.user_two_id : conv.user_one_id;
  await createNotification({
    userId: ownerId,
    type: "matching_result",
    title: "Người nhặt đã báo trao đồ",
    body: `Người nhặt đã báo trao đồ cho bài #${conv.post_id}`,
    referenceType: "conversation",
    referenceId: conversationId
  });

  return requestId;
}

export async function adminResolveRequest(requestId: number, adminId: number, approve: boolean) {
  const req = await getVerificationRequestById(requestId);
  if (!req) {
    throw new AppError(404, "Verification request not found");
  }

  const status = approve ? "resolved" : "rejected";
  await resolveVerificationRequest(requestId, adminId, status as any);

  if (approve) {
    // set post returned
    await setPostStatus(req.post_id, "returned");
    await createNotification({
      userId: req.requester_id,
      type: "matching_result",
      title: "Yêu cầu xác minh đã được chấp nhận",
      body: `Yêu cầu #${requestId} đã được xác nhận bởi quản trị`,
      referenceType: "post",
      referenceId: req.post_id
    });
  }

  return req;
}
