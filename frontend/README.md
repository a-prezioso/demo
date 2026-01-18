# Frontend

Testing setup

- Jest configured via root jest.config.js with a frontend project using jsdom.
- React Testing Library is used for UI tests.
- Tests live under frontend/src/**/__tests__ and as *.test.ts(x).

Run tests

- npm test (from repository root)

---

Authentication (frontend)

Overview
- The PWA implements a simple JWT-based authentication (access + refresh) aligned with the backend API.
- Core building blocks:
  - AuthContext (frontend/src/context/AuthContext.tsx): React context/provider exposing state, login, signup, logout. Restores session from storage at boot.
  - authService (frontend/src/auth/authService.ts): Thin service that calls API client, persists tokens to tokenStorage and returns updated auth state.
  - tokenStorage (frontend/src/auth/tokenStorage.ts): Persists a single JSON blob under localStorage key "demo.auth.state" with accessToken, refreshToken and user.
  - ProtectedRoute (frontend/src/router/ProtectedRoute.tsx): Wrapper component to guard routes that require authentication.
  - useAuth hook (frontend/src/hooks/useAuth.ts): Convenience hook to access AuthContext and baseUrl.

Data model (stored client-side)
- StoredAuthState: { isAuthenticated: boolean; accessToken?: string; refreshToken?: string; user: { id, email, status? } | null }
- Storage key: demo.auth.state (localStorage)
- Session restore: AuthProvider initializes its state from tokenStorage.getAuthState() at mount and keeps it in sync via setAuthState().

Where and how tokens are stored
- Current implementation stores tokens in localStorage (persistent across tabs and browser restarts).
- Security implications:
  - Pros: Simple to implement, survives reloads.
  - Cons: Exposed to JavaScript; vulnerable to XSS exfiltration. Mitigate with strong CSP, input sanitization, no inline scripts, dependency hygiene.
- Alternatives (future):
  - sessionStorage for per-tab isolation (cleared on tab close).
  - HttpOnly, Secure, SameSite cookies for refresh token to minimize XSS token theft (recommended). Access token can remain in memory only.

How tokens are attached to API requests
- Login/Signup endpoints do not require Authorization header.
- For subsequent authenticated API calls, read the accessToken from AuthContext or tokenStorage and set header:
  - Authorization: Bearer <accessToken>
- Example (vanilla fetch):
  - const state = getAuthState();
  - const res = await fetch('/api/private/resource', { headers: { 'Authorization': `Bearer ${state.accessToken}` }});
- Note: There is no global HTTP client interceptor in this codebase yet; each call should attach the token explicitly or through a future shared http client.

Login flow (sequence)
1) User submits email/password in AuthPage.
2) useAuth.login -> AuthContext.login -> authService.login.
3) authService.login calls API POST /api/auth/login via authClient.login.
4) Backend returns accessToken, refreshToken, user, expiries.
5) authService persists them in tokenStorage (localStorage) and returns the new StoredAuthState.
6) AuthContext updates in-memory state and triggers onLoginSuccess (optional), enabling navigation to protected areas.

Signup flow (sequence)
1) User submits email/password in AuthPage (mode=signup).
2) useAuth.signup -> AuthContext.signup -> authService.signup.
3) authService.signup calls API POST /api/auth/signup via authClient.signup.
4) On success (201), UI can optionally auto-switch to login or prompt the user to login. No tokens are stored by signup itself.

Logout flow
- AuthContext.logout calls tokenStorage.clearAuthState(), resets state to { isAuthenticated: false, user: null }, and triggers onLogout (optional).
- Side effects: accessToken and refreshToken are removed from localStorage.
- Backend session revocation: not automatic in the current frontend. If required, call POST /api/auth/logout forwarding the refreshToken, then clear local state.

Adding protected routes
- Wrap route elements with ProtectedRoute so that only authenticated users can access them.
- Example (React Router v6 style):
  - <AuthProvider baseUrl="/api">
  -   <Routes>
  -     <Route path="/login" element={<AuthPage />} />
  -     <Route path="/dashboard" element={
  -       <ProtectedRoute>
  -         <Dashboard />
  -       </ProtectedRoute>
  -     } />
  -   </Routes>
  - </AuthProvider>
- ProtectedRoute should read from AuthContext and redirect to /login (or render a fallback) when state.isAuthenticated is false.

Configuration
- Base API URL: pass baseUrl to AuthProvider and useAuth (defaults to '/api'). Ensure backend is reachable at the same origin or handle CORS accordingly.
- Backend expectations:
  - POST /api/auth/signup: { email, password } -> { user }
  - POST /api/auth/login: { email, password } -> { accessToken, refreshToken, tokenType, user, ... }
  - Other protected endpoints expect Authorization: Bearer <accessToken>.

Error handling
- AuthContext exposes loading and error. AuthPage shows simple client-side validation and displays error codes from thrown API errors.
- API client (frontend/src/api/authClient.ts) throws on non-2xx and sets error message based on payload.error when present.

Security notes and best practices
- Never log tokens or sensitive user data.
- Prefer keeping access token lifetime short and perform refresh with rotation.
- Consider storing refresh token in HttpOnly+Secure cookie (server-set) to mitigate XSS, while keeping access token in memory only.
- Add a Content Security Policy (CSP) and avoid dangerous sinks (innerHTML).
- On 401/403 from protected API calls, trigger automatic logout or silent refresh depending on backend behavior.

Known limitations / TODO
- Implement centralized HTTP client with:
  - Authorization header injection based on current AuthContext/tokenStorage
  - Automatic access token refresh on 401/expired, using refresh token rotation
  - Request queuing during refresh, failure fallback to logout
- Store refresh token in HttpOnly cookie instead of localStorage when backend supports it; keep only non-sensitive state client-side.
- Implement token expiry checks (decode JWT exp) and proactive refresh before expiry or auto-logout when exp passed.
- Cross-tab sync: listen to storage events to propagate login/logout across tabs.
- Backend integration for logout/logoutAll endpoints to revoke refresh sessions.

Troubleshooting
- After changing auth behavior, clear browser storage for key demo.auth.state.
- Ensure JWT_SECRET and related backend env vars are configured; frontend relies on backend to issue valid tokens.
