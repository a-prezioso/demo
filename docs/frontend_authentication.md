# Frontend Authentication Architecture and Token Handling (PWA)

This document describes how authentication is implemented on the frontend, how tokens are stored and used, and how to add protected routes. It complements the backend specs in docs/auth_jwt.md and docs/auth_refresh_endpoint.md.

Contents
- Architecture overview (AuthContext, authClient, tokenStorage, ProtectedRoute, AppRouter)
- Token storage and security considerations
- Flows: login, signup, refresh, logout (sequence diagrams)
- Attaching tokens to API requests
- Adding protected routes (router snippets)
- Error handling and edge cases
- TODO / future improvements

---

## Architecture Overview

Main building blocks:

- AuthContext (src/client/context/AuthContext.jsx)
  - React context/provider that exposes user, isAuthenticated, loading, and actions: login, signup, refresh, logout.
  - Hydrates initial state from an existing, non-expired access token in storage.
  - On successful login/signup/refresh, persists tokens via tokenStorage and updates the user state (decoded from the access token payload).

- authClient (src/client/api/authClient.js)
  - Thin client for calling backend auth endpoints: POST /api/auth/login, /signup, /refresh, /logout.
  - On login/refresh success, persists tokens via tokenStorage.

- tokenStorage (src/client/storage/tokenStorage.js)
  - Simple storage utility (localStorage by default) to persist:
    - sd_access_token
    - sd_refresh_token
    - sd_access_expires_at (epoch ms)
  - Exposes helpers to set/get/clear tokens and to switch the backing storage (e.g., to sessionStorage) via setStorage().

- ProtectedRoute / PublicOnlyRoute (src/client/components/ProtectedRoute.jsx)
  - Route guards for React Router v6:
    - ProtectedRoute: if not authenticated, attempts a one-time silent refresh and redirects to /login if still unauthenticated.
    - PublicOnlyRoute: prevents authenticated users from visiting public pages (e.g., login/signup), optionally attempts a silent refresh to avoid flicker.

- AppRouter (src/client/components/AppRouter.jsx)
  - Example router wiring ProtectedRoute and PublicOnlyRoute with your application routes.

---

## Token Storage and Security Considerations

Where and how tokens are stored:
- By default, tokens are stored in localStorage via tokenStorage:
  - access token: sd_access_token
  - refresh token: sd_refresh_token
  - access token expiry: sd_access_expires_at (epoch ms)
- You can switch to sessionStorage or a custom storage by calling:
  - tokenStorage.setStorage(window.sessionStorage)

Implications and recommendations:
- localStorage is vulnerable to XSS: any injected script could read tokens. Keep your app free from XSS (strict Content Security Policy, no dangerous HTML, sanitize inputs).
- Consider migrating to httpOnly, secure cookies (set by the server) for refresh tokens to mitigate token theft via XSS. This requires CSRF protections on the server side when using cookies.
- Access tokens should remain short-lived (default ~15m) and be refreshed using the refresh token (default ~30d validity, rotation supported by backend).
- Never log tokens or sensitive data.

---

## Flows

### Login Flow

Logical sequence (simplified):

User -> LoginForm -> AuthContext.login -> authClient.login -> POST /api/auth/login
API -> validates credentials -> issues access+refresh tokens -> returns 200
AuthContext/authClient -> tokenStorage.setTokens -> decode access payload -> set user/isAuthenticated
App -> navigate to protected route (e.g., dashboard)

Key notes:
- On success, tokens are persisted; user is decoded from the access token payload (sub, email, roles).
- UI navigation after login can be handled by the caller (e.g., onSuccess) or by AppRouter logic.

### Signup Flow

User -> SignupForm -> AuthContext.signup -> authClient.signup -> POST /api/auth/signup
API -> creates user -> returns 201/200
AuthContext.signup -> calls authClient.login with same credentials -> persists tokens -> set user
App -> navigate to protected route

### Refresh Flow

Trigger points:
- ProtectedRoute attempts a silent refresh when a route is accessed and the user is not yet authenticated but a refresh token exists.
- AuthContext.refresh checks if access token is missing/expired, then calls authClient.refresh({ rotate: true }).

