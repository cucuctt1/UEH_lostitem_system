import { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";

export interface VerificationRecord extends RowDataPacket {
  id: number;
  post_id: number;
  conversation_id?: number | null;
  requester_id: number;
  request_type: "bypass" | "handover" | "owner_mark_found" | "dsa_hand_over";
  evidence_url?: string | null;
  status: "open" | "resolved" | "rejected";
  resolved_by?: number | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export async function createVerificationRequest(input: {
  postId: number;
  conversationId?: number | null;
  requesterId: number;
  requestType: "bypass" | "handover" | "owner_mark_found" | "dsa_hand_over";
  evidenceUrl?: string | null;
}): Promise<number> {
  const [result] = await dbPool.query<ResultSetHeader>(
    `INSERT INTO verification_requests (post_id, conversation_id, requester_id, request_type, evidence_url)
     VALUES (?, ?, ?, ?, ?)`,
    [input.postId, input.conversationId ?? null, input.requesterId, input.requestType, input.evidenceUrl ?? null]
  );

  return result.insertId;
}

export async function listOpenVerificationRequests(): Promise<VerificationRecord[]> {
  const [rows] = await dbPool.query<VerificationRecord[]>(
    `SELECT vr.* FROM verification_requests vr WHERE vr.status = 'open' ORDER BY vr.created_at DESC`
  );
  return rows;
}

export async function getVerificationRequestById(id: number): Promise<VerificationRecord | null> {
  const [rows] = await dbPool.query<VerificationRecord[]>(`SELECT * FROM verification_requests WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function resolveVerificationRequest(id: number, resolvedBy: number, status: "resolved" | "rejected"): Promise<void> {
  const resolvedAt = status === "resolved" ? new Date() : null;
  await dbPool.query(`UPDATE verification_requests SET status = ?, resolved_by = ?, resolved_at = ? WHERE id = ?`, [status, resolvedBy, resolvedAt, id]);
}
