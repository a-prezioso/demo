import { saveAuthTokens, getAccessToken, getRefreshToken, getStoredUser, clearAuthTokens } from '../tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    // simple localStorage mock
    (global as any).localStorage = {
      setItem: (k: string, v: string) => { store[k] = String(v); },
      getItem: (k: string) => (k in store ? store[k] : null),
      removeItem: (k: string) => { delete store[k]; },
    };
  });

  it('saves and reads tokens', () => {
    saveAuthTokens({ accessToken: 'A', refreshToken: 'R', user: { id: '1', email: 'a@b.c' } });
    expect(getAccessToken()).toBe('A');
    expect(getRefreshToken()).toBe('R');
    expect(getStoredUser()).toEqual({ id: '1', email: 'a@b.c' });
  });

  it('clears tokens', () => {
    saveAuthTokens({ accessToken: 'A', refreshToken: 'R', user: { id: '1', email: 'a@b.c' } });
    clearAuthTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('handles storage errors gracefully', () => {
    (global as any).localStorage = {
      setItem: () => { throw new Error('disallowed'); },
      getItem: () => { throw new Error('disallowed'); },
      removeItem: () => { throw new Error('disallowed'); },
    };
    expect(() => saveAuthTokens({ accessToken: 'A', refreshToken: 'R' })).not.toThrow();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
    expect(() => clearAuthTokens()).not.toThrow();
  });
});
