import { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";

export async function createReport(input: {
  reporterId: number;
  targetPostId?: number;
  targetUserId?: number;
  reason: string;
  details: string;
}): Promise<number> {
  const [result] = await dbPool.query<ResultSetHeader>(
    `INSERT INTO reports (reporter_id, target_post_id, target_user_id, reason, details)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.reporterId,
      input.targetPostId ?? null,
      input.targetUserId ?? null,
      input.reason,
      input.details
    ]
  );

  return result.insertId;
}

export async function listReports(
  status?: "open" | "resolved",
  requesterId?: number
): Promise<RowDataPacket[]> {
  const values: unknown[] = [];
  let where = "1=1";

  if (typeof requesterId === "number") {
    where = "r.reporter_id = ?";
    values.push(requesterId);
  }

  if (status) {
    where += " AND r.status = ?";
    values.push(status);
  }

  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT r.*, ru.full_name AS reporter_name, tu.full_name AS target_user_name, p.title AS target_post_title
     FROM reports r
     JOIN users ru ON ru.id = r.reporter_id
     LEFT JOIN users tu ON tu.id = r.target_user_id
     LEFT JOIN posts p ON p.id = r.target_post_id
     WHERE ${where}
     ORDER BY r.created_at DESC`,
    values
  );

  return rows;
}

export async function resolveReport(reportId: number, adminId: number): Promise<void> {
  await dbPool.query(
    "UPDATE reports SET status = 'resolved', resolved_by = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?",
    [adminId, reportId]
  );
}
