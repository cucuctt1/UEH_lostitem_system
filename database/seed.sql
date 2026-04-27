USE lost_found_db;

-- Reset all application data to a clean baseline.
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE matches;
TRUNCATE TABLE messages;
TRUNCATE TABLE conversations;
TRUNCATE TABLE notifications;
TRUNCATE TABLE reports;
TRUNCATE TABLE bookmarks;
TRUNCATE TABLE post_comments;
TRUNCATE TABLE posts;
TRUNCATE TABLE items;
TRUNCATE TABLE tags;
TRUNCATE TABLE users;
TRUNCATE TABLE categories;
TRUNCATE TABLE locations;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO categories (name)
VALUES
  ('Electronics'),
  ('Books & Notes'),
  ('ID & Cards'),
  ('Bags'),
  ('Accessories'),
  ('Others');

INSERT INTO locations (name, details)
VALUES
  ('Library', 'Main campus library'),
  ('Cafeteria', 'Student cafeteria'),
  ('Lecture Hall A', 'Building A'),
  ('Dormitory Gate', 'Dormitory entrance'),
  ('Sports Center', 'Campus stadium');

-- Default admin account
-- Email policy: @st.ueh.edu.vn
-- Initial password: bacon123
-- bcrypt hash for bacon123: $2a$10$qU/Fh.fqXqswx1j3HFeY7ePzVVl8J5tOQOSSyc8ADowV.U479lXGe
INSERT INTO users (email, password_hash, must_change_password, full_name, role, phone, bio)
VALUES
  (
    'admin@st.ueh.edu.vn',
    '$2a$10$qU/Fh.fqXqswx1j3HFeY7ePzVVl8J5tOQOSSyc8ADowV.U479lXGe',
    0,
    'UEH System Admin',
    'admin',
    '0900000000',
    'Tai khoan quan tri he thong'
  );
