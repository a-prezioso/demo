Authentication and JWT design for SmartDesk Coworking PWA

Overview
- Goal: allow users to login with email/password and receive short-lived access tokens (JWT) and long-lived refresh tokens.
- Scope: login flow, token payloads, expirations, algorithms, secret management, error handling, sessions/refresh strategy and revocation.

Actors
- Client: SmartDesk PWA (browser)
- API: SmartDesk backend (Node/Express)
- DB: PostgreSQL (users, refresh sessions)

High-level flow (success path)
1) Client submits POST /api/auth/login with { email, password }.
2) API validates inputs, fetches user by email, checks status (ACTIVE), verifies password.
3) API issues:
   - Access token (JWT) signed with HS256, expires in 15 minutes (default)
   - Refresh token (opaque random string) valid for 30 days (default); stored hashed in DB as a session record tied to user/device.
4) API returns { accessToken, refreshToken, expiresIn, tokenType: "Bearer" }.
5) Client stores access token in memory only; stores refresh token in a secure cookie (httpOnly, secure, sameSite=lax/strict) or in secure storage.
6) Client sends Authorization: Bearer <accessToken> to access protected APIs.
7) On 401/expired access token, client calls POST /api/auth/refresh with the refresh token to obtain a new access token (and optional refresh rotation).
8) Logout: client calls POST /api/auth/logout and server revokes the current refresh token (session).

Text diagram (simplified)
Client --> POST /api/auth/login --> API
API --> validate&issue --> stores refresh hash in auth_refresh_tokens
Client <-- access+refresh -- API
Client --> GET /api/secure (Authorization: Bearer <access>)
API --> verify JWT --> 200 OK
Client --> POST /api/auth/refresh (refreshToken)
API --> hash, lookup session, rotate (revoke old + create new) --> 200 access+[refresh]
Client --> POST /api/auth/logout (refreshToken) --> API revokes session

Data model: auth_refresh_tokens
- id: UUID, primary key
- user_id: UUID, not null, FK users(id) ON DELETE CASCADE
- token_hash: TEXT, not null, unique (SHA-256 of opaque refresh token)
- issued_at: TIMESTAMPTZ, default now()
- last_used_at: TIMESTAMPTZ, nullable (updated on use)
- expires_at: TIMESTAMPTZ, not null
- revoked_at: TIMESTAMPTZ, nullable
- revoked_reason: TEXT, nullable ("logout", "rotated", "logout_all", "security")
- user_agent: TEXT, nullable
- ip_address: INET, nullable
- created_at/updated_at: TIMESTAMPTZ, default now(); updated via trigger

Repository API (Node)
- createSession({ userId, token, ttlSec, userAgent, ip }): stores hash + metadata
- findSessionWithUserByHash(tokenHash): returns joined session+user for validation
- touchLastUsed(sessionId): updates last_used_at
- revokeById(sessionId, reason): sets revoked_at
- revokeByTokenHash(tokenHash, reason)
- revokeAllForUser(userId, reason)
- cleanupExpired({ retentionDays }): deletes expired; deletes revoked older than retentionDays

Security notes
- Never log raw refresh tokens or token hashes
- Always rotate refresh tokens on use (default in refresh API); allow no-rotate for testing
- Use HTTPS, secure+httpOnly cookie store recommended for browser apps
- Consider rate limiting on login/refresh endpoints

Operations
- Cleanup job: schedule periodic invocation of repository.cleanupExpired (e.g., daily) via a background worker or external scheduler (cron).