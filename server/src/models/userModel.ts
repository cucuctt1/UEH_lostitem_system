import { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { Role } from "../types";

export interface UserRecord extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  must_change_password: number;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: Role;
  is_locked: number;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const [rows] = await dbPool.query<UserRecord[]>(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] ?? null;
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  const [rows] = await dbPool.query<UserRecord[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

export async function updateUserProfile(
  id: number,
  payload: { fullName?: string; bio?: string; avatarUrl?: string }
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (typeof payload.fullName === "string") {
    fields.push("full_name = ?");
    values.push(payload.fullName);
  }
  if (typeof payload.bio === "string") {
    fields.push("bio = ?");
    values.push(payload.bio);
  }
  if (typeof payload.avatarUrl === "string") {
    fields.push("avatar_url = ?");
    values.push(payload.avatarUrl);
  }

  if (fields.length === 0) {
    return;
  }

  values.push(id);
  await dbPool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function setUserLock(userId: number, locked: boolean): Promise<void> {
  await dbPool.query("UPDATE users SET is_locked = ? WHERE id = ?", [locked ? 1 : 0, userId]);
}

export interface UserSummary extends RowDataPacket {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  is_locked: number;
  must_change_password: number;
  created_at: string;
}

export async function listUsers(): Promise<UserSummary[]> {
  const [rows] = await dbPool.query<UserSummary[]>(
    "SELECT id, email, full_name, role, is_locked, must_change_password, created_at FROM users ORDER BY created_at DESC"
  );
  return rows;
}

export interface UserPostHistoryRecord extends RowDataPacket {
  id: number;
  title: string;
  type: "lost" | "found";
  status: "searching" | "found" | "returned";
  moderation_status: "pending" | "approved" | "rejected";
  created_at: string;
}

export async function getUserPostHistory(userId: number): Promise<UserPostHistoryRecord[]> {
  const [rows] = await dbPool.query<UserPostHistoryRecord[]>(
    `SELECT id, title, type, status, moderation_status, created_at
     FROM posts
     WHERE user_id = ? AND is_deleted = 0
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows;
}

export interface UserReturnHistoryRecord extends RowDataPacket {
  match_id: number;
  lost_post_id: number;
  found_post_id: number;
  score: number;
  returned_at: string | null;
}

export async function getUserReturnHistory(userId: number): Promise<UserReturnHistoryRecord[]> {
  const [rows] = await dbPool.query<UserReturnHistoryRecord[]>(
    `SELECT m.id AS match_id, m.lost_post_id, m.found_post_id, m.score, m.returned_at
     FROM matches m
     JOIN posts lp ON lp.id = m.lost_post_id
     JOIN posts fp ON fp.id = m.found_post_id
     WHERE m.status = 'returned' AND (lp.user_id = ? OR fp.user_id = ?)
     ORDER BY m.returned_at DESC`,
    [userId, userId]
  );

  return rows;
}

export async function createUser(
  email: string,
  passwordHash: string,
  fullName: string,
  role: Role = "user",
  options?: { mustChangePassword?: boolean }
): Promise<number> {
  const mustChangePassword = options?.mustChangePassword ? 1 : 0;

  const [result] = await dbPool.query<ResultSetHeader>(
    "INSERT INTO users (email, password_hash, full_name, role, must_change_password) VALUES (?, ?, ?, ?, ?)",
    [email, passwordHash, fullName, role, mustChangePassword]
  );

  return result.insertId;
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  await dbPool.query(
    "UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?",
    [passwordHash, userId]
  );
}
