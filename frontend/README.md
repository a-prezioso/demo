SmartDesk Frontend Components

This package exposes reusable React components for authentication screens (login and signup) and utilities.

Components:
- AuthPage: combined login/signup screen with tabs and default API client wired to backend endpoints.
- LoginForm: standalone login form with client-side validation and error handling.
- SignupForm: standalone signup form with password confirmation and policy hint.

Utilities:
- i18n: minimal dictionary-based i18n with Italian (default) and English.
- validation: client-side email and password checks aligned with backend policy.
- tokenStorage: helper to persist access/refresh tokens in localStorage.

Usage example:

import React from 'react';
import { AuthPage } from 'smartdesk-frontend';
import { saveAuthTokens } from 'smartdesk-frontend/dist/utils/tokenStorage';

export default function AuthScreen() {
  return (
    <AuthPage
      onAuthSuccess={({ accessToken, refreshToken, user }) => {
        saveAuthTokens({ accessToken, refreshToken, user });
        // navigate to app home
      }}
    />
  );
}

API endpoints expected:
- POST /api/auth/login { email, password } -> { accessToken, refreshToken, tokenType, expiresIn, refreshExpiresIn, user }
- POST /api/auth/signup { email, password } -> { id, email, status, createdAt, updatedAt }

Note: The package does not include routing; integrate with your app router. The UI uses inline styles to avoid external dependencies and is mobile-responsive by default.
