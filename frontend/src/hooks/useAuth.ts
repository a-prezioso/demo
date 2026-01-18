import { useCallback, useMemo, useState } from 'react';
import { login as apiLogin, signup as apiSignup, type LoginSuccessResponse } from '../api/authClient';

export type AuthState = {
  isAuthenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: { id: string; email: string } | null;
};

function loadFromStorage(): AuthState {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) return { isAuthenticated: false };
    const parsed = JSON.parse(raw);
    return { isAuthenticated: !!parsed?.accessToken, ...parsed } as AuthState;
  } catch {
    return { isAuthenticated: false };
  }
}

function persist(state: AuthState) {
  try {
    localStorage.setItem('auth', JSON.stringify(state));
  } catch {}
}

export function useAuth(baseUrl = '/api') {
  const [state, setState] = useState<AuthState>(() => loadFromStorage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAndPersist = useCallback((next: AuthState) => {
    setState(next);
    persist(next);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const res: LoginSuccessResponse = await apiLogin({ email, password }, { baseUrl });
        const next: AuthState = {
          isAuthenticated: true,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          user: res.user,
        };
        setAndPersist(next);
        return next;
      } catch (e: any) {
        const status = e?.status as number | undefined;
        const code = e?.payload?.error as string | undefined;
        if (status === 401) setError('invalid_credentials');
        else if (status === 409) setError('email_already_registered');
        else if (code) setError(code);
        else setError('network_error');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, setAndPersist],
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        await apiSignup({ email, password }, { baseUrl });
        // After signup, optionally auto-login; for now we require explicit login
        return true;
      } catch (e: any) {
        const status = e?.status as number | undefined;
        const code = e?.payload?.error as string | undefined;
        if (status === 409) setError('email_already_registered');
        else if (code) setError(code);
        else setError('network_error');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl],
  );

  const logout = useCallback(() => {
    const next: AuthState = { isAuthenticated: false, accessToken: undefined, refreshToken: undefined, user: null };
    setAndPersist(next);
  }, [setAndPersist]);

  return useMemo(
    () => ({
      state,
      loading,
      error,
      login,
      signup,
      logout,
    }),
    [state, loading, error, login, signup, logout],
  );
}
