import { AuthApiClientImpl } from '../authService';
import * as storage from '../../utils/tokenStorage';

const originalFetch = global.fetch;

describe('AuthApiClientImpl', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    jest.spyOn(storage, 'saveAuthTokens').mockImplementation(() => {});
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('calls login endpoint with correct payload and saves tokens', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'at', refreshToken: 'rt', user: { id: '1', email: 'a@b.c' } }),
    });

    const api = new AuthApiClientImpl('');
    const res = await api.login({ email: 'a@b.c', password: 'pw' });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.c', password: 'pw' }),
    }));
    expect(storage.saveAuthTokens).toHaveBeenCalledWith({ accessToken: 'at', refreshToken: 'rt', user: { id: '1', email: 'a@b.c' } });
    expect(res.accessToken).toBe('at');
  });

  it('propagates error message from failed response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    const api = new AuthApiClientImpl('');
    await expect(api.login({ email: 'a@b.c', password: 'pw' })).rejects.toThrow('Invalid credentials');
  });

  it('signup calls proper endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'at', refreshToken: 'rt', user: { id: '1', email: 'a@b.c' } }),
    });
    const api = new AuthApiClientImpl('');
    await api.signup({ email: 'a@b.c', password: 'pw' });
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
      method: 'POST',
    }));
  });
});
