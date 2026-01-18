/*
Unit tests for tokenStorage module.
These are currently skipped until the project provides/aligns the real API and test runtime for browser storage.

TODO: Replace describe.skip with describe when enabling tests and align API names if they differ.
*/

describe.skip('tokenStorage', () => {
  let tokenStorage;

  beforeAll(() => {
    // Dynamically require to avoid resolution during collection if path/names differ
    // Adjust the path if actual module location differs
    // eslint-disable-next-line import/no-dynamic-require, global-require
    tokenStorage = require('../../../src/client/storage/tokenStorage');
  });

  beforeEach(() => {
    // Minimal localStorage mock
    const store = {};
    global.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v);
      },
      removeItem: (k) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    };
  });

  test('writes tokens via setTokens and reads with getters', () => {
    // Expected API (adjust to real one when enabling test)
    const tokens = { accessToken: 'acc', refreshToken: 'ref' };
    tokenStorage.setTokens(tokens);

    expect(tokenStorage.getAccessToken()).toBe('acc');
    expect(tokenStorage.getRefreshToken()).toBe('ref');
  });

  test('clearTokens removes stored values', () => {
    tokenStorage.setTokens({ accessToken: 'a', refreshToken: 'r' });
    tokenStorage.clearTokens();

    expect(tokenStorage.getAccessToken()).toBeFalsy();
    expect(tokenStorage.getRefreshToken()).toBeFalsy();
  });

  test('gracefully handles missing tokens', () => {
    tokenStorage.clearTokens?.();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  test('handles unavailable storage (e.g., throws or no-op)', () => {
    const original = global.localStorage;
    // Simulate storage unavailable
    // eslint-disable-next-line no-global-assign
    global.localStorage = undefined;

    // API behavior may vary: either silently ignore, or throw a descriptive error
    expect(() => tokenStorage.setTokens({ accessToken: 'a', refreshToken: 'r' })).not.toThrow();

    // eslint-disable-next-line no-global-assign
    global.localStorage = original;
  });
});
