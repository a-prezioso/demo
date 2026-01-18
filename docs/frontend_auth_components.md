Frontend React auth components

Overview
- This repository now includes minimal, framework-agnostic React components and utilities to integrate with the existing backend auth endpoints.
- Components: AuthPage (combined login/signup), LoginForm, SignupForm.
- Utilities: tokenStorage (localStorage-based), authClient (fetch-based API client).

Paths
- src/client/components/AuthPage.jsx
- src/client/components/LoginForm.jsx
- src/client/components/SignupForm.jsx
- src/client/api/authClient.js
- src/client/storage/tokenStorage.js
- src/client/index.js

Usage
- Import from src/client (or publish these under your app bundler alias):
  const { components, api, storage } = require("../src/client");
  const { AuthPage, LoginForm, SignupForm } = components;

- AuthPage example:
  <AuthPage onAuthenticated={(user, { accessToken }) => {
    // Navigate to home/dashboard and set auth context
  }}/>

- LoginForm/SignupForm can be used individually if you manage navigation/tabs yourself:
  <LoginForm onSuccess={(user, res) => { /* ... */ }} />

Token handling
- After successful login (or auto-login post-signup), tokens are persisted via tokenStorage in localStorage:
  - sd_access_token
  - sd_refresh_token
  - sd_access_expires_at (epoch ms)
- You can replace the storage by calling tokenStorage.setStorage(customStorage) to use sessionStorage or a secure wrapper.

Refreshing tokens
- Use api.auth.refresh() when access token is expired (check via storage.tokenStorage.isAccessTokenExpired()).

Internationalization
- AuthPage includes a minimal i18n stub (Italian/English). Replace with your i18n system by forking the component or injecting labels into LoginForm/SignupForm.

Styling
- Components render with simple class names (sd-*) to allow styling integration. Provide CSS in your app.
