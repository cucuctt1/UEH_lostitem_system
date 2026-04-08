import { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";

export interface MatchRecord extends RowDataPacket {
  id: number;
  lost_post_id: number;
  found_post_id: number;
  score: number;
  detail_json: string;
  status: "suggested" | "accepted" | "rejected" | "returned";
  created_at: string;
}

export async function upsertMatch(
  lostPostId: number,
  foundPostId: number,
  score: number,
  detailJson: string
): Promise<void> {
  await dbPool.query(
    `INSERT INTO matches (lost_post_id, found_post_id, score, detail_json, status)
     VALUES (?, ?, ?, ?, 'suggested')
     ON DUPLICATE KEY UPDATE score = VALUES(score), detail_json = VALUES(detail_json), updated_at = CURRENT_TIMESTAMP`,
    [lostPostId, foundPostId, score, detailJson]
  );
}

export async function listMatchesForUser(userId: number): Promise<RowDataPacket[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT m.*, lp.title AS lost_title, fp.title AS found_title
     FROM matches m
     JOIN posts lp ON lp.id = m.lost_post_id
     JOIN posts fp ON fp.id = m.found_post_id
     WHERE lp.user_id = ? OR fp.user_id = ?
     ORDER BY m.score DESC, m.created_at DESC`,
    [userId, userId]
  );
  return rows;
}

export async function setMatchStatus(
  matchId: number,
  status: "accepted" | "rejected" | "returned"
): Promise<void> {
  const returnedAt = status === "returned" ? "returned_at = CURRENT_TIMESTAMP," : "";
  await dbPool.query(`UPDATE matches SET ${returnedAt} status = ? WHERE id = ?`, [status, matchId]);
}

export async function getMatchById(matchId: number): Promise<MatchRecord | null> {
  const [rows] = await dbPool.query<MatchRecord[]>("SELECT * FROM matches WHERE id = ? LIMIT 1", [matchId]);
  return rows[0] ?? null;
}

export async function createMatchNotificationRows(matchId: number): Promise<void> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT m.id, lp.user_id AS lost_owner_id, fp.user_id AS found_owner_id, m.score
     FROM matches m
     JOIN posts lp ON lp.id = m.lost_post_id
     JOIN posts fp ON fp.id = m.found_post_id
     WHERE m.id = ?`,
    [matchId]
  );

  if (!rows[0]) {
    return;
  }

  await dbPool.query<ResultSetHeader>(
    `INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
     VALUES
     (?, 'matching_result', 'New potential match', ?, 'match', ?),
     (?, 'matching_result', 'New potential match', ?, 'match', ?)`,
    [
      rows[0].lost_owner_id,
      `The system found a candidate with score ${rows[0].score}.`,
      matchId,
      rows[0].found_owner_id,
      `The system found a candidate with score ${rows[0].score}.`,
      matchId
    ]
  );
}
