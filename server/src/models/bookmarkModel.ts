import { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";

export interface BookmarkRecord extends RowDataPacket {
  id: number;
  user_id: number;
  post_id: number;
  created_at: string;
}

export async function addBookmark(userId: number, postId: number): Promise<void> {
  await dbPool.query<ResultSetHeader>(
    "INSERT IGNORE INTO bookmarks (user_id, post_id) VALUES (?, ?)",
    [userId, postId]
  );
}

export async function removeBookmark(userId: number, postId: number): Promise<void> {
  await dbPool.query<ResultSetHeader>(
    "DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?",
    [userId, postId]
  );
}

export async function listBookmarksByUser(userId: number): Promise<BookmarkRecord[]> {
  const [rows] = await dbPool.query<BookmarkRecord[]>(
    `SELECT b.*
     FROM bookmarks b
     JOIN posts p ON p.id = b.post_id
     WHERE b.user_id = ? AND p.is_deleted = 0
     ORDER BY b.created_at DESC`,
    [userId]
  );

  return rows;
}
