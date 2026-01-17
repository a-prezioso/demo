Frontend Auth Integration Notes

- This frontend includes a minimal auth integration layer:
  - apiConfig.ts to resolve API base URL and flags.
  - httpClient.ts to perform JSON requests and attach Authorization header when auth=true.
  - tokenStorage.ts for storing access and refresh tokens when httpOnly cookies are not yet configured. This is a temporary solution and has XSS trade-offs. Prefer server-set httpOnly cookies for refresh tokens.
  - authService.ts with login, signup, and logout functions that persist tokens.
  - AuthContext.tsx to expose auth state and actions via React Context and a useAuth hook.
  - authInterceptor.ts to retry a request after attempting refresh on 401.

Usage:
- Wrap your app with <AuthProvider>.
- Call useAuth() in components to access isAuthenticated, user, login, signup, logout.
- Use httpRequest(path, { auth: true, method: 'GET' }) for protected endpoints.

Configuration:
- Set VITE_API_BASE_URL or REACT_APP_API_BASE_URL to point to your backend, default is same-origin /api.
- Set VITE_AUTH_REFRESH_HTTP_ONLY=true to rely on httpOnly cookies for refresh.
- Set VITE_TOKEN_STORAGE=local|session to choose storage.
