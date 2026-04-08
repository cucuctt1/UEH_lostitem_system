import { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { ModerationStatus, PostStatus, PostType } from "../types";
import { normalizeTagFilter } from "../utils/tags";

export interface PostRecord extends RowDataPacket {
  id: number;
  user_id: number;
  type: PostType;
  title: string;
  description: string;
  category_id: number;
  location_id: number;
  event_time: string;
  tags_json: string;
  image_url: string | null;
  image_urls_json: string | null;
  status: PostStatus;
  moderation_status: ModerationStatus;
  contact_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostListFilters {
  keyword?: string;
  tag?: string;
  locationId?: number;
  from?: string;
  to?: string;
  sort?: "newest" | "relevance";
  type?: PostType;
  onlyApproved?: boolean;
}

export interface CreatePostInput {
  userId: number;
  type: PostType;
  title: string;
  description: string;
  categoryId: number;
  locationId: number;
  eventTime: string;
  tags: string[];
  contactNote?: string;
  imageUrl?: string;
  imageUrls?: string[];
  status?: PostStatus;
}

export async function createPost(input: CreatePostInput): Promise<number> {
  const normalizedImageUrls =
    Array.isArray(input.imageUrls) && input.imageUrls.length > 0
      ? input.imageUrls
      : input.imageUrl
        ? [input.imageUrl]
        : [];

  const [result] = await dbPool.query<ResultSetHeader>(
    `INSERT INTO posts (
      user_id, type, title, description, category_id, location_id,
      event_time, tags_json, contact_note, image_url, image_urls_json, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.type,
      input.title,
      input.description,
      input.categoryId,
      input.locationId,
      input.eventTime,
      JSON.stringify(input.tags),
      input.contactNote ?? null,
      normalizedImageUrls[0] ?? input.imageUrl ?? null,
      normalizedImageUrls.length > 0 ? JSON.stringify(normalizedImageUrls) : null,
      input.status ?? "searching"
    ]
  );

  return result.insertId;
}

export async function getPostById(id: number): Promise<PostRecord | null> {
  const [rows] = await dbPool.query<PostRecord[]>(
    "SELECT * FROM posts WHERE id = ? AND is_deleted = 0 LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

export async function getPostOwner(postId: number): Promise<number | null> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    "SELECT user_id FROM posts WHERE id = ? LIMIT 1",
    [postId]
  );
  return rows[0]?.user_id ?? null;
}

export async function listPosts(filters: PostListFilters): Promise<RowDataPacket[]> {
  const where: string[] = ["p.is_deleted = 0"];
  const values: unknown[] = [];

  if (filters.onlyApproved) {
    where.push("p.moderation_status = 'approved'");
  }
  if (filters.keyword) {
    where.push("(p.title LIKE ? OR p.description LIKE ?)");
    values.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }
  const normalizedTag = normalizeTagFilter(filters.tag);
  if (normalizedTag) {
    where.push("JSON_SEARCH(p.tags_json, 'one', ?) IS NOT NULL");
    values.push(normalizedTag);
  }
  if (filters.locationId) {
    where.push("p.location_id = ?");
    values.push(filters.locationId);
  }
  if (filters.from) {
    where.push("p.event_time >= ?");
    values.push(filters.from);
  }
  if (filters.to) {
    where.push("p.event_time <= ?");
    values.push(filters.to);
  }
  if (filters.type) {
    where.push("p.type = ?");
    values.push(filters.type);
  }

  const orderBy =
    filters.sort === "relevance" && filters.keyword
      ? "ORDER BY (CASE WHEN p.title LIKE ? THEN 2 ELSE 0 END + CASE WHEN p.description LIKE ? THEN 1 ELSE 0 END) DESC, p.created_at DESC"
      : "ORDER BY p.created_at DESC";

  if (filters.sort === "relevance" && filters.keyword) {
    values.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT p.*, u.full_name, u.avatar_url, c.name AS category_name, l.name AS location_name
     FROM posts p
     JOIN users u ON u.id = p.user_id
     JOIN categories c ON c.id = p.category_id
     JOIN locations l ON l.id = p.location_id
     WHERE ${where.join(" AND ")}
     ${orderBy}`,
    values
  );

  return rows;
}

export interface UpdatePostInput {
  title?: string;
  description?: string;
  categoryId?: number;
  locationId?: number;
  eventTime?: string;
  tags?: string[];
  status?: PostStatus;
  contactNote?: string;
  imageUrl?: string;
  imageUrls?: string[];
}

export async function updatePost(postId: number, payload: UpdatePostInput): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (typeof payload.title === "string") {
    fields.push("title = ?");
    values.push(payload.title);
  }
  if (typeof payload.description === "string") {
    fields.push("description = ?");
    values.push(payload.description);
  }
  if (typeof payload.categoryId === "number") {
    fields.push("category_id = ?");
    values.push(payload.categoryId);
  }
  if (typeof payload.locationId === "number") {
    fields.push("location_id = ?");
    values.push(payload.locationId);
  }
  if (typeof payload.eventTime === "string") {
    fields.push("event_time = ?");
    values.push(payload.eventTime);
  }
  if (Array.isArray(payload.tags)) {
    fields.push("tags_json = ?");
    values.push(JSON.stringify(payload.tags));
  }
  if (typeof payload.status === "string") {
    fields.push("status = ?");
    values.push(payload.status);
  }
  if (typeof payload.contactNote === "string") {
    fields.push("contact_note = ?");
    values.push(payload.contactNote);
  }
  if (typeof payload.imageUrl === "string") {
    fields.push("image_url = ?");
    values.push(payload.imageUrl);
    fields.push("image_urls_json = ?");
    values.push(JSON.stringify([payload.imageUrl]));
  }
  if (Array.isArray(payload.imageUrls) && payload.imageUrls.length > 0) {
    fields.push("image_url = ?");
    values.push(payload.imageUrls[0]);
    fields.push("image_urls_json = ?");
    values.push(JSON.stringify(payload.imageUrls));
  }

  if (fields.length === 0) {
    return;
  }

  values.push(postId);

  await dbPool.query(
    `UPDATE posts SET ${fields.join(", ")}, moderation_status = 'pending' WHERE id = ?`,
    values
  );
}

export async function softDeletePost(postId: number): Promise<void> {
  await dbPool.query("UPDATE posts SET is_deleted = 1 WHERE id = ?", [postId]);
}

export async function setPostStatus(postId: number, status: PostStatus): Promise<void> {
  await dbPool.query(
    "UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, postId]
  );
}

export async function setModerationStatus(
  postId: number,
  moderationStatus: ModerationStatus,
  approvedBy: number
): Promise<void> {
  await dbPool.query(
    "UPDATE posts SET moderation_status = ?, approved_by = ? WHERE id = ?",
    [moderationStatus, approvedBy, postId]
  );
}

export async function listOppositeTypeApprovedPosts(postId: number): Promise<RowDataPacket[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT other.*
     FROM posts source
     JOIN posts other ON other.type <> source.type
     WHERE source.id = ?
       AND other.id <> source.id
       AND other.moderation_status = 'approved'
       AND other.is_deleted = 0`,
    [postId]
  );

  return rows;
}

export async function listUserPreferencePosts(
  userId: number,
  limit = 30
): Promise<RowDataPacket[]> {
  const safeLimit = Math.max(5, Math.min(80, Math.floor(limit)));

  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT p.*, u.full_name, u.avatar_url, c.name AS category_name, l.name AS location_name
     FROM posts p
     JOIN users u ON u.id = p.user_id
     JOIN categories c ON c.id = p.category_id
     JOIN locations l ON l.id = p.location_id
     WHERE p.user_id = ?
       AND p.is_deleted = 0
     ORDER BY p.created_at DESC
     LIMIT ?`,
    [userId, safeLimit]
  );

  return rows;
}

export async function listRecommendationCandidates(
  userId: number,
  limit = 120
): Promise<RowDataPacket[]> {
  const safeLimit = Math.max(20, Math.min(300, Math.floor(limit)));

  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT p.*, u.full_name, u.avatar_url, c.name AS category_name, l.name AS location_name
     FROM posts p
     JOIN users u ON u.id = p.user_id
     JOIN categories c ON c.id = p.category_id
     JOIN locations l ON l.id = p.location_id
     WHERE p.user_id <> ?
       AND p.moderation_status = 'approved'
       AND p.is_deleted = 0
     ORDER BY p.created_at DESC
     LIMIT ?`,
    [userId, safeLimit]
  );

  return rows;
}
