import { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";

export async function listCategories(): Promise<RowDataPacket[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>("SELECT * FROM categories ORDER BY name ASC");
  return rows;
}

export async function listLocations(): Promise<RowDataPacket[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>("SELECT * FROM locations ORDER BY name ASC");
  return rows;
}
