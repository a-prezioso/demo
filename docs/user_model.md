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

Indexes
- Unique(email)
- Partial unique on verification_token where not null
- Index on status
- GIN index on roles (migration 0002)

Security and logging
- Do not log password_hash, salt, or verification_token, refresh token raw values, or token hashes.
- If structured logging is used, ensure these fields are redacted.

Naming conventions
- snake_case for DB columns
- table name: users
- enum type: user_status

Notes
- Prefer Argon2id with parameters aligned to your infra, else bcrypt with cost >= 12.
- If the chosen library embeds the salt in the hash (bcrypt/argon2), leave salt null and ignore it in code.

Table: auth_refresh_tokens (session store) — migration 0002
- id: UUID PK default gen_random_uuid()
- user_id: UUID FK -> users(id) ON DELETE CASCADE
- token_hash: TEXT, unique, not null (hash of the raw refresh token; never log)
- issued_at: TIMESTAMPTZ not null default now()
- last_used_at: TIMESTAMPTZ nullable
- expires_at: TIMESTAMPTZ not null
- revoked_at: TIMESTAMPTZ nullable
- revoked_reason: TEXT nullable
- user_agent: TEXT nullable
- ip_address: INET nullable
- created_at: TIMESTAMPTZ not null default now()
- updated_at: TIMESTAMPTZ not null default now(); auto-updated via trigger

Behavioral notes
- On login: set last_login_at = now(), create a session row
- On logout: set revoked_at on the session row
- On password change or account disable: revoke all sessions for the user
