Auth context and client integration

Overview
- This project includes a lightweight React AuthContext to keep authentication state on the client and integrate with the backend auth endpoints already implemented in this repo.
- Files:
  - src/client/context/AuthContext.jsx: React Context + Provider + hook (useAuth)
  - src/client/api/httpClient.js: fetch wrapper that auto-attaches Authorization header and retries once on 401 with refresh()
  - src/client/utils/jwt.js: minimal client-side JWT payload decoder to hydrate state (no verification)
  - src/client/index.js: exposes context, utils and api on a single entry

Behavior
- Tokens are persisted via src/client/storage/tokenStorage.js (localStorage by default). A custom storage (e.g., sessionStorage) can be injected with tokenStorage.setStorage(custom).
- On app start, AuthProvider attempts to hydrate state from a non-expired access token. If expired, useAuth().refresh() can be called lazily or httpClient will attempt a single refresh on 401.
- login(email, password) and signup(email, password) call backend via api/authClient.js and update tokens + user state. signup auto-logs-in after successful registration.
- logout() revokes the refresh session via backend (best-effort) and clears all tokens and user state on the client.

Security notes
- Storing tokens in localStorage exposes them to XSS. For production, prefer httpOnly, Secure, SameSite cookies set by the backend for refresh token (and possibly a short-lived access token via Authorization header or cookie). This demo keeps tokens in localStorage for simplicity.
- The client-side JWT decode used to hydrate state does not validate signatures; it is only used for UX. The server is the source of truth.

Usage example
- Wrap your app with AuthProvider:

  const React = require("react");
  const { AuthProvider, useAuth } = require("../src/client/context/AuthContext.jsx");

  function App() {
    const { isAuthenticated, user, login, logout } = useAuth();
    // ...
  }

- Alternatively, import from the public client entry:

  const { context } = require("../src/client");
  const { AuthProvider, useAuth } = context;

- Making protected API calls:

  const { api } = require("../src/client");
  const { request } = api.http;
  const data = await request("/api/private/me");

