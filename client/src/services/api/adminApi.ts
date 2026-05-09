import { ApiEnvelope } from "../../types";
import { apiClient } from "./client";
import { clearCachedPrefix } from "../../utils/clientCache";

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

export async function getUsersApi(): Promise<any[]> {
  const { data } = await apiClient.get<ApiEnvelope<any[]>>("/admin/users");
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

export async function getReportsApi(): Promise<any[]> {
  const { data } = await apiClient.get<ApiEnvelope<any[]>>("/admin/reports");
  return data.data;
}

export async function getItemsApi(): Promise<any[]> {
  const { data } = await apiClient.get<ApiEnvelope<any[]>>("/admin/items");
  return data.data;
}

export async function createItemApi(payload: {
  name: string;
  description: string;
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

export async function getAnalyticsApi(): Promise<any> {
  const { data } = await apiClient.get<ApiEnvelope<any>>("/analytics");
  return data.data;
}
