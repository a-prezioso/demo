Frontend scaffolding for SmartDesk PWA

This folder contains minimal React components and hooks for authentication UI.

Components
- AuthPage: combined login/signup screen with basic client-side validation, loading states, and backend error handling. It accepts optional i18n function and onSuccess callback.

Hooks
- useAuth: manages local auth state in localStorage and exposes login/signup/logout functions.

API Client
- authClient.ts: small fetch-based client for /auth/login and /auth/signup endpoints.

Integration
- Import AuthPage and mount it in your router. Example:

import { AuthPage } from './src/components/Auth';

<AuthPage baseUrl="/api" onSuccess={() => navigate('/')} i18n={(k) => translations[k] || k} />

Notes
- The API baseUrl defaults to '/api'. Adjust based on your backend routing.
- Error messages use error codes; provide i18n mapping for user-friendly texts.
