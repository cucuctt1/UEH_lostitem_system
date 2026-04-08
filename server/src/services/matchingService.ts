import { env } from "../config/env";
import { listOppositeTypeApprovedPosts, getPostById } from "../models/postModel";
import { upsertMatch } from "../models/matchModel";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function keywordSimilarity(a: string, b: string): number {
  const aTokens = new Set(tokenize(a));
  const bTokens = new Set(tokenize(b));
  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0;
  }

  let intersection = 0;
  aTokens.forEach((token) => {
    if (bTokens.has(token)) {
      intersection += 1;
    }
  });

  const union = new Set([...aTokens, ...bTokens]).size;
  return intersection / union;
}

function tagMatch(tagsA: string[], tagsB: string[]): number {
  if (tagsA.length === 0 || tagsB.length === 0) {
    return 0;
  }

  const setA = new Set(tagsA.map((tag) => tag.toLowerCase()));
  const setB = new Set(tagsB.map((tag) => tag.toLowerCase()));
  let common = 0;
  setA.forEach((tag) => {
    if (setB.has(tag)) {
      common += 1;
    }
  });
  return common / Math.max(setA.size, setB.size);
}

function locationMatch(locationA: number, locationB: number): number {
  return locationA === locationB ? 1 : 0;
}

function timeProximity(aTime: string, bTime: string): number {
  const aMs = new Date(aTime).getTime();
  const bMs = new Date(bTime).getTime();
  const hours = Math.abs(aMs - bMs) / (1000 * 60 * 60);
  const week = 24 * 7;
  return Math.max(0, 1 - hours / week);
}

interface ScoreDetail {
  keyword_similarity: number;
  tag_match: number;
  location_match: number;
  time_proximity: number;
  score: number;
}

function safeParseTags(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed) ? parsed.map((tag) => String(tag)) : [];
  } catch {
    return [];
  }
}

export async function recalculateMatchesForPost(postId: number): Promise<ScoreDetail[]> {
  const source = await getPostById(postId);
  if (!source || source.moderation_status !== "approved") {
    return [];
  }

  const candidates = await listOppositeTypeApprovedPosts(postId);
  const sourceTags = safeParseTags(source.tags_json);
  const scored: ScoreDetail[] = [];

  for (const candidate of candidates) {
    const candidateTags = safeParseTags(candidate.tags_json);

    const keyword = keywordSimilarity(
      `${source.title} ${source.description}`,
      `${candidate.title} ${candidate.description}`
    );
    const tag = tagMatch(sourceTags, candidateTags);
    const location = locationMatch(source.location_id, candidate.location_id);
    const time = timeProximity(source.event_time, candidate.event_time);

    const score = Number((keyword + tag + location + time).toFixed(4));

    const lostPostId = source.type === "lost" ? source.id : candidate.id;
    const foundPostId = source.type === "found" ? source.id : candidate.id;

    await upsertMatch(
      lostPostId,
      foundPostId,
      score,
      JSON.stringify({
        keyword_similarity: keyword,
        tag_match: tag,
        location_match: location,
        time_proximity: time,
        score
      })
    );

    scored.push({
      keyword_similarity: keyword,
      tag_match: tag,
      location_match: location,
      time_proximity: time,
      score
    });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, env.matchTopK);
}
