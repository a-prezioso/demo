/*
Unit tests for authService module.
These tests are currently skipped until API paths and shapes are validated.

TODO: Replace describe.skip with describe when enabling tests and align API paths/payload keys.
*/

describe.skip('authService', () => {
  let authService;
  let tokenStorage;

  beforeAll(() => {
    // Dynamic requires to avoid hard failures if paths differ prior to enabling
    // eslint-disable-next-line import/no-dynamic-require, global-require
    authService = require('../../../src/client/api/authService');
    // eslint-disable-next-line import/no-dynamic-require, global-require
    tokenStorage = require('../../../src/client/storage/tokenStorage');
  });

  beforeEach(() => {
    // Mock global fetch
    global.fetch = jest.fn();

    // Mock token storage methods
    tokenStorage.setTokens = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const okResponse = (data) => ({
    ok: true,
    status: 200,
    json: async () => data,
  });

  const errorResponse = (status = 400, data = { message: 'Bad Request' }) => ({
    ok: false,
    status,
    json: async () => data,
  });

  test('login posts to /api/auth/login with correct payload and stores tokens', async () => {
    const tokens = { accessToken: 'acc', refreshToken: 'ref' };
    fetch.mockResolvedValueOnce(okResponse(tokens));

    const result = await authService.login({ email: 'a@b.com', password: 'pw' });

    expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email: 'a@b.com', password: 'pw' }),
    }));

    expect(tokenStorage.setTokens).toHaveBeenCalledWith(tokens);
    expect(result).toEqual(tokens);
  });

  test('signup posts to /api/auth/signup with correct payload and stores tokens', async () => {
    const tokens = { accessToken: 'acc', refreshToken: 'ref' };
    fetch.mockResolvedValueOnce(okResponse(tokens));

    const result = await authService.signup({ email: 'a@b.com', password: 'pw' });

    expect(fetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email: 'a@b.com', password: 'pw' }),
    }));

    expect(tokenStorage.setTokens).toHaveBeenCalledWith(tokens);
    expect(result).toEqual(tokens);
  });

  test('propagates API error messages for 400/401', async () => {
    fetch.mockResolvedValueOnce(errorResponse(401, { message: 'Invalid credentials' }));

    await expect(authService.login({ email: 'x', password: 'y' }))
      .rejects.toThrow(/Invalid credentials/i);
  });
});
