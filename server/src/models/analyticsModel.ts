import { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";

export async function getPlatformTotals(): Promise<RowDataPacket> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT
      (SELECT COUNT(*) FROM posts WHERE is_deleted = 0) AS total_posts,
      (SELECT COUNT(*) FROM matches WHERE status = 'returned') AS total_returns,
      (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_users`
  );

  return rows[0] ?? { total_posts: 0, total_returns: 0, total_users: 0 };
}

export async function getReturnSuccessRate(): Promise<number> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT
      CASE WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2)
      END AS success_rate
     FROM matches`
  );

  return Number(rows[0]?.success_rate ?? 0);
}

export async function getLostByLocation(): Promise<RowDataPacket[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT l.name AS location_name, COUNT(*) AS total
     FROM posts p
     JOIN locations l ON l.id = p.location_id
     WHERE p.type = 'lost' AND p.is_deleted = 0
     GROUP BY l.name
     ORDER BY total DESC`
  );

  return rows;
}

export async function getLostByHour(): Promise<RowDataPacket[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT HOUR(event_time) AS hour_of_day, COUNT(*) AS total
     FROM posts
     WHERE type = 'lost' AND is_deleted = 0
     GROUP BY HOUR(event_time)
     ORDER BY hour_of_day ASC`
  );

  return rows;
}
