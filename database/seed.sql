USE lost_found_db;

INSERT INTO categories (name)
VALUES
  ('Electronics'),
  ('Books & Notes'),
  ('ID & Cards'),
  ('Bags'),
  ('Accessories'),
  ('Others')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO locations (name, details)
VALUES
  ('Library', 'Main campus library'),
  ('Cafeteria', 'Student cafeteria'),
  ('Lecture Hall A', 'Building A'),
  ('Dormitory Gate', 'Dormitory entrance'),
  ('Sports Center', 'Campus stadium')
ON DUPLICATE KEY UPDATE details = VALUES(details);

-- Password for both seeded users: bacon123
-- bcrypt hash for bacon123: $2a$10$qU/Fh.fqXqswx1j3HFeY7ePzVVl8J5tOQOSSyc8ADowV.U479lXGe
INSERT INTO users (email, password_hash, full_name, role, phone, bio)
VALUES
  ('student@univ.edu', '$2a$10$qU/Fh.fqXqswx1j3HFeY7ePzVVl8J5tOQOSSyc8ADowV.U479lXGe', 'Demo Student', 'user', '0900000001', 'Student account for testing'),
  ('admin@univ.edu', '$2a$10$qU/Fh.fqXqswx1j3HFeY7ePzVVl8J5tOQOSSyc8ADowV.U479lXGe', 'DSA Admin', 'admin', '0900000002', 'Admin account for moderation')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name = VALUES(full_name),
  role = VALUES(role),
  phone = VALUES(phone),
  bio = VALUES(bio);

INSERT INTO posts (
  user_id, type, title, description, category_id, location_id, event_time,
  tags_json, contact_note, status, moderation_status
)
SELECT
  u.id,
  'lost',
  'Lost Black Backpack',
  'Black backpack with laptop charger and notebook.',
  4,
  1,
  DATE_SUB(NOW(), INTERVAL 4 HOUR),
  JSON_ARRAY('black', 'backpack', 'charger'),
  'Please contact me via chat.',
  'searching',
  'approved'
FROM users u
WHERE u.email = 'student@univ.edu'
LIMIT 1
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO posts (
  user_id, type, title, description, category_id, location_id, event_time,
  tags_json, contact_note, status, moderation_status
)
SELECT
  u.id,
  'found',
  'Found Backpack Near Library',
  'Found a black backpack near the reading area.',
  4,
  1,
  DATE_SUB(NOW(), INTERVAL 2 HOUR),
  JSON_ARRAY('black', 'backpack'),
  'Owner should verify contents in chat.',
  'found',
  'approved'
FROM users u
WHERE u.email = 'admin@univ.edu'
LIMIT 1
ON DUPLICATE KEY UPDATE title = VALUES(title);
