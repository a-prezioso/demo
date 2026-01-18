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

Where and how tokens are used
- API clients attach Authorization: Bearer <accessToken> for protected endpoints.
- Refresh flow is currently backend-driven; frontend can call /auth/refresh when needed.

---

Desks dashboard integration

Overview
- The DashboardPage renders a 12-desk interactive map with colors by status.
- A centralized API client fetches the current desk states from the backend and the component updates reactively.

Files
- API client: frontend/src/api/desksClient.ts
  - export fetchDeskStatuses({ baseUrl, signal }) -> Promise<DeskStatusItem[]>
  - Automatically attaches Authorization header from tokenStorage.
  - Maps heterogeneous backend status values (e.g., available/occupied/libero/…) to the canonical frontend enum: 'free' | 'busy' | 'unavailable'.
  - Normalizes payload format, accepting arrays or objects like { desks: [...] } / { items: [...] }.
- Hook: frontend/src/components/Dashboard/useDesksData.ts
  - Manages data lifecycle (initial load + polling every 30s by default), debouncing concurrent requests and cancelling in-flight fetch on unmount.
  - Exposes { desks, loading, error, lastUpdated, refresh }.
- Component: frontend/src/components/Dashboard/DashboardPage.tsx
  - Uses useDesksData to render the map; shows error banner with manual retry button.
  - Accepts props: baseUrl, pollingMs for tuning.

Backend endpoint expectation
- GET /api/desks/status returns JSON with an array of desk states, either as plain array or wrapped (e.g., { desks: [...] }).
- Each item: { id: string; status: 'free' | 'busy' | 'unavailable' | vendor-specific }.
- Optional fields: name, x, y; if provided, they override default layout values on the client.

Polling and cancellation
- The hook sets up a setInterval at the chosen pollingMs (default 30000 ms).
- If a request is still pending when the interval ticks, the next fetch is skipped to avoid piling up.
- On unmount or dependency change, the in-flight request is aborted via AbortController.

Error handling and retry
- Network errors are captured and surfaced via error string; an alert is displayed with a "Riprova" button that triggers a manual refresh.

