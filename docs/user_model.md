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
- verification_token: TEXT, nullable, unique (partial unique index when not null); never log
- verification_expires_at: TIMESTAMPTZ, nullable
- created_at: TIMESTAMPTZ, not null, default now()
- updated_at: TIMESTAMPTZ, not null, default now(); auto-updated via trigger

Indexes
- Unique(email)
- Partial unique on verification_token where not null
- Index on status

Security and logging
- Do not log password_hash, salt, or verification_token.
- If structured logging is used, ensure these fields are redacted.

Naming conventions
- snake_case for DB columns
- table name: users
- enum type: user_status

Notes
- Prefer Argon2id with parameters aligned to your infra, else bcrypt with cost >= 12.
- If the chosen library embeds the salt in the hash (bcrypt/argon2), leave salt null and ignore it in code.
