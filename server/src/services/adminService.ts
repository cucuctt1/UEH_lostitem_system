import { AppError } from "../utils/http";
import { getPostById, setModerationStatus, softDeletePost } from "../models/postModel";
import { createNotification } from "../models/notificationModel";
import { createUser, findUserByEmail, findUserById, listUsers, setUserLock } from "../models/userModel";
import { listReports, resolveReport } from "../models/reportModel";
import {
  createStoredItem,
  deleteStoredItem,
  listStoredItems,
  updateStoredItem,
  updateStoredItemStatus
} from "../models/itemModel";
import { listCategories, listLocations } from "../models/lookupModel";
import { recalculateMatchesForPost } from "./matchingService";
import { Item, Report, User } from "../domain/entities";
import { syncTagMetadata } from "./tagService";
import bcrypt from "bcryptjs";
import {
  createTagForAdmin,
  deleteTagForAdmin,
  listTagsForAdmin,
  updateTagForAdmin
} from "../models/tagModel";
import { normalizeTagToken } from "../utils/tags";

const REQUIRED_EMAIL_DOMAIN = "@st.ueh.edu.vn";

function normalizeSchoolEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!normalized.endsWith(REQUIRED_EMAIL_DOMAIN)) {
    throw new AppError(400, "Email must end with @st.ueh.edu.vn");
  }

  return normalized;
}

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
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.role === "admin") {
    throw new AppError(400, "Admin account cannot be locked");
  }

  await setUserLock(userId, locked);
}

export async function getUsers() {
  const rows = await listUsers();
  return rows.map((row) => User.fromDb(row).toAdminView());
}

export async function createUserAsAdmin(input: {
  fullName: string;
  email: string;
  temporaryPassword: string;
}) {
  const normalizedEmail = normalizeSchoolEmail(input.email);
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new AppError(409, "Email already exists");
  }

  const passwordHash = await bcrypt.hash(input.temporaryPassword, 10);
  const userId = await createUser(normalizedEmail, passwordHash, input.fullName, "user", {
    mustChangePassword: true
  });

  return {
    userId,
    email: normalizedEmail
  };
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
  description?: string | null;
  senderName?: string | null;
  senderStudentId?: string | null;
  categoryId: number;
  locationId: number;
  quantity: number;
  status: "stored" | "claimed" | "disposed";
  postId?: number;
  managedBy: number;
}) {
  // Validate category
  const categories = await listCategories();
  if (!categories.some((c: any) => Number(c.id) === Number(input.categoryId))) {
    throw new AppError(400, "Invalid category");
  }

  // Validate location
  const locations = await listLocations();
  if (!locations.some((l: any) => Number(l.id) === Number(input.locationId))) {
    throw new AppError(400, "Invalid location");
  }

  // If postId provided, ensure post exists
  if (input.postId) {
    const post = await getPostById(input.postId);
    if (!post) {
      throw new AppError(400, "Referenced post does not exist");
    }
  }

  // Ensure manager exists
  const manager = await findUserById(input.managedBy);
  if (!manager) {
    throw new AppError(400, "Manager user not found");
  }

  return createStoredItem(input);
}

export async function updateStoredItemStatusAsAdmin(
  itemId: number,
  status: "stored" | "claimed" | "disposed"
): Promise<void> {
  await updateStoredItemStatus(itemId, status);
}

export async function updateStoredItemAsAdmin(
  itemId: number,
  input: {
    name: string;
    description?: string | null;
    senderName?: string | null;
    senderStudentId?: string | null;
    categoryId: number;
    locationId: number;
    quantity: number;
    status: "stored" | "claimed" | "disposed";
  }
): Promise<void> {
  await updateStoredItem(itemId, input);
}

export async function deleteStoredItemAsAdmin(itemId: number): Promise<void> {
  await deleteStoredItem(itemId);
}

export async function getTagsAsAdmin(keyword?: string) {
  const rows = await listTagsForAdmin(keyword);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    use_count: Number(row.use_count),
    is_prebuilt: row.is_prebuilt === 1 ? 1 : 0,
    is_frequent: row.is_frequent === 1 ? 1 : 0,
    last_used_at: row.last_used_at
  }));
}

export async function createTagAsAdmin(input: { name: string; isPrebuilt: boolean }): Promise<void> {
  const normalized = normalizeTagToken(input.name);
  if (!normalized) {
    throw new AppError(400, "Invalid tag format");
  }
  await createTagForAdmin({
    name: normalized,
    isPrebuilt: input.isPrebuilt
  });
}

export async function updateTagAsAdmin(
  tagId: number,
  input: { name: string; isPrebuilt: boolean }
): Promise<void> {
  const normalized = normalizeTagToken(input.name);
  if (!normalized) {
    throw new AppError(400, "Invalid tag format");
  }
  await updateTagForAdmin(tagId, {
    name: normalized,
    isPrebuilt: input.isPrebuilt
  });
}

export async function deleteTagAsAdmin(tagId: number): Promise<void> {
  await deleteTagForAdmin(tagId);
}
