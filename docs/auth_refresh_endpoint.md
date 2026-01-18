Auth refresh endpoint and middleware summary

This document complements docs/auth_jwt.md with a focused specification for the refresh flow and middleware behavior.

1) Overview
- Access token: JWT, HS256, default 15 minutes (JWT_ACCESS_EXPIRES_IN).
- Refresh token: opaque random, default 30 days (JWT_REFRESH_EXPIRES_IN). Only its SHA-256 hash is persisted.
- Persistence: table auth_refresh_tokens with user_id, token_hash, issued_at, last_used_at, expires_at, revoked_at/reason, user_agent, ip_address.

2) JWT middleware (requireAuth / requireRoles)
- Location: src/api/middleware/auth.js
- Behavior:
  - Extracts Bearer token from Authorization header.
  - Verifies signature and claims with jwtService.verify.
  - On success, sets req.user { id: sub, email, roles } and req.auth { token, payload }.
  - On error: 401 for missing/invalid/expired; 403 for insufficient roles.
- Protected routes in this project:
  - GET /api/secure/profile (any authenticated user)
  - GET /api/secure/admin/metrics (ADMIN)
  - All /api/private/* (authenticated); /api/private/admin/overview (ADMIN)

3) Endpoint: POST /api/auth/refresh
- Request (JSON): { refreshToken: string, rotate?: boolean }
  - rotate default: true. When true, the used refresh session is revoked and a new refresh token is issued.
- Responses:
  - 200 OK (rotate=true): { accessToken, refreshToken, tokenType: "Bearer", expiresIn }
  - 200 OK (rotate=false): { accessToken, tokenType: "Bearer", expiresIn }
  - 400 Bad Request: missing refreshToken or invalid payload
  - 401 Unauthorized: session not found, expired, revoked, or user not ACTIVE
  - 500 Internal Server Error: unexpected failures
- Server processing summary:
  - Hash provided refreshToken (SHA-256) and query auth_refresh_tokens joined with users.
  - Validate not expired, not revoked, user status ACTIVE.
  - Issue new access JWT with { sub, email, roles } and configured iss/aud.
  - Update last_used_at; if rotate=true, revoke current session (reason "rotated") and create a new session with a new opaque refresh token.

4) Examples
- Refresh with rotation:
  POST /api/auth/refresh
  Content-Type: application/json
  { "refreshToken": "<opaque>" }
  -> 200 { "accessToken": "<jwt>", "refreshToken": "<new-opaque>", "tokenType": "Bearer", "expiresIn": 900 }

- Refresh without rotation (testing):
  POST /api/auth/refresh
  Content-Type: application/json
  { "refreshToken": "<opaque>", "rotate": false }
  -> 200 { "accessToken": "<jwt>", "tokenType": "Bearer", "expiresIn": 900 }

5) Security notes
- Use HTTPS and httpOnly+secure cookies for refresh tokens when used by browsers.
- Do not log raw refresh tokens or their hashes.
- Prefer rotation to reduce the window of misuse for stolen refresh tokens.
- Consider implementing IP/User-Agent binding checks or anomaly detection on refresh.
- Provide a way for users to revoke all sessions (POST /api/auth/logout with allSessions=true).
