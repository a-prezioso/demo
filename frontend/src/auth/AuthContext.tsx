import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AuthTokens,
  StoredUser,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveAuthTokens,
} from '../utils/tokenStorage';

export interface AuthContextValue {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: StoredUser | null;
  setAuth: (tokens: AuthTokens) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);

  // Initialize from storage (supports page refresh persistence)
  useEffect(() => {
    const at = getAccessToken();
    const rt = getRefreshToken();
    const u = getStoredUser();
    if (at && rt) {
      setAccessToken(at);
      setRefreshToken(rt);
      setUser(u);
    }
  }, []);

  // Expose helpers
  const setAuth = useCallback((tokens: AuthTokens) => {
    // Persist first, then update state
    saveAuthTokens(tokens);
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setUser(tokens.user || null);
  }, []);

  const logout = useCallback(() => {
    clearAuthTokens();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: Boolean(accessToken && refreshToken),
    accessToken,
    refreshToken,
    user,
    setAuth,
    logout,
  }), [accessToken, refreshToken, user, setAuth, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Strict hook (requires provider)
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

// Optional hook (returns undefined if no provider is present), useful for library components
export const useAuthOptional = (): AuthContextValue | undefined => useContext(AuthContext);
