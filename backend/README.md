Backend scaffolding for SmartDesk Coworking API

This folder contains early scaffolding for the backend. Tech stack: Node.js (18+), TypeScript.

Current scope
- User domain model (TypeScript interface + enums)
- Utility to redact sensitive fields from logs
- Initial PostgreSQL migration to create the users table
- Security services for password hashing and validation
- Minimal DB client (pg) and user repository
- Auth controller with signup handler (framework-agnostic)

Notes
- Email is stored as CITEXT and is unique (case-insensitive)
- Primary key uses UUID v4 (db default via uuid-ossp)
- Passwords are NEVER stored in plaintext; only password_hash
- Consider using argon2id or bcrypt with cost parameters aligned to production hardware
- Do not log sensitive columns; use userForLog() utility and avoid logging password/hash entirely
- The signup handler validates inputs, handles unique violations (409), and returns 201 with non-sensitive fields only.

Wiring the HTTP framework
- This repo does not include Express/Fastify setup yet. The auth controller exposes a `signupHandler(req, res)` which can be mounted in a future task.
- The `db/client.ts` expects a PostgreSQL connection via `DATABASE_URL` or PG* env vars.

