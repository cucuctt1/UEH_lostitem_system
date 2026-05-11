USE lost_found_db;

ALTER TABLE items
  MODIFY description VARCHAR(1500) NULL,
  ADD COLUMN IF NOT EXISTS sender_name VARCHAR(120) NULL AFTER description,
  ADD COLUMN IF NOT EXISTS sender_student_id VARCHAR(30) NULL AFTER sender_name;
