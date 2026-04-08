import { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";

export interface ConversationRecord extends RowDataPacket {
  id: number;
  post_id: number;
  user_one_id: number;
  user_two_id: number;
}

function normalizeUsers(userA: number, userB: number): [number, number] {
  return userA < userB ? [userA, userB] : [userB, userA];
}

export async function findConversationById(conversationId: number): Promise<ConversationRecord | null> {
  const [rows] = await dbPool.query<ConversationRecord[]>(
    "SELECT * FROM conversations WHERE id = ? LIMIT 1",
    [conversationId]
  );
  return rows[0] ?? null;
}

export async function findOrCreateConversation(
  postId: number,
  userA: number,
  userB: number
): Promise<number> {
  const [first, second] = normalizeUsers(userA, userB);

  const [rows] = await dbPool.query<ConversationRecord[]>(
    `SELECT * FROM conversations
     WHERE post_id = ? AND user_one_id = ? AND user_two_id = ?
     LIMIT 1`,
    [postId, first, second]
  );

  if (rows[0]) {
    return rows[0].id;
  }

  const [result] = await dbPool.query<ResultSetHeader>(
    "INSERT INTO conversations (post_id, user_one_id, user_two_id) VALUES (?, ?, ?)",
    [postId, first, second]
  );

  return result.insertId;
}

export async function listMessages(conversationId: number): Promise<RowDataPacket[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT m.*, u.full_name AS sender_name
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC`,
    [conversationId]
  );
  return rows;
}

export async function createMessage(
  conversationId: number,
  senderId: number,
  text: string | null,
  imageUrl: string | null
): Promise<number> {
  const [result] = await dbPool.query<ResultSetHeader>(
    "INSERT INTO messages (conversation_id, sender_id, text, image_url) VALUES (?, ?, ?, ?)",
    [conversationId, senderId, text, imageUrl]
  );

  await dbPool.query(
    "UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?",
    [conversationId]
  );

  return result.insertId;
}

export async function listConversationsForUser(userId: number): Promise<RowDataPacket[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT c.*, p.title AS post_title,
            u1.full_name AS user_one_name, u2.full_name AS user_two_name
     FROM conversations c
     JOIN posts p ON p.id = c.post_id
     JOIN users u1 ON u1.id = c.user_one_id
     JOIN users u2 ON u2.id = c.user_two_id
     WHERE c.user_one_id = ? OR c.user_two_id = ?
     ORDER BY c.last_message_at DESC, c.created_at DESC`,
    [userId, userId]
  );

  return rows;
}
