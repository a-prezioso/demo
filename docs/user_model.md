User data model for SmartDesk Coworking PWA

Overview
- Purpose: persist registered users securely to support signup and future authentication.
- Storage: PostgreSQL (recommended). Use migrations under db/migrations.

Table: users
- id: UUID, primary key, default gen_random_uuid()
- email: CITEXT, not null, unique (case-insensitive uniqueness)
- password_hash: TEXT, not null (hash from a strong KDF like Argon2id/bcrypt; never log)
- salt: TEXT, nullable (only if hashing library does not embed salt in hash; never log)
- status: user_status enum, default ACTIVE; values: ACTIVE, PENDING, SUSPENDED, DISABLED
- roles: TEXT[] NOT NULL DEFAULT ARRAY['USER'] (added in migration 0002)
- verification_token: TEXT, nullable, unique (partial unique index when not null); never log
- verification_expires_at: TIMESTAMPTZ, nullable
- last_login_at: TIMESTAMPTZ, nullable (added in migration 0002)
- created_at: TIMESTAMPTZ, not null, default now()
- updated_at: TIMESTAMPTZ, not null, default now(); auto-updated via trigger

Table: auth_refresh_tokens (sessions)
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- token_hash: TEXT NOT NULL UNIQUE (SHA-256 of opaque refresh token)
- issued_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- last_used_at: TIMESTAMPTZ NULL
- expires_at: TIMESTAMPTZ NOT NULL
- revoked_at: TIMESTAMPTZ NULL
- revoked_reason: TEXT NULL (logout, rotated, logout_all, security)
- user_agent: TEXT NULL
- ip_address: INET NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes
- Unique(email)
- Partial unique on verification_token where not null
- Index on status
- GIN index on roles (migration 0002)
- Indexes on auth_refresh_tokens.user_id, .expires_at, .revoked_at

Security and logging
- Do not log password_hash, salt, or verification_token, refresh token raw values, or token hashes.
- If structured logging is used, ensure these fields are redacted.

Naming conventions
- snake_case for DB columns
- table name: users
- enum type: user_status

Notes
- Prefer Argon2id with parameters aligned to your infra, scrypt is used in this repo for zero-deps demo.
- Rotate refresh tokens on use; this repository implements rotation in the refresh API and supports mass revocation.
