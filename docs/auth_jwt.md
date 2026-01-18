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
API --> DB(users) + password verify --> OK
API --> issue JWT(access, 15m), generate refresh token(30d)
API --> insert refresh_token_hash in DB.sessions
API --> return accessToken + refreshToken
Client --> Authorization: Bearer <access>
[expired]
Client --> POST /api/auth/refresh (refresh token)
API --> validate session not revoked/expired, rotate if enabled --> new access (and possibly new refresh)
Client --> POST /api/auth/logout --> API --> revoke session

JWT payloads (minimum)
- Access Token (JWT Claims)
  - sub: user id (UUID as string)
  - email: normalized email (lowercase)
  - roles: array of roles (e.g., ["USER"], optionally ["ADMIN"]) — sourced from users.roles
  - iat: issued-at (seconds)
  - exp: expiration (seconds since epoch)
  - iss: issuer (e.g., "smartdesk")
  - aud: audience (e.g., "smartdesk-pwa")
  - Optional: tenant_id (UUID) if multi-tenant is introduced later

- Refresh Token
  - Format: opaque random string, high entropy (at least 256 bits). Not a JWT by default.
  - Storage: server stores only a hash (token_hash) and metadata in auth_refresh_tokens; client holds the raw token.

Algorithms and secrets
- Signing algorithm: HS256 (HMAC-SHA256)
- Secrets:
  - JWT_ACCESS_SECRET: used to sign/verify access tokens (rotate periodically)
  - JWT_REFRESH_SECRET: optional if refresh is a JWT; if opaque, use it only to derive/tokenize; default opaque requires no signing
- Access token TTL: 15 minutes (JWT_ACCESS_EXPIRES_IN=900 seconds)
- Refresh token TTL: 30 days (JWT_REFRESH_EXPIRES_IN=2592000 seconds)
- Token issuer/audience:
  - JWT_ISSUER (default: smartdesk)
  - JWT_AUDIENCE (default: smartdesk-pwa)

Recommended storage (client)
- Access token: memory only
- Refresh token: httpOnly Secure SameSite cookie or secure storage API (never localStorage if avoidable)

Endpoints (planned)
- POST /api/auth/login
  - Body: { email, password }
  - 200: { accessToken, refreshToken, tokenType: "Bearer", expiresIn }
  - Errors: 400 invalid input; 401 invalid credentials; 403 account disabled/suspended/pending; 429 too many attempts; 500
- POST /api/auth/refresh
  - Body: { refreshToken } (or cookie)
  - 200: { accessToken, refreshToken? (if rotation), tokenType, expiresIn }
  - Errors: 400 invalid input; 401 invalid/expired token; 409 token already used (rotation); 500
- POST /api/auth/logout
  - Body: { refreshToken } (or session id) to revoke
  - 204: no content

Error cases and handling
- Invalid credentials (email not found or password mismatch): 401, generic message ("Invalid credentials")
- Account status not ACTIVE:
  - PENDING (email not verified): 403 with hint to verify
  - SUSPENDED/DISABLED: 403 with generic message
- Rate limiting / brute force protection:
  - Track failed attempts per email and IP
  - Temporary block after N attempts (e.g., 5 in 15 minutes); return 429
  - Optionally include Retry-After header
- Refresh token errors:
  - Not found/revoked/expired: 401
  - If rotation is enabled: using an old token after rotation => revoke session chain and 409/401

Sessions and refresh token strategy
- Table: auth_refresh_tokens (see migration 0002). Each row represents one active session (device/browser).
- Store refresh token as token_hash (hash of raw token) using strong KDF (scrypt/argon2/bcrypt) or at minimum SHA-256 with per-token random salt.
- On login: create session row with metadata: user_id, token_hash, issued_at, expires_at, user_agent, ip_address.
- On refresh:
  - Validate token by recomputing hash and looking up token_hash
  - If valid and not expired/revoked: issue new access token
  - Rotation modes:
    - rotate=false: keep same refresh token until expiry; update last_used_at
    - rotate=true: issue new refresh token, set old row revoked_at, create a new row (or update token_hash) atomically
- Logout:
  - Revoke session: set revoked_at timestamp and revoked_reason
- Revocation policy:
  - On password change or account disable: revoke all sessions for that user

Security considerations
- Never log passwords, password hashes, refresh tokens, or token hashes.
- Prefer httpOnly secure cookies for refresh tokens in browsers.
- Use secure random (crypto.randomBytes 32+) for refresh tokens; base64url encode for transport.
- Consider audience/issuer checks during JWT verify; set clock tolerance if needed.
- Consider storing last_login_at on users table.

DB schema summary (see migration 0002)
- users (existing): add columns
  - roles TEXT[] NOT NULL DEFAULT ARRAY['USER']
  - last_login_at TIMESTAMPTZ NULL
  - Index: GIN on roles
- auth_refresh_tokens (new)
  - id UUID PK
  - user_id UUID FK -> users(id) ON DELETE CASCADE
  - token_hash TEXT UNIQUE NOT NULL
  - issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - last_used_at TIMESTAMPTZ NULL
  - expires_at TIMESTAMPTZ NOT NULL
  - revoked_at TIMESTAMPTZ NULL
  - revoked_reason TEXT NULL
  - user_agent TEXT NULL
  - ip_address INET NULL
  - created_at/updated_at TIMESTAMPTZ with trigger
  - Indexes: UNIQUE(token_hash), INDEX(user_id), INDEX(expires_at)

JWT examples (payload only)
- Access token payload example:
  {
    "sub": "6b28b8e6-58a2-4e60-9d3a-8e1b9b1f1d44",
    "email": "user@example.com",
    "roles": ["USER"],
    "iss": "smartdesk",
    "aud": "smartdesk-pwa",
    "iat": 1715000000,
    "exp": 1715000900
  }

Configuration (environment variables)
- JWT_ACCESS_SECRET: base64/base64url or ascii secret for HS256 signing
- JWT_ACCESS_EXPIRES_IN: seconds (default 900)
- JWT_REFRESH_EXPIRES_IN: seconds (default 2592000)
- JWT_ISSUER: default smartdesk
- JWT_AUDIENCE: default smartdesk-pwa
- AUTH_REFRESH_ROTATE: true|false (default true)
- AUTH_MAX_LOGIN_ATTEMPTS: default 5
- AUTH_LOGIN_WINDOW_SEC: default 900

Open items / future enhancements
- Optional tenant/organization support (tenant_id claim and FK)
- Device fingerprints or push-based verification for sensitive actions
- IP allow/deny lists for admin roles
