// Token storage wrapper for client-side apps
// IMPORTANT SECURITY NOTE:
// - For maximum security, tokens should be managed by the server using HttpOnly, Secure cookies
//   to mitigate XSS risks. This demo stores tokens in localStorage as a temporary solution.
// - Ensure CSP, sanitize inputs, and consider migrating to cookie-based storage in production.

export type StoredUser = { id: string; email: string } | null;
export type StoredAuthState = {
  isAuthenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: StoredUser;
};

const AUTH_KEY = 'auth';

export function getAuthState(): StoredAuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { isAuthenticated: false };
    const parsed = JSON.parse(raw);
    // Basic shape validation
    return {
      isAuthenticated: !!parsed?.isAuthenticated && !!parsed?.accessToken,
      accessToken: typeof parsed?.accessToken === 'string' ? parsed.accessToken : undefined,
      refreshToken: typeof parsed?.refreshToken === 'string' ? parsed.refreshToken : undefined,
      user:
        parsed?.user && typeof parsed.user === 'object'
          ? { id: String(parsed.user.id || ''), email: String(parsed.user.email || '') }
          : null,
    } as StoredAuthState;
  } catch {
    return { isAuthenticated: false };
  }
}

export function setAuthState(state: StoredAuthState): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

export function clearAuthState(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    /* noop */
  }
}

export function getAccessToken(): string | null {
  const s = getAuthState();
  return s && s.accessToken ? s.accessToken : null;
}

export function getRefreshToken(): string | null {
  const s = getAuthState();
  return s && s.refreshToken ? s.refreshToken : null;
}
