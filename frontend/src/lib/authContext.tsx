import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearTokens, getStoredTokens, isAuthenticated, saveTokens } from './authToken';
import { AuthService, LoginResponse, SignupResponse } from './authService';

export interface AuthState {
  authenticated: boolean;
  user: { id: string; email: string } | null;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ apiBaseUrl?: string; children: React.ReactNode }> = ({ apiBaseUrl = '', children }) => {
  const [state, setState] = useState<AuthState>({ authenticated: isAuthenticated(), user: null });
  const service = useMemo(() => new AuthService({ apiBaseUrl }), [apiBaseUrl]);

  useEffect(() => {
    const tokens = getStoredTokens();
    if (tokens) {
      setState((s) => ({ ...s, authenticated: true }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await service.login(email, password);
    if (!res.success || !res.data) throw new Error(res.error?.message || 'login_failed');
    const data = res.data as LoginResponse;
    saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn });
    setState({ authenticated: true, user: { id: data.user.id, email: data.user.email } });
  }, [service]);

  const signup = useCallback(async (email: string, password: string) => {
    const res = await service.signup(email, password);
    if (!res.success || !res.data) throw new Error(res.error?.message || 'signup_failed');
    const data = res.data as SignupResponse;
    // After signup, stay unauthenticated until login
    setState((s) => ({ ...s, authenticated: false }));
    return data;
  }, [service]);

  const logout = useCallback(() => {
    clearTokens();
    setState({ authenticated: false, user: null });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ ...state, login, signup, logout }), [state, login, signup, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
