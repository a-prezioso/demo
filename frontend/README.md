SmartDesk Frontend Components

This package exposes reusable React components for authentication screens (login and signup) and utilities.

Components:
- AuthPage: combined login/signup screen with tabs and default API client wired to backend endpoints.
- LoginForm: standalone login form with client-side validation and error handling.
- SignupForm: standalone signup form with password confirmation and policy hint.
- AuthProvider/AuthContext: app-wide auth state with persistence to localStorage (access/refresh tokens + user).
- ProtectedRoute and helpers: router-agnostic guards to protect private pages and redirect flows.

Utilities:
- i18n: minimal dictionary-based i18n with Italian (default) and English.
- validation: client-side email and password checks aligned with backend policy.
- tokenStorage: helper to persist access/refresh tokens in localStorage.

Usage example:

import React from 'react';
import { AuthPage, AuthProvider, WithAuthGuard, IfAuthenticatedRedirect } from 'smartdesk-frontend';
import { saveAuthTokens } from 'smartdesk-frontend/dist/utils/tokenStorage';

export default function App() {
  return (
    <AuthProvider>
      {/* Example router-agnostic usage */}
      <IfAuthenticatedRedirect element={<AuthPage />} to="/app" />
    </AuthProvider>
  );
}

// Example with react-router (v6):
// import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
// const Redirector = ({ to }: { to: string }) => <Navigate to={to} replace />;
// function AppRouter() {
//   const navigate = useNavigate();
//   return (
//     <AuthProvider>
//       <Routes>
//         <Route path="/login" element={<IfAuthenticatedRedirect element={<AuthPage navigate={navigate} redirectTo="/app" />} to="/app" Redirector={Redirector} />} />
//         <Route path="/app" element={<WithAuthGuard element={<Dashboard />} toLogin="/login" Redirector={Redirector} />} />
//       </Routes>
//     </AuthProvider>
//   );
// }

API endpoints expected:
- POST /api/auth/login { email, password } -> { accessToken, refreshToken, tokenType, expiresIn, refreshExpiresIn, user }
- POST /api/auth/signup { email, password } -> { id, email, status, createdAt, updatedAt }

Notes:
- AuthProvider initializes from localStorage to keep session after refresh.
- ProtectedRoute/WithAuthGuard components are router-agnostic; provide a Redirector compatible with your router.
- AuthPage accepts a navigate callback to programmatically redirect after successful login/signup.
