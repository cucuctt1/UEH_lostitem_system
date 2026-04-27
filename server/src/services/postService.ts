import {
  createPost,
  CreatePostInput,
  getPostById,
  listRecommendationCandidates,
  listPosts,
  listUserPreferencePosts,
  PostListFilters,
  softDeletePost,
  updatePost,
  UpdatePostInput
} from "../models/postModel";
import { AppError } from "../utils/http";
import { recalculateMatchesForPost } from "./matchingService";
import { Post } from "../domain/entities";
import { parseTagsInput } from "../utils/tags";
import { getTagUseCountMap, syncTagMetadata } from "./tagService";
import { env } from "../config/env";

export function sanitizePost(row: any) {
  return Post.fromDb(row).toApiView();
}

function parseTags(tagsJson: string | null | undefined): string[] {
  return parseTagsInput(tagsJson);
}

function increaseCounter<K extends string | number>(map: Map<K, number>, key: K, value = 1): void {
  map.set(key, (map.get(key) ?? 0) + value);
}

function getMaxCounterValue<K extends string | number>(map: Map<K, number>): number {
  return Math.max(1, ...Array.from(map.values()));
}

function buildRecommendationReason(input: {
  categoryAffinity: number;
  locationAffinity: number;
  tagAffinity: number;
  popularTagBoost: number;
  oppositeTypeBoost: number;
  recencyBonus: number;
}): string {
  const reasons: string[] = [];

  if (input.categoryAffinity >= 0.8) {
    reasons.push("cung danh muc voi bai dang gan day cua ban");
  }
  if (input.locationAffinity >= 0.8) {
    reasons.push("cung khu vuc ban thuong xuyen hoat dong");
  }
  if (input.tagAffinity >= 0.35) {
    reasons.push("the mo ta trung khop");
  }
  if (input.popularTagBoost >= 0.55) {
    reasons.push("co the pho bien trong cong dong");
  }
  if (input.oppositeTypeBoost >= 0.95) {
    reasons.push("bo sung cho nhu cau that lac/nhat duoc cua ban");
  }
  if (reasons.length === 0 && input.recencyBonus >= 0.65) {
    reasons.push("moi dang gan day");
  }
  if (reasons.length === 0) {
    reasons.push("do phu hop can bang voi hanh vi cua ban");
  }

  return `Goi y: ${reasons.slice(0, 2).join(" + ")}`;
}

export async function createPostWorkflow(input: CreatePostInput): Promise<number> {
  const postId = await createPost(input);
  await syncTagMetadata();
  return postId;
}

export async function listPostWorkflow(filters: PostListFilters, _requesterId?: number, requesterRole?: string) {
  const rows = await listPosts({
    ...filters,
    onlyApproved: requesterRole === "admin" ? false : true
  });

  return rows
    .filter((row) => {
      if (requesterRole === "admin") {
        return true;
      }

      return row.moderation_status === "approved";
    })
    .map(sanitizePost);
}

export async function getPostWorkflow(postId: number, requesterId?: number, requesterRole?: string) {
  const post = await getPostById(postId);
  if (!post) {
    throw new AppError(404, "Post not found");
  }

  if (requesterRole !== "admin" && post.moderation_status !== "approved" && post.user_id !== requesterId) {
    throw new AppError(403, "Post is not visible");
  }

  return sanitizePost(post);
}

export async function updatePostWorkflow(
  postId: number,
  payload: UpdatePostInput,
  requesterId: number,
  requesterRole: string
): Promise<void> {
  const existing = await getPostById(postId);
  if (!existing) {
    throw new AppError(404, "Post not found");
  }

  if (requesterRole !== "admin" && existing.user_id !== requesterId) {
    throw new AppError(403, "You can only edit your own post");
  }

  await updatePost(postId, payload);
  await syncTagMetadata();

  const updated = await getPostById(postId);
  if (updated?.moderation_status === "approved") {
    await recalculateMatchesForPost(postId);
  }
}

export async function deletePostWorkflow(postId: number, requesterId: number, requesterRole: string): Promise<void> {
  const existing = await getPostById(postId);
  if (!existing) {
    throw new AppError(404, "Post not found");
  }

  if (requesterRole !== "admin" && existing.user_id !== requesterId) {
    throw new AppError(403, "You can only delete your own post");
  }

  await softDeletePost(postId);
  await syncTagMetadata();
}

