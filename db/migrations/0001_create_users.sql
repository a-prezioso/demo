-- Migration: Create users table for SmartDesk Coworking PWA
-- Database: PostgreSQL
-- Safe to run multiple times (idempotent constructs used where possible)

-- Extensions (for case-insensitive email and UUID generation)
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'DISABLED');
  END IF;
END$$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NULL,
  status user_status NOT NULL DEFAULT 'ACTIVE',
  verification_token TEXT NULL,
  verification_expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Constraints
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_password_hash_min_length CHECK (char_length(password_hash) >= 20)
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS users_verification_token_unique 
  ON users(verification_token) 
  WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION set_timestamp_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp_updated_at();

-- Comments for documentation and safety
COMMENT ON TABLE users IS 'Registered users for SmartDesk Coworking PWA';
COMMENT ON COLUMN users.email IS 'User email (CITEXT). Unique and case-insensitive';
COMMENT ON COLUMN users.password_hash IS 'Sensitive: password hash (never log)';
COMMENT ON COLUMN users.salt IS 'Sensitive: optional salt if algorithm requires it (never log)';
COMMENT ON COLUMN users.status IS 'Account status';
COMMENT ON COLUMN users.verification_token IS 'Sensitive: email verification token (never log)';
COMMENT ON COLUMN users.verification_expires_at IS 'UTC expiration for verification token';
COMMENT ON COLUMN users.created_at IS 'Creation timestamp (UTC)';
COMMENT ON COLUMN users.updated_at IS 'Last update timestamp (UTC)';
