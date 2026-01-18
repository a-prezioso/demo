Backend scaffolding for SmartDesk Coworking API

This folder contains early scaffolding for the backend. Tech stack: Node.js (18+), TypeScript.

Current scope
- User domain model (TypeScript interface + enums)
- Utility to redact sensitive fields from logs
- Initial PostgreSQL migration to create the users table
- Security services for password hashing and validation
- Minimal DB client (pg) and user repository
- Auth controller with signup handler (framework-agnostic)
- JWT service (HS256) with access/refresh token helpers
- Login controller for issuing tokens
- Migration for user_sessions table (refresh token tracking)
- JWT auth middleware (authGuard) to protect reserved routes

Notes
- Email is stored as CITEXT and is unique (case-insensitive)
- Primary key uses UUID v4 (db default via uuid-ossp)
- Passwords are NEVER stored in plaintext; only password_hash
- Consider using argon2id or bcrypt with cost parameters aligned to production hardware
- Do not log sensitive columns; use userForLog() utility and avoid logging password/hash entirely
- The signup handler validates inputs, handles unique violations (409), and returns 201 with non-sensitive fields only.
- Login handler validates credentials and returns access and refresh JWTs. Persist refresh token hash in user_sessions when wiring a DB-backed session service.
- authGuard validates access tokens from Authorization header and sets req.user; missing/invalid -> 401, missing roles -> 403.

JWT configuration
- JWT_SECRET (required): HMAC secret key
- JWT_ISSUER (optional): iss claim
- JWT_AUDIENCE (optional): aud claim
- JWT_ACCESS_TTL (default 15m)
- JWT_REFRESH_TTL (default 7d)

Wiring the HTTP framework
- This repo does not include Express/Fastify setup yet. The auth controller exposes signupHandler and loginHandler which can be mounted in a future task.
- The `db/client.ts` expects a PostgreSQL connection via `DATABASE_URL` or PG* env vars.
- To protect reserved APIs (e.g., /api/private/**), apply the authGuard middleware in your HTTP server. See docs/secure-routing.md for an example.

Diagrams (high-level)
Auth flow (login):
- Client -> POST /auth/login {email,password}
- API -> validate -> verifyPassword -> issue access token (15m) + refresh token (7d)
- (Optional) persist refresh_token_hash in user_sessions with expires_at
- Client stores access token (memory) and refresh token (httpOnly cookie or secure storage)

Data model additions:
- user_sessions(id, user_id, refresh_token_hash, user_agent, ip_address, created_at, expires_at, revoked_at)
