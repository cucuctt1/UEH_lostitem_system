import { PREBUILT_TAGS } from "../config/tags";
import { env } from "../config/env";
import {
  listTagRecommendations,
  listTagUsageRows,
  recalculateTagUsageFromPosts,
  upsertPrebuiltTags
} from "../models/tagModel";
import { normalizeTagFilter } from "../utils/tags";

let maintenanceTimer: NodeJS.Timeout | null = null;

export async function syncTagMetadata(): Promise<void> {
  await upsertPrebuiltTags(PREBUILT_TAGS);
  await recalculateTagUsageFromPosts({
    frequentThreshold: Math.max(1, env.tagFrequentThreshold),
    minUsageToKeep: Math.max(0, env.tagMinUsageToKeep)
  });
}

export function startTagMaintenanceJob(): void {
  if (maintenanceTimer) {
    return;
  }

  const intervalMs = Math.max(5, env.tagCleanupIntervalMinutes) * 60_000;
  maintenanceTimer = setInterval(() => {
    void syncTagMetadata().catch((error) => {
      console.error("Tag maintenance failed", error);
    });
  }, intervalMs);
}

export async function getTagRecommendationList(keyword?: string, limit = 20) {
  const normalizedKeyword = normalizeTagFilter(keyword);
  const rows = await listTagRecommendations(normalizedKeyword, limit);

  return rows.map((row) => ({
    id: row.id,
    tag: `#${row.name}`,
    name: row.name,
    useCount: row.use_count,
    isFrequent: row.is_frequent === 1,
    isPrebuilt: row.is_prebuilt === 1
  }));
}

export async function getTagUseCountMap(tagNames: string[]): Promise<Map<string, number>> {
  const normalizedTags = tagNames
    .map((tag) => normalizeTagFilter(tag))
    .filter((tag): tag is string => Boolean(tag));

  const rows = await listTagUsageRows(normalizedTags);
  const usageMap = new Map<string, number>();

  for (const row of rows) {
    usageMap.set(row.name, Number(row.use_count));
  }

  return usageMap;
}
