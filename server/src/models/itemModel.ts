import { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";

export async function listStoredItems(): Promise<RowDataPacket[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT i.*, c.name AS category_name, l.name AS location_name
     FROM items i
     JOIN categories c ON c.id = i.category_id
     JOIN locations l ON l.id = i.location_id
     ORDER BY i.created_at DESC`
  );
  return rows;
}

export async function createStoredItem(input: {
  name: string;
  description: string;
  categoryId: number;
  locationId: number;
  quantity: number;
  status: "stored" | "claimed" | "disposed";
  postId?: number;
  managedBy: number;
}): Promise<number> {
  const [result] = await dbPool.query<ResultSetHeader>(
    `INSERT INTO items (
      name, description, category_id, location_id, quantity, status, post_id, managed_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.description,
      input.categoryId,
      input.locationId,
      input.quantity,
      input.status,
      input.postId ?? null,
      input.managedBy
    ]
  );

  return result.insertId;
}

export async function updateStoredItemStatus(
  itemId: number,
  status: "stored" | "claimed" | "disposed"
): Promise<void> {
  await dbPool.query("UPDATE items SET status = ? WHERE id = ?", [status, itemId]);
}
