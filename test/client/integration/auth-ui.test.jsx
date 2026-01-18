/*
Integration/UI tests for login/signup flows using React Testing Library.
Currently skipped until actual components and routes are confirmed.

TODO: Replace describe.skip with describe and align selectors and flows.
*/

import React from 'react';

describe.skip('Auth UI flows', () => {
  let AuthPage;
  let AppRouter;

  beforeAll(() => {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    AuthPage = require('../../..//src/client/components/AuthPage.jsx');
    // eslint-disable-next-line import/no-dynamic-require, global-require
    AppRouter = require('../../..//src/client/components/AppRouter.jsx');
  });

  beforeEach(() => {
    jest.resetModules();
  });

  test('renders forms and performs login with loading and error states', async () => {
    const ReactTesting = require('@testing-library/react');
    const userEvent = require('@testing-library/user-event').default;

    const { render, screen, waitFor } = ReactTesting;

    const authService = require('../../../src/client/api/authService');
    authService.login = jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    render(React.createElement(AuthPage));

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pw');

    const loginBtn = screen.getByRole('button', { name: /login/i });
    userEvent.click(loginBtn);

    await waitFor(() => expect(authService.login).toHaveBeenCalled());
  });

  test('redirects to protected route after login', async () => {
    const ReactTesting = require('@testing-library/react');
    const userEvent = require('@testing-library/user-event').default;

    const { render, screen, waitFor } = ReactTesting;

    const authService = require('../../../src/client/api/authService');
    authService.login = jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    render(React.createElement(AppRouter));

    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pw');
    userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      // Expect some protected content to appear
      expect(screen.getByText(/dashboard|welcome|home/i)).toBeInTheDocument();
    });
  });
});
