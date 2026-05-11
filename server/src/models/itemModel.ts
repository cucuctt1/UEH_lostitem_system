import { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { env } from "../config/env";

export async function listStoredItems(): Promise<RowDataPacket[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT i.*, c.name AS category_name, l.name AS location_name
     FROM items i
     LEFT JOIN categories c ON c.id = i.category_id
     LEFT JOIN locations l ON l.id = i.location_id
     ORDER BY i.created_at DESC`
  );
  return rows;
}

export async function createStoredItem(input: {
  name: string;
  description?: string | null;
  senderName?: string | null;
  senderStudentId?: string | null;
  categoryId: number;
  locationId: number;
  quantity: number;
  status: "stored" | "claimed" | "disposed";
  postId?: number;
  managedBy: number;
}): Promise<number> {
  // Detect which optional sender columns exist in the current DB schema
  const [cols] = await dbPool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'items' AND COLUMN_NAME IN ('sender_name','sender_student_id')`,
    [env.mysql.database]
  );

  const existingCols = new Set(cols.map((r) => r.COLUMN_NAME));

  const columns: string[] = ["name", "description"];
  const values: any[] = [input.name, input.description ?? null];

  if (existingCols.has("sender_name")) {
    columns.push("sender_name");
    values.push(input.senderName ?? null);
  }
  if (existingCols.has("sender_student_id")) {
    columns.push("sender_student_id");
    values.push(input.senderStudentId ?? null);
  }

  columns.push(
    "category_id",
    "location_id",
    "quantity",
    "status",
    "post_id",
    "managed_by"
  );
  values.push(
    input.categoryId,
    input.locationId,
    input.quantity,
    input.status,
    input.postId ?? null,
    input.managedBy
  );

  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO items (${columns.join(", ")}) VALUES (${placeholders})`;

  const [result] = await dbPool.query<ResultSetHeader>(sql, values);

  return result.insertId;
}

export async function updateStoredItemStatus(
  itemId: number,
  status: "stored" | "claimed" | "disposed"
): Promise<void> {
  await dbPool.query("UPDATE items SET status = ? WHERE id = ?", [status, itemId]);
}

export async function updateStoredItem(
  itemId: number,
  input: {
    name: string;
    description?: string | null;
    senderName?: string | null;
    senderStudentId?: string | null;
    categoryId: number;
    locationId: number;
    quantity: number;
    status: "stored" | "claimed" | "disposed";
  }
): Promise<void> {
  // Detect which optional sender columns exist
  const [cols] = await dbPool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'items' AND COLUMN_NAME IN ('sender_name','sender_student_id')`,
    [env.mysql.database]
  );

  const existingCols = new Set(cols.map((r) => r.COLUMN_NAME));

  const setClauses: string[] = ["name = ?", "description = ?"];
  const values: any[] = [input.name, input.description ?? null];

  if (existingCols.has("sender_name")) {
    setClauses.push("sender_name = ?");
    values.push(input.senderName ?? null);
  }
  if (existingCols.has("sender_student_id")) {
    setClauses.push("sender_student_id = ?");
    values.push(input.senderStudentId ?? null);
  }

  setClauses.push(
    "category_id = ?",
    "location_id = ?",
    "quantity = ?",
    "status = ?"
  );
  values.push(input.categoryId, input.locationId, input.quantity, input.status, itemId);

  const sql = `UPDATE items SET ${setClauses.join(",\n         ")} WHERE id = ?`;
  await dbPool.query(sql, values);
}

export async function deleteStoredItem(itemId: number): Promise<void> {
  await dbPool.query("DELETE FROM items WHERE id = ?", [itemId]);
}
