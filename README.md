SmartDesk Coworking - Data Model, Migrations and Auth Design

This repository branch contains database artifacts to support user signup and the design for JWT-based authentication.

Paths
- db/migrations: SQL migrations (PostgreSQL)
- docs/user_model.md: User model documentation
- docs/auth_jwt.md: Authentication and JWT design
- docs/auth_flow_diagram.txt: High-level text diagram of auth flow
- src/security: Security services (password hashing/verification and input validation)
- src/api: Minimal HTTP API server exposing /api/auth/signup and /api/auth/login
- src/db: Database client (pg)

Applying the migrations (PostgreSQL)
- Requires extensions: citext, pgcrypto
- Run in psql:
  \i db/migrations/0001_create_users.sql
  \i db/migrations/0002_auth_refresh_tokens.sql

Conventions
- Columns are snake_case
- Do NOT log sensitive fields: password_hash, salt, verification_token, refresh tokens, token_hash
- Email is unique and case-insensitive via CITEXT

Security services
- passwordService: hashPassword(plain), verifyPassword(plain, hash)
- validationService: validateEmail(email) -> {valid, email, error}; validatePassword(pwd) -> {valid, error}
- jwtService: sign(payload[, {expiresInSeconds}]) -> { token, expiresIn }; verify(token) -> { valid, payload }
- Config via env:
  SECURITY_SCRYPT_N (default 16384)
  SECURITY_SCRYPT_R (8)
  SECURITY_SCRYPT_P (1)
  SECURITY_SCRYPT_KEYLEN (64)
  SECURITY_SALT_LEN (16)
  SECURITY_PASSWORD_MIN_LENGTH (10)
  SECURITY_PASSWORD_REQUIRE_UPPERCASE (true)
  SECURITY_PASSWORD_REQUIRE_LOWERCASE (true)
  SECURITY_PASSWORD_REQUIRE_NUMBER (true)
  SECURITY_PASSWORD_REQUIRE_SYMBOL (true)
  JWT_SECRET (dev default in code; set in prod)
  JWT_ISSUER (smartdesk)
  JWT_AUDIENCE (smartdesk-clients)
  JWT_ACCESS_EXPIRES_IN (900)
  JWT_REFRESH_EXPIRES_IN (2592000)

HTTP API
- POST /api/auth/signup { email, password } -> 201 { id, email, status, created_at, updated_at }
- POST /api/auth/login { email, password } -> 200 { accessToken, refreshToken, tokenType, expiresIn, user }
- POST /api/auth/refresh { refreshToken, [rotate=true] } -> 200 { accessToken, refreshToken?, tokenType, expiresIn }
  - Validates refresh token by sha256(token) match in DB, not revoked/expired, user status ok
  - If rotate=true (default), old session is revoked and a new refresh token is issued (rotation)
  - If rotate=false, reuses the same refresh token and only updates last_used_at
- POST /api/auth/logout { refreshToken } -> 204 (revoke provided refresh token)
- POST /api/auth/logout { allSessions: true } with Authorization: Bearer <access> -> 204 (revoke all sessions for user)
- GET /api/secure/profile with Authorization: Bearer <access> -> 200 { user }
- GET /api/secure/admin/metrics with Authorization: Bearer <access> (ADMIN) -> 200

Notes
- Error responses do not leak whether a refresh token exists; use generic 401 Invalid refresh token for invalid/expired/revoked tokens.
- On login, refresh token is random URL-safe string (base64url of 48 random bytes); only its sha256 hash is stored.
- Use HTTPS and httpOnly secure cookies for refresh token storage on the client where possible.
