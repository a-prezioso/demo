-- Migration: Add roles to users and create auth_refresh_tokens table
-- Safe and idempotent where possible

-- Add roles column to users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='roles'
  ) THEN
    ALTER TABLE users ADD COLUMN roles TEXT[] NOT NULL DEFAULT ARRAY['USER'];
  END IF;
END$$;

-- Add last_login_at to users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='last_login_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ NULL;
  END IF;
END$$;

-- Create GIN index on roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'users_roles_gin_idx' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX users_roles_gin_idx ON users USING GIN (roles);
  END IF;
END$$;

-- Sessions / refresh tokens table
CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  revoked_reason TEXT NULL,
  user_agent TEXT NULL,
  ip_address INET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT auth_refresh_tokens_token_hash_unique UNIQUE (token_hash)
);

-- Indexes
CREATE INDEX IF NOT EXISTS auth_refresh_tokens_user_id_idx ON auth_refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS auth_refresh_tokens_expires_at_idx ON auth_refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS auth_refresh_tokens_revoked_at_idx ON auth_refresh_tokens(revoked_at);

-- Trigger to auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_timestamp_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION set_timestamp_updated_at()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END$$;

DROP TRIGGER IF EXISTS set_auth_refresh_tokens_updated_at ON auth_refresh_tokens;
CREATE TRIGGER set_auth_refresh_tokens_updated_at
BEFORE UPDATE ON auth_refresh_tokens
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp_updated_at();

COMMENT ON TABLE auth_refresh_tokens IS 'Refresh token sessions (opaque token hashed)';
COMMENT ON COLUMN auth_refresh_tokens.token_hash IS 'Sensitive: hash of refresh token (never log)';
COMMENT ON COLUMN auth_refresh_tokens.expires_at IS 'UTC expiration for refresh token';
COMMENT ON COLUMN auth_refresh_tokens.user_agent IS 'User agent string provided by client';
COMMENT ON COLUMN auth_refresh_tokens.ip_address IS 'Client IP address';
