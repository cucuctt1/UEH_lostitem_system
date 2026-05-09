import { ApiEnvelope } from "../../types";
import { apiClient } from "./client";
import { clearCachedPrefix } from "../../utils/clientCache";

export interface AdminUserRow {
  id: number;
  email: string;
  full_name: string;
  role: "user" | "admin";
  is_locked: 0 | 1;
  must_change_password: 0 | 1;
  created_at: string | null;
}

export interface AdminReportRow {
  id: number;
  reporter_id: number;
  target_post_id: number | null;
  target_user_id: number | null;
  reason: string;
  details: string;
  status: "open" | "resolved";
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string | null;
  reporter_name?: string;
  target_user_name?: string | null;
  target_post_title?: string | null;
}

export interface AdminStoredItemRow {
  id: number;
  name: string;
  description: string | null;
  sender_name: string | null;
  sender_student_id: string | null;
  category_id: number;
  category_name?: string;
  location_id: number;
  location_name?: string;
  quantity: number;
  status: "stored" | "claimed" | "disposed";
  post_id: number | null;
  managed_by: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface AnalyticsSummaryRow {
  totals: {
    total_posts: number;
    total_returns: number;
    total_users: number;
  };
  returnSuccessRate: number;
  lostByLocation: Array<{ location_name: string; total: number }>;
  lostByHour: Array<{ hour_of_day: number; total: number }>;
}

export async function approvePostApi(postId: number, approved: boolean): Promise<void> {
  await apiClient.post("/admin/approve-post", { postId, approved });
  // Clear related caches so admin UI and feed update without a hard refresh
  clearCachedPrefix("posts:");
  clearCachedPrefix("matches:");
  clearCachedPrefix("notifications:");
}

export async function lockUserApi(userId: number, locked: boolean): Promise<void> {
  await apiClient.post("/admin/lock-user", { userId, locked });
}

export async function getUsersApi(): Promise<AdminUserRow[]> {
  const { data } = await apiClient.get<ApiEnvelope<AdminUserRow[]>>("/admin/users");
  return data.data;
}

export async function createUserByAdminApi(payload: {
  fullName: string;
  email: string;
  temporaryPassword: string;
}): Promise<{ userId: number; email: string }> {
  const { data } = await apiClient.post<ApiEnvelope<{ userId: number; email: string }>>(
    "/admin/users",
    payload
  );
  return data.data;
}

export async function getReportsApi(): Promise<AdminReportRow[]> {
  const { data } = await apiClient.get<ApiEnvelope<AdminReportRow[]>>("/admin/reports");
  return data.data;
}

export async function resolveReportApi(reportId: number): Promise<void> {
  await apiClient.patch(`/admin/reports/${reportId}/resolve`);
}

export async function getItemsApi(): Promise<AdminStoredItemRow[]> {
  const { data } = await apiClient.get<ApiEnvelope<AdminStoredItemRow[]>>("/admin/items");
  return data.data;
}

export async function createItemApi(payload: {
  name: string;
  description?: string;
  senderName?: string;
  senderStudentId?: string;
  categoryId: number;
  locationId: number;
  quantity: number;
  status: "stored" | "claimed" | "disposed";
  postId?: number;
}): Promise<void> {
  await apiClient.post("/admin/items", payload);
}

export async function updateItemStatusApi(
  itemId: number,
  status: "stored" | "claimed" | "disposed"
): Promise<void> {
  await apiClient.patch(`/admin/items/${itemId}/status`, { status });
}

export async function updateItemApi(
  itemId: number,
  payload: {
    name: string;
    description?: string;
    senderName?: string;
    senderStudentId?: string;
    categoryId: number;
    locationId: number;
    quantity: number;
    status: "stored" | "claimed" | "disposed";
  }
): Promise<void> {
  await apiClient.put(`/admin/items/${itemId}`, payload);
}

export async function deleteItemApi(itemId: number): Promise<void> {
  await apiClient.delete(`/admin/items/${itemId}`);
}

export async function getAnalyticsApi(): Promise<AnalyticsSummaryRow> {
  const { data } = await apiClient.get<ApiEnvelope<AnalyticsSummaryRow>>("/analytics");
  return data.data;
}
