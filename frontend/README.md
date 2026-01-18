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
- accessToken: set as Authorization: Bearer on API client when calling protected resources
- refreshToken: used only by authService when handling refresh flow (not exposed to UI components)

---

Desk booking flow (UI)

- DashboardPage: users can tap a free desk to open BookingConfirmationDialog.
- BookingConfirmationDialog: shows desk id/name and selected date; on confirm triggers an async booking action.

Integration points
- bookingClient (frontend/src/api/bookingClient.ts): service facade for creating bookings.
  - Tries POST /desks/{deskId}/book with body { date: 'YYYY-MM-DD' }.
  - If 404, tries POST /bookings with body { deskId, date, userId? }.
  - If both fail or network error: returns a stubbed successful response so the UI flow remains testable.
- DashboardPage integrates bookingClient in handleConfirm:
  - Passes deskId, date, and userId from AuthContext (for stub only; backend should infer from access token).
  - On success: closes popup and refreshes desk statuses.
  - On error: shows an inline error in dialog title and keeps the popup open.

Expected backend API (proposal)
- POST /api/desks/{deskId}/book
  - Auth: Bearer access token required
  - Body: { date: 'YYYY-MM-DD' }
  - Response: { bookingId: string, status: 'confirmed' | 'pending', deskId: string, date: string }
  - Errors:
    - 400 invalid_input (invalid date)
    - 404 desk_not_found
    - 409 desk_already_booked
    - 401 unauthorized

Notes
- The stub path is temporary and can be removed once the backend endpoint is available.
- The UI refreshes desk status after booking so the booked desk flips to busy/occupied state.
