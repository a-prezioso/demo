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


Details: Tokens, middleware, refresh endpoint, examples, and security

Access token (JWT)
- Algorithm: HS256 (HMAC-SHA256). RS256 verification is supported if JWT_PUBLIC_KEY is provided for verification scenarios.
- Default lifetime: 15 minutes. Configurable via env JWT_ACCESS_EXPIRES_IN (seconds).
- Format: header.payload.signature (base64url)
- Claims set by the API (via jwtService.sign):
  - sub: user id (UUID)
  - email: user email (normalized)
  - roles: array of strings (e.g., ["USER"], ["ADMIN"]) from users.roles
  - iss: issuer, default smartdesk (JWT_ISSUER)
  - aud: audience, default smartdesk-clients (JWT_AUDIENCE)
  - iat: issued-at (epoch seconds)
  - exp: expiration (epoch seconds)

Refresh token (opaque)
- Format: base64url-encoded random bytes (default 32 bytes -> ~43 chars)
- Default lifetime: 30 days. Configurable via env JWT_REFRESH_EXPIRES_IN (seconds).
- Storage: only SHA-256 hash is persisted in auth_refresh_tokens.token_hash, never the raw token. Metadata includes user_id, issued/last_used/expires, revoked_at/reason, user_agent, ip_address.
- Rotation: by default the refresh endpoint rotates the token (revokes old session and issues a new refresh token). Rotation can be disabled for testing by sending { rotate: false }.

JWT middleware and route protection
- Middleware: src/api/middleware/auth.js (requireAuth, requireRoles)
- Extraction: Authorization header with Bearer scheme. Example: Authorization: Bearer <accessToken>
- Verification: signature and claims via jwtService.verify; checks iss/aud if present, iat/nbf/exp with optional clock skew (JWT_CLOCK_SKEW_SEC).
- On success: attaches req.user = { id: sub, email, roles, ...claims } and req.auth = { token, payload }.
- Failure behavior:
  - 401 Unauthorized when:
    - Missing/invalid Authorization header
    - Invalid signature/algorithm or malformed token
    - Token expired (error: token_expired)
    - Token not yet valid (nbf) or invalid iat
    - Optional revocation hook marks token as revoked
  - 403 Forbidden when:
    - User is authenticated but lacks required roles

Protected routes in this project
- GET /api/secure/profile: any authenticated user (requireAuth())
- GET /api/secure/admin/metrics: ADMIN only (requireAuth({ roles: ["ADMIN"] }) + requireRoles(["ADMIN"]))
- All /api/private/* endpoints: requireAuth() applied at router level
- GET /api/private/admin/overview: ADMIN only (requireRoles(["ADMIN"]))

Refresh endpoint specification
- HTTP: POST
- URL: /api/auth/refresh
- Request body (JSON):
  - refreshToken: string (required) – the opaque token previously issued at login or refresh
  - rotate: boolean (optional, default true) – when true, the used refresh token is revoked and a new one is issued
- Response (200 OK):
  - Always returns a new access token
  - If rotate is true (default): also returns a new refresh token
  - Shape when rotate=true:
    { accessToken: string, refreshToken: string, tokenType: "Bearer", expiresIn: number }
  - Shape when rotate=false:
    { accessToken: string, tokenType: "Bearer", expiresIn: number }
- Error responses:
  - 400 Bad Request: missing refreshToken in the body or invalid payload schema
  - 401 Unauthorized: refresh token not found, expired, or revoked; token hash mismatch; user not ACTIVE
  - 500 Internal Server Error: unexpected failures

Endpoint behavior (server-side summary)
- The server hashes the provided refreshToken (SHA-256) and looks up the session in auth_refresh_tokens joined with the user record.
- Validations: existence, not expired, not revoked, user status ACTIVE.
- On success:
  - Issues a new access token with claims { sub, email, roles, iss, aud, iat, exp }.
  - Updates last_used_at for the session.
  - If rotate=true: revokes the current session (revoked_at, revoked_reason = "rotated") and creates a new session with a brand new refresh token.

Examples

1) Accessing a protected API
- Request:
  GET /api/secure/profile
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Success response (200):
  { "user": { "id": "<uuid>", "email": "user@example.com", "roles": ["USER"] } }
- Failure (missing/invalid token):
  401 { "error": "Invalid token" }
- Failure (expired token):
  401 { "error": "Token expired" }
- Failure (insufficient roles):
  403 { "error": "Forbidden" }

2) Refreshing tokens (rotate = default)
- Request:
  POST /api/auth/refresh
  Content-Type: application/json
  { "refreshToken": "<opaque-base64url>" }
- Success response (200):
  { "accessToken": "<jwt>", "refreshToken": "<new-opaque>", "tokenType": "Bearer", "expiresIn": 900 }

3) Refresh without rotation (testing only)
- Request:
  POST /api/auth/refresh
  Content-Type: application/json
  { "refreshToken": "<opaque-base64url>", "rotate": false }
- Success response (200):
  { "accessToken": "<jwt>", "tokenType": "Bearer", "expiresIn": 900 }

4) Example login response (context)
- Response body after POST /api/auth/login:
  { "accessToken": "<jwt>", "refreshToken": "<opaque>", "tokenType": "Bearer", "expiresIn": 900 }

Cookies vs body for refresh token
- The API expects the refreshToken in the JSON body for /api/auth/refresh.
- For browser apps, prefer storing the refresh token in an httpOnly, secure, sameSite cookie set by the front-end domain; the client may then read the cookie value server-side or forward it in the request body via an intermediate handler. Alternatively, extend the API to read refreshToken from a secure cookie.

Configuration
- JWT_SECRET: HMAC secret for HS256 (required in production)
- JWT_PUBLIC_KEY: PEM public key for RS256 verification (optional)
- JWT_ISSUER: issuer (default smartdesk)
- JWT_AUDIENCE: audience (default smartdesk-clients)
- JWT_ACCESS_EXPIRES_IN: access token lifetime in seconds (default 900)
- JWT_REFRESH_EXPIRES_IN: refresh token lifetime in seconds (default 2592000)
- JWT_CLOCK_SKEW_SEC: allowed leeway (seconds) when validating iat/nbf/exp (default 0)

Front-end recommendations and security notes
- Use HTTPS everywhere; never send tokens over plain HTTP.
- Store access tokens in memory only (do not persist in localStorage/sessionStorage) to reduce XSS impact.
- Store refresh tokens in httpOnly, secure cookies with appropriate sameSite; avoid exposing them to JS when possible.
- Always prefer refresh rotation (default). If a refresh token is used, the previous one becomes invalid when rotated.
- Implement logout by calling POST /api/auth/logout and removing client-side tokens; server will revoke the refresh session.
- Consider rate-limiting login and refresh endpoints and monitoring unusual patterns (e.g., multiple failed refresh attempts) using IP and User-Agent metadata recorded with sessions.
- Token theft implications:
  - Stolen access token: usable only until exp (short-lived by design). Rotate keys if a widespread compromise is suspected.
  - Stolen refresh token: can be exchanged for new access tokens until it is revoked or expires. Use rotation and anomaly detection; allow users to revoke all sessions.

Maintenance and cleanup
- Schedule periodic cleanup using repository.cleanupExpired({ retentionDays }) to remove expired sessions and old revoked tokens.
- Consider a job that also revokes sessions flagged by security analytics.
