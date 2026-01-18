// Simple token storage utilities for the PWA
// IMPORTANT: never log token values

export interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  // epoch millis when access token expires (approximate)
  accessTokenExpiresAt?: number;
}

const ACCESS_KEY = 'auth.accessToken';
const REFRESH_KEY = 'auth.refreshToken';
const ACCESS_EXP_KEY = 'auth.accessToken.expiresAt';

function safeStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // ignore
  }
  return null;
}

export function saveTokens(tokens: { accessToken: string; refreshToken?: string; expiresIn?: number }): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.setItem(ACCESS_KEY, tokens.accessToken);
    if (tokens.refreshToken) store.setItem(REFRESH_KEY, tokens.refreshToken);
    if (typeof tokens.expiresIn === 'number' && tokens.expiresIn > 0) {
      const expAt = Date.now() + tokens.expiresIn * 1000 - 5000; // small skew
      store.setItem(ACCESS_EXP_KEY, String(expAt));
    }
  } catch {
    // ignore write failures
  }
}

export function getAccessToken(): string | null {
  const store = safeStorage();
  if (!store) return null;
  try {
    return store.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  const store = safeStorage();
  if (!store) return null;
  try {
    return store.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.removeItem(ACCESS_KEY);
    store.removeItem(REFRESH_KEY);
    store.removeItem(ACCESS_EXP_KEY);
  } catch {
    // ignore
  }
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  const store = safeStorage();
  if (!store) return true; // assume authenticated in non-browser contexts
  const expStr = store.getItem(ACCESS_EXP_KEY);
  if (!expStr) return true; // no info, assume valid
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp)) return true;
  return Date.now() < exp;
}

export function getStoredTokens(): StoredTokens | null {
  const accessToken = getAccessToken();
  if (!accessToken) return null;
  const refreshToken = getRefreshToken() ?? undefined;
  const store = safeStorage();
  const expStr = store?.getItem(ACCESS_EXP_KEY) ?? undefined;
  const accessTokenExpiresAt = expStr ? parseInt(expStr, 10) : undefined;
  return { accessToken, refreshToken, accessTokenExpiresAt };
}
