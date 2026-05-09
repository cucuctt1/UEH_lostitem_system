-- Migration: add verification_requests table

CREATE TABLE IF NOT EXISTS verification_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  conversation_id BIGINT UNSIGNED NULL,
  requester_id BIGINT UNSIGNED NOT NULL,
  request_type ENUM('bypass','handover','owner_mark_found','dsa_hand_over') NOT NULL,
  evidence_url VARCHAR(1024) NULL,
  status ENUM('open','resolved','rejected') NOT NULL DEFAULT 'open',
  resolved_by BIGINT UNSIGNED NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_verif_post FOREIGN KEY (post_id) REFERENCES posts(id),
  INDEX idx_verif_status (status),
  INDEX idx_verif_requester (requester_id),
  INDEX idx_verif_post (post_id)
);

-- Optional: add verified fields to matches (non-breaking)
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS verified_by BIGINT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP NULL;

-- Note: IF NOT EXISTS in ALTER TABLE ADD COLUMN may not be supported on older MySQL versions; run with caution.
