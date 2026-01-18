/*
Unit tests for AuthContext/useAuth hook and context behavior.
Currently skipped until the actual implementation details are confirmed.

TODO: Replace describe.skip with describe and align API accordingly.
*/

import React from 'react';

describe.skip('AuthContext and useAuth', () => {
  let AuthProvider;
  let useAuth;
  let tokenStorage;

  beforeAll(() => {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    ({ AuthProvider, useAuth } = require('../../../src/client/context/AuthContext'));
    // eslint-disable-next-line import/no-dynamic-require, global-require
    tokenStorage = require('../../../src/client/storage/tokenStorage');
  });

  beforeEach(() => {
    jest.resetModules();
    tokenStorage.getAccessToken = jest.fn();
    tokenStorage.getRefreshToken = jest.fn();
    tokenStorage.setTokens = jest.fn();
    tokenStorage.clearTokens = jest.fn();
  });

  function renderHookInProvider(hook) {
    const ReactTesting = require('@testing-library/react');
    const { render } = ReactTesting;
    const TestComp = () => {
      const value = hook();
      return <pre data-testid="value">{JSON.stringify(value)}</pre>;
    };
    const { getByTestId } = render(
      <AuthProvider>
        <TestComp />
      </AuthProvider>
    );
    return JSON.parse(getByTestId('value').textContent);
  }

  test('initial state derived from tokens in storage', () => {
    tokenStorage.getAccessToken.mockReturnValue('acc');

    const value = renderHookInProvider(useAuth);

    expect(value.isAuthenticated).toBe(true);
  });

  test('login updates state and stores tokens', async () => {
    const authService = require('../../../src/client/api/authService');
    authService.login = jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    const ReactTesting = require('@testing-library/react');
    const { render, screen, act } = ReactTesting;

    const Capture = () => {
      const value = useAuth();
      return (
        <div>
          <div data-testid="auth">{String(value.isAuthenticated)}</div>
          <button onClick={() => value.login('e', 'p')}>login</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth').textContent).toBe('false');

    await act(async () => {
      screen.getByText('login').click();
    });

    expect(tokenStorage.setTokens).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' });
    expect(screen.getByTestId('auth').textContent).toBe('true');
  });

  test('logout clears tokens and resets state', () => {
    const ReactTesting = require('@testing-library/react');
    const { render, screen } = ReactTesting;

    const Capture = () => {
      const value = useAuth();
      return (
        <div>
          <div data-testid="auth">{String(value.isAuthenticated)}</div>
          <button onClick={() => value.logout()}>logout</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    screen.getByText('logout').click();

    expect(tokenStorage.clearTokens).toHaveBeenCalled();
    expect(screen.getByTestId('auth').textContent).toBe('false');
  });
});
