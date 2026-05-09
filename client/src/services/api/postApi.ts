import { ApiEnvelope, PostCommentItem, PostItem } from "../../types";
import { apiClient } from "./client";
import { buildCacheKey, clearCachedPrefix, clearCachedValue, getCachedValue, setCachedValue } from "../../utils/clientCache";

const SEARCH_CACHE_TTL_MS = 20_000;
const RECOMMEND_CACHE_TTL_MS = 35_000;
const POST_DETAIL_CACHE_TTL_MS = 25_000;
const POST_COMMENTS_CACHE_TTL_MS = 10_000;

function clearPostRelatedCaches(postId?: number): void {
  clearCachedPrefix("posts:");
  clearCachedPrefix("recommended:");
  clearCachedPrefix("my-history");
  if (typeof postId === "number") {
    clearCachedValue(buildCacheKey("post:detail", { postId }));
    clearCachedValue(buildCacheKey("post:comments", { postId }));
  }
}

export interface PostFilters {
  keyword?: string;
  tag?: string;
  locationId?: number;
  from?: string;
  to?: string;
  sort?: "newest" | "relevance";
  type?: "lost" | "found";
}

export async function listPostsApi(filters: PostFilters = {}): Promise<PostItem[]> {
  const cacheKey = buildCacheKey("posts:list", filters as Record<string, unknown>);
  const cached = getCachedValue<PostItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await apiClient.get<ApiEnvelope<PostItem[]>>("/posts", { params: filters });
  setCachedValue(cacheKey, data.data, SEARCH_CACHE_TTL_MS);
  return data.data;
}

export async function getPostApi(postId: number): Promise<PostItem> {
  const cacheKey = buildCacheKey("post:detail", { postId });
  const cached = getCachedValue<PostItem>(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await apiClient.get<ApiEnvelope<PostItem>>(`/posts/${postId}`);
  setCachedValue(cacheKey, data.data, POST_DETAIL_CACHE_TTL_MS);
  return data.data;
}

export async function createPostApi(formData: FormData): Promise<{ postId: number }> {
  const { data } = await apiClient.post<ApiEnvelope<{ postId: number }>>("/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  clearPostRelatedCaches();
  return data.data;
}

export async function updatePostApi(postId: number, formData: FormData): Promise<void> {
  await apiClient.put(`/posts/${postId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  clearPostRelatedCaches(postId);
}

export async function deletePostApi(postId: number): Promise<void> {
  await apiClient.delete(`/posts/${postId}`);
  clearPostRelatedCaches(postId);
}

export async function searchPostsApi(filters: PostFilters): Promise<PostItem[]> {
  const cacheKey = buildCacheKey("posts:search", filters as Record<string, unknown>);
  const cached = getCachedValue<PostItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await apiClient.get<ApiEnvelope<PostItem[]>>("/search", { params: filters });
  setCachedValue(cacheKey, data.data, SEARCH_CACHE_TTL_MS);
  return data.data;
}

export async function getRecommendedPostsApi(limit = 8): Promise<PostItem[]> {
  const cacheKey = buildCacheKey("recommended:posts", { limit });
  const cached = getCachedValue<PostItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await apiClient.get<ApiEnvelope<PostItem[]>>("/posts/recommendations", {
    params: { limit }
  });

  setCachedValue(cacheKey, data.data, RECOMMEND_CACHE_TTL_MS);
  return data.data;
}

export async function listPostCommentsApi(postId: number): Promise<PostCommentItem[]> {
  const cacheKey = buildCacheKey("post:comments", { postId });
  const cached = getCachedValue<PostCommentItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await apiClient.get<ApiEnvelope<PostCommentItem[]>>(`/posts/${postId}/comments`);
  setCachedValue(cacheKey, data.data, POST_COMMENTS_CACHE_TTL_MS);
  return data.data;
}

export async function createPostCommentApi(postId: number, content: string): Promise<void> {
  await apiClient.post(`/posts/${postId}/comments`, { content });
  clearCachedValue(buildCacheKey("post:comments", { postId }));
}

export async function requestPostBypassApi(postId: number, imageFile?: File): Promise<void> {
  const formData = new FormData();
  if (imageFile) {
    formData.append("image", imageFile);
  }

  await apiClient.post(`/posts/${postId}/request-bypass`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  clearPostRelatedCaches(postId);
}
