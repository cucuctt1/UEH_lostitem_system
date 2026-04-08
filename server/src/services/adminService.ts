import { AppError } from "../utils/http";
import { getPostById, setModerationStatus, softDeletePost } from "../models/postModel";
import { createNotification } from "../models/notificationModel";
import { listUsers, setUserLock } from "../models/userModel";
import { listReports, resolveReport } from "../models/reportModel";
import { createStoredItem, listStoredItems, updateStoredItemStatus } from "../models/itemModel";
import { recalculateMatchesForPost } from "./matchingService";
import { Item, Report, User } from "../domain/entities";
import { syncTagMetadata } from "./tagService";

export async function approvePost(postId: number, adminId: number, approved: boolean): Promise<void> {
  const post = await getPostById(postId);
  if (!post) {
    throw new AppError(404, "Post not found");
  }

  await setModerationStatus(postId, approved ? "approved" : "rejected", adminId);

  await createNotification({
    userId: post.user_id,
    type: "post_status",
    title: approved ? "Post approved" : "Post rejected",
    body: approved ? "Your post is now visible in feed." : "Your post was rejected by an admin.",
    referenceType: "post",
    referenceId: postId
  });

  if (approved) {
    await recalculateMatchesForPost(postId);
  }
}

export async function deletePostAsAdmin(postId: number): Promise<void> {
  await softDeletePost(postId);
  await syncTagMetadata();
}

export async function lockUser(userId: number, locked: boolean): Promise<void> {
  await setUserLock(userId, locked);
}

export async function getUsers() {
  const rows = await listUsers();
  return rows.map((row) => User.fromDb(row).toAdminView());
}

export async function getReports(status?: "open" | "resolved") {
  const rows = await listReports(status);
  return rows.map((row) => Report.fromDb(row).toApiView());
}

export async function resolveReportAsAdmin(reportId: number, adminId: number): Promise<void> {
  await resolveReport(reportId, adminId);
}

export async function getStoredItems() {
  const rows = await listStoredItems();
  return rows.map((row) => Item.fromDb(row).toApiView());
}

export async function createStoredItemAsAdmin(input: {
  name: string;
  description: string;
  categoryId: number;
  locationId: number;
  quantity: number;
  status: "stored" | "claimed" | "disposed";
  postId?: number;
  managedBy: number;
}) {
  return createStoredItem(input);
}

export async function updateStoredItemStatusAsAdmin(
  itemId: number,
  status: "stored" | "claimed" | "disposed"
): Promise<void> {
  await updateStoredItemStatus(itemId, status);
}
