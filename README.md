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
  SECURITY_PASSWORD_FORBID_COMMON (true)
  JWT_SECRET (required in prod)
  JWT_ISSUER (smartdesk)
  JWT_AUDIENCE (smartdesk-clients)
  JWT_ACCESS_EXPIRES_IN (900)
  JWT_REFRESH_EXPIRES_IN (2592000)

HTTP API
- POST /api/auth/signup {email, password}
- POST /api/auth/login {email, password}
- GET /api/secure/profile Authorization: Bearer <accessToken>
- GET /api/secure/admin/metrics Authorization: Bearer <accessToken with ADMIN role>

Protecting routes
- Use requireAuth([options]) middleware from src/api/middleware/auth.js
  Options:
  - roles: ["ADMIN", ...] to restrict access
  - requireAll: boolean, if true all roles must be present
  - isTokenRevoked(payload, token, req): optional async hook to check
    token/session revocation (e.g., consult auth_refresh_tokens)
- requireRoles([roles], { requireAll }) can be composed after requireAuth

Examples
const { requireAuth, requireRoles } = require("./src/api/middleware/auth");
app.get("/api/secure/profile", requireAuth(), handler);
app.get("/api/secure/admin/metrics", requireAuth({ roles: ["ADMIN"] }), requireRoles(["ADMIN"]), handler);
