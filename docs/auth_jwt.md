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
API --> validate --> verify password --> issue tokens
Client <-- 200 {access, refresh}

Client --> GET /api/secure/* (Authorization: Bearer <access>)
API --> verify JWT --> 200 or 401

Client --> POST /api/auth/refresh { refreshToken, [rotate=true] }
API --> hash(refreshToken) --> lookup session --> check not revoked/expired -->
        issue new access (and optionally rotate refresh) --> 200

Client --> POST /api/auth/logout { refreshToken } OR { allSessions: true } + Authorization: Bearer <access>
API --> revoke session(s) --> 204

Token formats
- Access token: JWT HS256, claims: iss, aud, iat, exp, sub (user id), email, roles.
- Refresh token: opaque random string; we use base64url(randomBytes(48)). Only its SHA-256 hash is stored in DB.

Database schema
- Table auth_refresh_tokens
  - id UUID PK
  - user_id UUID FK -> users(id)
  - token_hash TEXT NOT NULL (sha256 of refresh token)
  - issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - last_used_at TIMESTAMPTZ NULL
  - expires_at TIMESTAMPTZ NOT NULL
  - revoked_at TIMESTAMPTZ NULL
  - revoked_reason TEXT NULL
  - user_agent TEXT NULL
  - ip_address INET NULL
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - Unique partial index on token_hash where revoked_at is null (optional)

Refresh endpoint behavior
- Input: { refreshToken, rotate? }
- If token is invalid, not found, revoked or expired -> 401 { error: "Invalid refresh token" }
- If user is PENDING -> 403; if DISABLED/SUSPENDED -> 423
- On success:
  - Issue new access token
  - If rotate=true (default): revoke current session (set revoked_at, revoked_reason = 'rotated'), create new session with new refresh token, return both tokens
  - If rotate=false: keep same refresh session, update last_used_at, return only new access token and the same refresh token for client convenience

Logout / revoke behavior
- POST /api/auth/logout
  - { refreshToken } -> revoke that session (idempotent); 204
  - { allSessions: true } + Authorization: Bearer <access> -> revoke all sessions for that user; 204

Security considerations
- Never store raw refresh tokens; only SHA-256 hashes.
- Do not leak whether a refresh token exists; use generic 401 for invalid/expired/revoked.
- Consider rate limiting for refresh and login endpoints to mitigate brute force.
- Use HTTPS. Set httpOnly, secure, sameSite cookies if storing refresh token in cookies.
- Rotating refresh tokens reduces replay windows; recommend default rotate=true.
