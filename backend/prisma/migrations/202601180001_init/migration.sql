-- Prisma-style SQL migration: initialize users table for SmartDesk Coworking
-- Safe defaults and constraints. Ensure required extensions exist.

-- Enable pgcrypto for gen_random_uuid(), safe if already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum for user status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
    CREATE TYPE "UserStatus" AS ENUM ('PENDING','ACTIVE','SUSPENDED','DISABLED','DELETED');
  END IF;
END $$;

-- Table users
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(320) NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "password_salt" varchar(255),
  "verification_token" varchar(255),
  "verification_expires_at" timestamp(3),
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" timestamp(3) NOT NULL DEFAULT now(),
  "updated_at" timestamp(3) NOT NULL DEFAULT now()
);

-- Uniqueness on email (case-insensitive recommendation: store lowercased emails)
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users" ("email");

-- Additional indexes
CREATE INDEX IF NOT EXISTS "idx_users_status" ON "users" ("status");
CREATE INDEX IF NOT EXISTS "idx_users_created_at" ON "users" ("created_at");

-- Trigger to auto-update updated_at timestamp on UPDATE
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON "users";
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON "users"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
