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
- jwtService: sign(payload[, {expiresInSeconds}]) -> { token, expiresIn }; verify(token) -> { valid, payload | error }
  Config via env:
  JWT_SECRET (HS256) or JWT_PUBLIC_KEY (for RS256 verify)
  JWT_ISSUER (default smartdesk)
  JWT_AUDIENCE (default smartdesk-clients)
  JWT_ACCESS_EXPIRES_IN (seconds, default 900)
  JWT_REFRESH_EXPIRES_IN (seconds, default 2592000)
  JWT_CLOCK_SKEW_SEC (seconds, default 0)

API
- POST /api/auth/signup: create user
- POST /api/auth/login: login with email/password, returns accessToken and refreshToken
- POST /api/auth/refresh: issue a new access token (optionally rotate refresh token)
- POST /api/auth/logout: revoke current session/refresh token
- GET /api/secure/profile: example protected route, requires Bearer access token
- GET /api/secure/admin/metrics: example admin-only route
- GET /api/private/me: protected route guarded at router level (middleware applied to all /api/private/**)
- GET /api/private/admin/overview: admin-only route under /api/private/**

Running locally
- Node >=16
- npm install
- npm start (requires DATABASE_URL or PG* env if you hit DB-backed endpoints)

Testing
- jest (unit + integration). Some tests use pg-mem to simulate Postgres.

Notes
- In production always set a strong JWT_SECRET or use RS256 with JWT_PUBLIC_KEY for verification and keep the private key secure on the issuer.