export async function listRecommendedPostsWorkflow(userId: number, limit = 8) {
  const safeLimit = Math.max(3, Math.min(24, Math.floor(limit)));

  const [preferenceRows, candidateRows] = await Promise.all([
    listUserPreferencePosts(userId, 40),
    listRecommendationCandidates(userId, 160)
  ]);

  if (candidateRows.length === 0) {
    return [];
  }

  const categoryCounts = new Map<number, number>();
  const locationCounts = new Map<number, number>();
  const tagCounts = new Map<string, number>();

  let lostCount = 0;
  let foundCount = 0;

  for (const row of preferenceRows) {
    increaseCounter(categoryCounts, Number(row.category_id));
    increaseCounter(locationCounts, Number(row.location_id));

    const tags = parseTags(row.tags_json);
    for (const tag of tags) {
      increaseCounter(tagCounts, tag);
    }

    if (row.type === "lost") {
      lostCount += 1;
    }
    if (row.type === "found") {
      foundCount += 1;
    }
  }

  const dominantType =
    lostCount === foundCount ? null : lostCount > foundCount ? "lost" : "found";
  const oppositePreferredType = dominantType
    ? dominantType === "lost"
      ? "found"
      : "lost"
    : null;

  const maxCategoryCount = getMaxCounterValue(categoryCounts);
  const maxLocationCount = getMaxCounterValue(locationCounts);

  const topTagEntries = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const topTagTotalWeight = topTagEntries.reduce((total, [, weight]) => total + weight, 0);
  const topTagWeightMap = new Map(topTagEntries);

  const candidateTagUniverse = new Set<string>();
  for (const row of candidateRows) {
    for (const candidateTag of parseTags(row.tags_json)) {
      candidateTagUniverse.add(candidateTag);
    }
  }

  const tagUsageMap = await getTagUseCountMap(Array.from(candidateTagUniverse));
  const maxTagUsage = Math.max(1, ...Array.from(tagUsageMap.values()));

  const nowMs = Date.now();

  const scoredRows = candidateRows.map((row) => {
    const categoryAffinity = (categoryCounts.get(Number(row.category_id)) ?? 0) / maxCategoryCount;
    const locationAffinity = (locationCounts.get(Number(row.location_id)) ?? 0) / maxLocationCount;

    const candidateTags = parseTags(row.tags_json);
    const matchedTagWeight = candidateTags.reduce((total, tag) => {
      return total + (topTagWeightMap.get(tag) ?? 0);
    }, 0);
    const tagAffinity = topTagTotalWeight > 0 ? matchedTagWeight / topTagTotalWeight : 0;

    const popularityTotal = candidateTags.reduce((total, tag) => {
      return total + ((tagUsageMap.get(tag) ?? 0) / maxTagUsage);
    }, 0);
    const popularTagBoost = candidateTags.length > 0 ? popularityTotal / candidateTags.length : 0;
    const frequentTagBonus = candidateTags.some(
      (tag) => (tagUsageMap.get(tag) ?? 0) >= Math.max(1, env.tagFrequentThreshold)
    )
      ? 1
      : 0;

    const oppositeTypeBoost = oppositePreferredType
      ? row.type === oppositePreferredType
        ? 1
        : 0.2
      : 0.55;

    const createdMs = new Date(row.created_at).getTime();
    const ageHours = Number.isFinite(createdMs)
      ? Math.max(0, (nowMs - createdMs) / (1000 * 60 * 60))
      : 24 * 14;
    const recencyBonus = Math.max(0, 1 - ageHours / (24 * 14));

    const score =
      categoryAffinity * 0.24 +
      locationAffinity * 0.18 +
      tagAffinity * 0.24 +
      popularTagBoost * 0.1 +
      frequentTagBonus * 0.06 +
      oppositeTypeBoost * 0.14 +
      recencyBonus * 0.14;

    const reason = buildRecommendationReason({
      categoryAffinity,
      locationAffinity,
      tagAffinity,
      popularTagBoost,
      oppositeTypeBoost,
      recencyBonus
    });

    return {
      row,
      score,
      reason
    };
  });

  return scoredRows
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit)
    .map((entry) =>
      Post.fromDb(entry.row).toRecommendationView(Number(entry.score.toFixed(3)), entry.reason)
    );
}
