SmartDesk Coworking - Data Model, Migrations and Auth Design

This repository branch contains database artifacts to support user signup and the design for JWT-based authentication.

Paths
- db/migrations: SQL migrations (PostgreSQL)
- docs/user_model.md: User model documentation
- docs/auth_jwt.md: Authentication and JWT design
- docs/auth_refresh_endpoint.md: Detailed refresh endpoint and middleware summary
- docs/auth_flow_diagram.txt: High-level text diagram of auth flow
- docs/frontend_auth_components.md: React components for login/signup (client-side)
- docs/frontend_authentication.md: Frontend authentication architecture and token handling (PWA)
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
- jwtService: sign(payload[, {expiresInSeconds}]) -> { token, expiresIn } and verify(token) -> { valid, payload?, error }

API endpoints
- POST /api/auth/signup: registers user with valid email/password
- POST /api/auth/login: validates credentials, returns { accessToken, refreshToken, expiresIn, tokenType }
- POST /api/auth/refresh: refreshes access token (and optionally rotates refresh)
- POST /api/auth/logout: revokes current session
- GET /api/secure/profile: protected, requires Authorization: Bearer <access>
- GET /api/secure/admin/metrics: protected, ADMIN role

Frontend modules
- Components: src/client/components/{AuthPage.jsx,LoginForm.jsx,SignupForm.jsx,ProtectedRoute.jsx,AppRouter.jsx}
- Context: src/client/context/AuthContext.jsx (exposes user, isAuthenticated, login, signup, refresh, logout)
- API client: src/client/api/authClient.js (login, signup, refresh, logout)
- Storage: src/client/storage/tokenStorage.js (localStorage by default; can swap to sessionStorage)
- Utils: src/client/utils/jwt.js (decode payload, isJwtExpired)

How tokens are stored and used (summary)
- Access token: stored in localStorage (sd_access_token) with its expiry (sd_access_expires_at)
- Refresh token: stored in localStorage (sd_refresh_token)
- Requests to protected APIs must include Authorization: Bearer <accessToken>
- logout clears all tokens from storage and resets the AuthContext state
- See docs/frontend_authentication.md for detailed frontend token handling and route-guard snippets

Development
- Run tests: npm test
- Start server: npm start