Sequence:
Client -> POST /api/auth/refresh { rotate: true }
API -> validates refresh session -> issues new access token (and rotated refresh token if rotate=true)
Client -> tokenStorage.setTokens -> update user/isAuthenticated

### Logout Flow

User -> logout action -> AuthContext.logout -> authClient.logout -> POST /api/auth/logout
API -> revokes current refresh session (server-side)
Client -> tokenStorage.clearTokens -> clear user state -> redirect to public route

Notes:
- Even if the server logout fails, the client clears tokens to avoid a stuck session.

---

## Attaching Tokens to API Requests

Protected backend endpoints require the Authorization header:
- Authorization: Bearer <accessToken>

You can retrieve the current access token via tokenStorage or from AuthContext:

Example (fetch):

```js
const tokenStorage = require("../src/client/storage/tokenStorage");

async function getProfile() {
  const at = tokenStorage.getAccessToken();
  const res = await fetch("/api/private/me", {
    headers: { Authorization: `Bearer ${at}` },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}
```

Optionally, add an interceptor layer to your HTTP client to:
- Automatically attach Authorization when a token exists
- Detect 401 responses and attempt a one-time refresh before retrying

---

## Adding Protected Routes

Wrap your app with AuthProvider and use ProtectedRoute/PublicOnlyRoute with React Router v6:

```jsx
// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
const { AuthProvider } = require("../src/client/context/AuthContext.jsx");
const { ProtectedRoute, PublicOnlyRoute } = require("../src/client/components/ProtectedRoute.jsx");
const AuthPage = require("../src/client/components/AuthPage.jsx");

function Dashboard() {
  return <div>Dashboard</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public login/signup page, hidden for authenticated users */}
          <Route element={<PublicOnlyRoute defaultRedirect="/dashboard" />}> 
            <Route path="/login" element={<AuthPage />} />
          </Route>

          {/* Protected application routes */}
          <Route element={<ProtectedRoute redirectTo="/login" />}> 
            <Route path="/dashboard" element={<Dashboard />} />
            {/* add more protected routes here */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<div>Not found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

Notes:
- ProtectedRoute attempts a silent refresh once if the user is not yet authenticated.
- PublicOnlyRoute prevents showing the login page when the user is already authenticated.

---

## Error Handling and Edge Cases

- Expired access token:
  - AuthContext.refresh will request a new access token using the refresh token and update storage/state.
  - ProtectedRoute triggers this once when entering a protected route.

- Missing or invalid refresh token:
  - Silent refresh will fail; user is redirected to /login.

- Race conditions on refresh:
  - The current implementation keeps it simple; you may want to prevent parallel refresh calls (e.g., a shared in-flight promise) to avoid multiple rotations.

- Token decoding:
  - The frontend only decodes the JWT payload for UX state; no signature verification is performed client-side. Never trust claims beyond display/navigation purposes.

---

## TODO / Future Improvements

- Store refresh tokens in httpOnly, secure cookies set by the server to mitigate XSS risks; add CSRF protections accordingly.
- Implement an HTTP client layer with:
  - Automatic Authorization header injection
  - Centralized 401 handling with single-flight refresh and retry
- Proactive refresh shortly before access token expiry to reduce edge 401s (e.g., renew when <60s remaining).
- Cross-tab synchronization (e.g., BroadcastChannel or storage events) to keep logout/login consistent across browser tabs.
- Optional encryption or obfuscation of tokens in storage (note: does not protect against XSS with full JS execution).
- Graceful token rotation handling and session listing/management UI (logout from other devices, etc.).
- Configurable redirect hooks after login/logout/signup/refresh.

---

## Backend Alignment (for reference)

Endpoints used by the frontend:
- POST /api/auth/signup -> creates user
- POST /api/auth/login -> returns { accessToken, refreshToken, tokenType: "Bearer", expiresIn, user? }
- POST /api/auth/refresh -> returns { accessToken, refreshToken?, tokenType, expiresIn } depending on rotation
- POST /api/auth/logout -> revokes the current refresh session

Protected API usage requires:
- Header: Authorization: Bearer <accessToken>

See also:
- docs/auth_jwt.md
- docs/auth_refresh_endpoint.md
