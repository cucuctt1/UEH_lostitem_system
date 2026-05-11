import { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { parseTagsInput } from "../utils/tags";

export interface TagRow extends RowDataPacket {
  id: number;
  name: string;
  use_count: number;
  is_prebuilt: number;
  is_frequent: number;
  last_used_at: string | null;
}

export async function upsertPrebuiltTags(tags: string[]): Promise<void> {
  if (tags.length === 0) {
    return;
  }

  const uniqueTags = Array.from(new Set(tags));
  const placeholders = uniqueTags.map(() => "(?, 1)").join(", ");
  await dbPool.query(
    `INSERT INTO tags (name, is_prebuilt)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE is_prebuilt = 1`,
    uniqueTags
  );
}

export async function recalculateTagUsageFromPosts(input: {
  frequentThreshold: number;
  minUsageToKeep: number;
}): Promise<void> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    "SELECT tags_json FROM posts WHERE is_deleted = 0"
  );

  const tagCounter = new Map<string, number>();
  for (const row of rows) {
    const tags = parseTagsInput(row.tags_json);
    const uniqueTags = new Set(tags);
    for (const tag of uniqueTags) {
      tagCounter.set(tag, (tagCounter.get(tag) ?? 0) + 1);
    }
  }

  await dbPool.query("UPDATE tags SET use_count = 0, is_frequent = 0, last_used_at = NULL");

  const entries = Array.from(tagCounter.entries());
  if (entries.length > 0) {
    const placeholders = entries.map(() => "(?, ?, ?, CURRENT_TIMESTAMP)").join(", ");
    const values: Array<string | number> = [];
    for (const [name, count] of entries) {
      values.push(name, count, count >= input.frequentThreshold ? 1 : 0);
    }

    await dbPool.query(
      `INSERT INTO tags (name, use_count, is_frequent, last_used_at)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE
         use_count = VALUES(use_count),
         is_frequent = VALUES(is_frequent),
         last_used_at = VALUES(last_used_at)`,
      values
    );
  }

  await dbPool.query(
    "DELETE FROM tags WHERE is_prebuilt = 0 AND use_count < ?",
    [Math.max(0, input.minUsageToKeep)]
  );
}

export async function listTagRecommendations(keyword?: string, limit = 20): Promise<TagRow[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));

  if (keyword) {
    const likeKeyword = `%${keyword.toLowerCase()}%`;
    const [rows] = await dbPool.query<TagRow[]>(
      `SELECT *
       FROM tags
       WHERE name LIKE ?
       ORDER BY is_frequent DESC, is_prebuilt DESC, use_count DESC, name ASC
       LIMIT ?`,
      [likeKeyword, safeLimit]
    );
    return rows;
  }

  const [rows] = await dbPool.query<TagRow[]>(
    `SELECT *
     FROM tags
     ORDER BY is_frequent DESC, is_prebuilt DESC, use_count DESC, name ASC
     LIMIT ?`,
    [safeLimit]
  );

  return rows;
}

export async function listTagUsageRows(tagNames: string[]): Promise<TagRow[]> {
  const uniqueTags = Array.from(new Set(tagNames));
  if (uniqueTags.length === 0) {
    return [];
  }

  const placeholders = uniqueTags.map(() => "?").join(", ");
  const [rows] = await dbPool.query<TagRow[]>(
    `SELECT * FROM tags WHERE name IN (${placeholders})`,
    uniqueTags
  );

  return rows;
}

export async function listTagsForAdmin(keyword?: string, limit = 200): Promise<TagRow[]> {
  const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
  if (keyword) {
    const likeKeyword = `%${keyword.toLowerCase()}%`;
    const [rows] = await dbPool.query<TagRow[]>(
      `SELECT *
       FROM tags
       WHERE name LIKE ?
       ORDER BY use_count DESC, is_prebuilt DESC, name ASC
       LIMIT ?`,
      [likeKeyword, safeLimit]
    );
    return rows;
  }

  const [rows] = await dbPool.query<TagRow[]>(
    `SELECT *
     FROM tags
     ORDER BY use_count DESC, is_prebuilt DESC, name ASC
     LIMIT ?`,
    [safeLimit]
  );
  return rows;
}

export async function createTagForAdmin(input: {
  name: string;
  isPrebuilt: boolean;
}): Promise<void> {
  await dbPool.query(
    `INSERT INTO tags (name, use_count, is_prebuilt, is_frequent, last_used_at)
     VALUES (?, 0, ?, 0, NULL)`,
    [input.name, input.isPrebuilt ? 1 : 0]
  );
}

export async function updateTagForAdmin(
  tagId: number,
  input: {
    name: string;
    isPrebuilt: boolean;
  }
): Promise<void> {
  await dbPool.query(
    `UPDATE tags
     SET name = ?, is_prebuilt = ?
     WHERE id = ?`,
    [input.name, input.isPrebuilt ? 1 : 0, tagId]
  );
}

export async function deleteTagForAdmin(tagId: number): Promise<void> {
  await dbPool.query("DELETE FROM tags WHERE id = ?", [tagId]);
}
