CREATE DATABASE IF NOT EXISTS lost_found_db;
USE lost_found_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  avatar_url VARCHAR(500) NULL,
  bio VARCHAR(500) NULL,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  details VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) NOT NULL UNIQUE,
  use_count INT NOT NULL DEFAULT 0,
  is_prebuilt TINYINT(1) NOT NULL DEFAULT 0,
  is_frequent TINYINT(1) NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tags_use_count (use_count),
  INDEX idx_tags_is_frequent (is_frequent),
  INDEX idx_tags_prebuilt (is_prebuilt)
);

CREATE TABLE IF NOT EXISTS posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('lost', 'found') NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  location_id BIGINT UNSIGNED NOT NULL,
  event_time DATETIME NOT NULL,
  tags_json JSON NOT NULL,
  contact_note VARCHAR(300) NULL,
  image_url VARCHAR(500) NULL,
  image_urls_json JSON NULL,
  status ENUM('searching', 'found', 'returned') NOT NULL DEFAULT 'searching',
  moderation_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  approved_by BIGINT UNSIGNED NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_posts_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_posts_location FOREIGN KEY (location_id) REFERENCES locations(id),
  CONSTRAINT fk_posts_approved_by FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_posts_user_id (user_id),
  INDEX idx_posts_type (type),
  INDEX idx_posts_status (status),
  INDEX idx_posts_moderation (moderation_status),
  INDEX idx_posts_location (location_id),
  INDEX idx_posts_event_time (event_time),
  FULLTEXT INDEX idx_posts_text (title, description)
);

CREATE TABLE IF NOT EXISTS post_comments (
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
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  post_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_bookmarks_post FOREIGN KEY (post_id) REFERENCES posts(id),
  CONSTRAINT uq_bookmark UNIQUE (user_id, post_id),
  INDEX idx_bookmarks_user (user_id),
  INDEX idx_bookmarks_post (post_id),
  INDEX idx_bookmarks_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  user_one_id BIGINT UNSIGNED NOT NULL,
  user_two_id BIGINT UNSIGNED NOT NULL,
  last_message_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversations_post FOREIGN KEY (post_id) REFERENCES posts(id),
  CONSTRAINT fk_conversations_user_one FOREIGN KEY (user_one_id) REFERENCES users(id),
  CONSTRAINT fk_conversations_user_two FOREIGN KEY (user_two_id) REFERENCES users(id),
  CONSTRAINT uq_conversation UNIQUE (post_id, user_one_id, user_two_id),
  INDEX idx_conversations_user_one (user_one_id),
  INDEX idx_conversations_user_two (user_two_id),
  INDEX idx_conversations_last_message (last_message_at)
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  text TEXT NULL,
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_messages_conversation (conversation_id),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id BIGINT UNSIGNED NOT NULL,
  target_post_id BIGINT UNSIGNED NULL,
  target_user_id BIGINT UNSIGNED NULL,
  reason ENUM('spam', 'fraud', 'abuse', 'unsafe', 'other') NOT NULL,
  details VARCHAR(1000) NOT NULL,
  status ENUM('open', 'resolved') NOT NULL DEFAULT 'open',
  resolved_by BIGINT UNSIGNED NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_reports_target_post FOREIGN KEY (target_post_id) REFERENCES posts(id),
  CONSTRAINT fk_reports_target_user FOREIGN KEY (target_user_id) REFERENCES users(id),
  CONSTRAINT fk_reports_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id),
  INDEX idx_reports_status (status),
  INDEX idx_reports_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('new_message', 'matching_result', 'post_status') NOT NULL,
  title VARCHAR(150) NOT NULL,
  body VARCHAR(500) NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id BIGINT UNSIGNED NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_read (is_read),
  INDEX idx_notifications_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(1500) NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  location_id BIGINT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  status ENUM('stored', 'claimed', 'disposed') NOT NULL DEFAULT 'stored',
  post_id BIGINT UNSIGNED NULL,
  managed_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_items_location FOREIGN KEY (location_id) REFERENCES locations(id),
  CONSTRAINT fk_items_post FOREIGN KEY (post_id) REFERENCES posts(id),
  CONSTRAINT fk_items_managed_by FOREIGN KEY (managed_by) REFERENCES users(id),
  INDEX idx_items_status (status),
  INDEX idx_items_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lost_post_id BIGINT UNSIGNED NOT NULL,
  found_post_id BIGINT UNSIGNED NOT NULL,
  score DECIMAL(8,4) NOT NULL,
  detail_json JSON NOT NULL,
  status ENUM('suggested', 'accepted', 'rejected', 'returned') NOT NULL DEFAULT 'suggested',
  returned_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_matches_lost FOREIGN KEY (lost_post_id) REFERENCES posts(id),
  CONSTRAINT fk_matches_found FOREIGN KEY (found_post_id) REFERENCES posts(id),
  CONSTRAINT uq_match_pair UNIQUE (lost_post_id, found_post_id),
  INDEX idx_matches_score (score),
  INDEX idx_matches_status (status),
  INDEX idx_matches_created_at (created_at)
);
