import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { env } from "./env";

export const dbPool = mysql.createPool({
  host: env.mysql.host,
  port: env.mysql.port,
  user: env.mysql.user,
  password: env.mysql.password,
  database: env.mysql.database,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false
});

export async function healthCheckDb(): Promise<void> {
  const connection = await dbPool.getConnection();
  try {
    await connection.query("SELECT 1");
  } finally {
    connection.release();
  }
}

export async function setupDatabaseIfEnabled(): Promise<void> {
  if (!env.autoSetupDb) {
    return;
  }

  const schemaPath = path.resolve(process.cwd(), "../database/schema.sql");
  const seedPath = path.resolve(process.cwd(), "../database/seed.sql");

  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const seedSql = fs.readFileSync(seedPath, "utf8");

  const bootstrapPool = mysql.createPool({
    host: env.mysql.host,
    port: env.mysql.port,
    user: env.mysql.user,
    password: env.mysql.password,
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 2,
    multipleStatements: true
  });

  try {
    await bootstrapPool.query(schemaSql);

    try {
      await bootstrapPool.query("ALTER TABLE posts ADD COLUMN image_urls_json JSON NULL AFTER image_url");
    } catch (error: any) {
      if (error?.code !== "ER_DUP_FIELDNAME") {
        throw error;
      }
    }

    // Ensure items table has expanded sender fields and larger description
    try {
      await bootstrapPool.query("ALTER TABLE items MODIFY description VARCHAR(1500) NULL");
    } catch (error: any) {
      if (error?.code !== "ER_BAD_FIELD_ERROR") {
        throw error;
      }
    }

    try {
      await bootstrapPool.query("ALTER TABLE items ADD COLUMN sender_name VARCHAR(120) NULL AFTER description");
    } catch (error: any) {
      if (error?.code !== "ER_DUP_FIELDNAME" && error?.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
        throw error;
      }
    }

    try {
      await bootstrapPool.query("ALTER TABLE items ADD COLUMN sender_student_id VARCHAR(30) NULL AFTER sender_name");
    } catch (error: any) {
      if (error?.code !== "ER_DUP_FIELDNAME" && error?.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
        throw error;
      }
    }

    try {
      await bootstrapPool.query(
        "ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash"
      );
    } catch (error: any) {
      if (error?.code !== "ER_DUP_FIELDNAME") {
        throw error;
      }
    }

    await bootstrapPool.query(
      `CREATE TABLE IF NOT EXISTS post_comments (
         id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
         post_id BIGINT UNSIGNED NOT NULL,
         user_id BIGINT UNSIGNED NOT NULL,
         content VARCHAR(1000) NOT NULL,
         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
         CONSTRAINT fk_post_comments_post FOREIGN KEY (post_id) REFERENCES posts(id),
         CONSTRAINT fk_post_comments_user FOREIGN KEY (user_id) REFERENCES users(id),
         INDEX idx_post_comments_post (post_id),
         INDEX idx_post_comments_user (user_id),
         INDEX idx_post_comments_created_at (created_at)
       )`
    );

    await bootstrapPool.query(seedSql);
  } finally {
    await bootstrapPool.end();
  }
}
