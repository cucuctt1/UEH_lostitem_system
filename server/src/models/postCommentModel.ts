import { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";

export interface PostCommentRow extends RowDataPacket {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
  full_name: string;
  avatar_url: string | null;
}

export async function listPostComments(postId: number): Promise<PostCommentRow[]> {
  const [rows] = await dbPool.query<PostCommentRow[]>(
    `SELECT pc.*, u.full_name, u.avatar_url
     FROM post_comments pc
     JOIN users u ON u.id = pc.user_id
     WHERE pc.post_id = ?
     ORDER BY pc.created_at ASC`,
    [postId]
  );

  return rows;
}

export async function createPostComment(postId: number, userId: number, content: string): Promise<number> {
  const [result] = await dbPool.query<ResultSetHeader>(
    "INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)",
    [postId, userId, content]
  );

  return result.insertId;
}
