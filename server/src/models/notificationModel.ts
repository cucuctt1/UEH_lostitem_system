import { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";

export async function createNotification(input: {
  userId: number;
  type: "new_message" | "matching_result" | "post_status";
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: number;
}): Promise<void> {
  await dbPool.query<ResultSetHeader>(
    `INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.type,
      input.title,
      input.body,
      input.referenceType ?? null,
      input.referenceId ?? null
    ]
  );
}

export async function listNotificationsForUser(userId: number): Promise<RowDataPacket[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

export async function markNotificationRead(notificationId: number, userId: number): Promise<void> {
  await dbPool.query(
    "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
    [notificationId, userId]
  );
}
