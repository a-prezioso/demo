Auth UI Components

This folder introduces a minimal set of React components to handle Login and Signup flows for the PWA.

Components
- AuthPage: a combined page with tabs to switch between Login and Signup
- LoginForm: reusable login form with validation, loading state, and backend error handling
- SignupForm: reusable signup form with validation, loading state, and backend error handling

Token Handling
- A lightweight helper in src/lib/authToken.ts stores access/refresh tokens in localStorage
- saveTokens: persist tokens and approximate access token expiry
- getAccessToken / getRefreshToken / isAuthenticated / clearTokens

API Assumptions
- POST /api/auth/login: returns { success, data: { accessToken, tokenType: 'Bearer', expiresIn, refreshToken, user } }
- POST /api/auth/signup: returns { success, data: { id, email, status, createdAt, updatedAt } }

Styling & i18n
- Inline styles kept minimal to avoid coupling; replace with your design system if present
- A tiny t() shim is used; integrate with your i18n solution by swapping the function

Usage

import { AuthPage } from './src/components/auth';

// In your router
<Route path="/auth" element={<AuthPage apiBaseUrl="" />} />

// Or use forms separately
<LoginForm apiBaseUrl="" onSuccess={(data) => {/* navigate to home, update context, etc. */}} />
<SignupForm apiBaseUrl="" onSuccess={() => {/* show message or switch tab */}} />

Security Note
- Never log plaintext passwords or token values in the console or analytics.
