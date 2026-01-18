-- Migration: extend sessions with revocation metadata
-- Adds revoked_by and revoked_reason for auditability

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS revoked_by UUID NULL,
  ADD COLUMN IF NOT EXISTS revoked_reason VARCHAR(255) NULL;

-- Optional index to query by user_id + revoked_at
CREATE INDEX IF NOT EXISTS idx_sessions_user_revoked ON sessions(user_id, revoked_at);
