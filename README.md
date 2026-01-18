SmartDesk Coworking - Data Model, Migrations and Auth Design

This repository branch contains database artifacts to support user signup and the design for JWT-based authentication.

Paths
- db/migrations: SQL migrations (PostgreSQL)
- docs/user_model.md: User model documentation
- docs/auth_jwt.md: Authentication and JWT design
- docs/auth_refresh_endpoint.md: Detailed refresh endpoint and middleware summary
- docs/auth_flow_diagram.txt: High-level text diagram of auth flow
- docs/frontend_auth_components.md: React components for login/signup (client-side)
- src/security: Security services (password hashing/verification and input validation)
- src/api: Minimal HTTP API server exposing /api/auth/signup and /api/auth/login
- src/db: Database client (pg)
- src/api/repositories: Persistence layer for refresh tokens
- src/client: Minimal React components and client helpers for authentication

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

Auth APIs
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout

Protected APIs
- GET /api/secure/profile (any authenticated user)
- GET /api/secure/admin/metrics (ADMIN role)
- GET /api/private/me, /api/private/admin/overview

Refresh token persistence
- Implemented in src/api/repositories/refreshTokenRepository.js
- Functions: createSession, findSessionWithUserByHash, touchLastUsed, revokeById, revokeByTokenHash, revokeAllForUser, cleanupExpired
- Only token hashes are stored; raw tokens are never persisted or logged

JWT and refresh flow documentation
- See docs/auth_jwt.md for a complete overview: token formats, claims, lifetimes, middleware behavior, endpoint specs, and examples.
- See docs/auth_refresh_endpoint.md for a focused spec of POST /api/auth/refresh and middleware quick reference.
- See docs/frontend_auth_components.md for instructions on integrating the client-side React components for login/signup.

Maintenance
- Schedule periodic cleanup of expired/old revoked refresh tokens using cleanupExpired({ retentionDays }).
