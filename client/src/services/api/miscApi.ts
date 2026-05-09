import {
  ApiEnvelope,
  Category,
  MyHistoryItem,
  Location,
  MatchItem,
  NotificationItem,
  TagRecommendation
} from "../../types";
import { apiClient } from "./client";
import { buildCacheKey, clearCachedPrefix, getCachedValue, setCachedValue } from "../../utils/clientCache";

const MATCH_CACHE_TTL_MS = 20_000;
const NOTIFICATION_CACHE_TTL_MS = 12_000;
const LOOKUP_CACHE_TTL_MS = 5 * 60_000;
const TAG_CACHE_TTL_MS = 60_000;
const HISTORY_CACHE_TTL_MS = 30_000;

export async function listMatchesApi(): Promise<MatchItem[]> {
  const cacheKey = buildCacheKey("matches:list");
  const cached = getCachedValue<MatchItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await apiClient.get<ApiEnvelope<MatchItem[]>>("/matches");
  setCachedValue(cacheKey, data.data, MATCH_CACHE_TTL_MS);
  return data.data;
}

export async function verifyMatchApi(matchId: number, status: "accepted" | "rejected"): Promise<void> {
  await apiClient.post(`/matches/${matchId}/verify`, { status });
  clearCachedPrefix("matches:");
  clearCachedPrefix("notifications:");
}

export async function listNotificationsApi(): Promise<NotificationItem[]> {
  const cacheKey = buildCacheKey("notifications:list");
  const cached = getCachedValue<NotificationItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await apiClient.get<ApiEnvelope<NotificationItem[]>>("/notifications");
  setCachedValue(cacheKey, data.data, NOTIFICATION_CACHE_TTL_MS);
  return data.data;
}

export async function readNotificationApi(notificationId: number): Promise<void> {
  await apiClient.patch(`/notifications/${notificationId}/read`);
  clearCachedPrefix("notifications:");
}

export async function listCategoriesApi(): Promise<Category[]> {
  const cacheKey = buildCacheKey("lookup:categories");
  const cached = getCachedValue<Category[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await apiClient.get<ApiEnvelope<Category[]>>("/lookup/categories");
  setCachedValue(cacheKey, data.data, LOOKUP_CACHE_TTL_MS);
  return data.data;
}

export async function listLocationsApi(): Promise<Location[]> {
  const cacheKey = buildCacheKey("lookup:locations");
  const cached = getCachedValue<Location[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await apiClient.get<ApiEnvelope<Location[]>>("/lookup/locations");
  setCachedValue(cacheKey, data.data, LOOKUP_CACHE_TTL_MS);
  return data.data;
}

export async function listTagRecommendationsApi(keyword?: string, limit = 20): Promise<TagRecommendation[]> {
  const cacheKey = buildCacheKey("lookup:tags", { keyword, limit });
  const cached = getCachedValue<TagRecommendation[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await apiClient.get<ApiEnvelope<TagRecommendation[]>>(
    "/lookup/tags/recommendations",
    { params: { keyword, limit } }
  );

  setCachedValue(cacheKey, data.data, TAG_CACHE_TTL_MS);
  return data.data;
}

export async function getMyHistoryApi(): Promise<MyHistoryItem> {
  const cacheKey = buildCacheKey("my-history");
  const cached = getCachedValue<MyHistoryItem>(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await apiClient.get<ApiEnvelope<MyHistoryItem>>("/users/me/history");
  setCachedValue(cacheKey, data.data, HISTORY_CACHE_TTL_MS);
  return data.data;
}

export function clearMyHistoryCache(): void {
  clearCachedPrefix("my-history");
}

export async function createReportApi(payload: {
  targetPostId?: number;
  targetUserId?: number;
  reason: "spam" | "fraud" | "abuse" | "unsafe" | "other";
  details: string;
}): Promise<void> {
  await apiClient.post("/reports", payload);
}
