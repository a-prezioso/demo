import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    (global as any).localStorage = {
      setItem: (k: string, v: string) => { store[k] = String(v); },
      getItem: (k: string) => (k in store ? store[k] : null),
      removeItem: (k: string) => { delete store[k]; },
    };
  });

  it('initializes from empty storage as unauthenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessToken).toBeNull();
  });

  it('setAuth updates state and logout clears it', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.setAuth({ accessToken: 'A', refreshToken: 'R', user: { id: '1', email: 'a@b.c' } });
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.accessToken).toBe('A');
    expect(result.current.user).toEqual({ id: '1', email: 'a@b.c' });

    act(() => {
      result.current.logout();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
