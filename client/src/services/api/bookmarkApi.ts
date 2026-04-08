import { ApiEnvelope, BookmarkItem } from "../../types";
import { apiClient } from "./client";
import { buildCacheKey, clearCachedPrefix, getCachedValue, setCachedValue } from "../../utils/clientCache";

const BOOKMARK_CACHE_TTL_MS = 20_000;

export async function listBookmarksApi(): Promise<BookmarkItem[]> {
  const cacheKey = buildCacheKey("bookmarks:list");
  const cached = getCachedValue<BookmarkItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await apiClient.get<ApiEnvelope<BookmarkItem[]>>("/bookmarks");
  setCachedValue(cacheKey, data.data, BOOKMARK_CACHE_TTL_MS);
  return data.data;
}

export async function addBookmarkApi(postId: number): Promise<void> {
  await apiClient.post(`/bookmarks/${postId}`);
  clearCachedPrefix("bookmarks:");
}

export async function removeBookmarkApi(postId: number): Promise<void> {
  await apiClient.delete(`/bookmarks/${postId}`);
  clearCachedPrefix("bookmarks:");
}
