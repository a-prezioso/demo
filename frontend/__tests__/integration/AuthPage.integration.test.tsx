import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthPage } from '../../src/components/auth/AuthPage';
import { AuthProvider } from '../../src/auth/AuthContext';

jest.mock('../../src/api/authService', () => {
  return {
    AuthApiClientImpl: class {
      async login({ email, password }: any) {
        if (email === 'fail@example.com') {
          const e: any = new Error('Invalid credentials');
          e.status = 401;
          throw e;
        }
        return { accessToken: 'at', refreshToken: 'rt', user: { id: '1', email } };
      }
      async signup({ email, password }: any) {
        if (email === 'exists@example.com') {
          const e: any = new Error('Email already exists');
          e.status = 400;
          throw e;
        }
        return { accessToken: 'at', refreshToken: 'rt', user: { id: '1', email } };
      }
    },
  };
});

describe('AuthPage integration', () => {
  it('renders forms and performs login flow', async () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    const email = screen.getByLabelText(/email/i);
    const password = screen.getByLabelText(/password/i);
    const loginBtn = screen.getByRole('button', { name: /login/i });

    fireEvent.change(email, { target: { value: 'user@example.com' } });
    fireEvent.change(password, { target: { value: 'Secret123!' } });
    fireEvent.click(loginBtn);

    await waitFor(() => expect(loginBtn).toBeDisabled());
    await waitFor(() => expect(loginBtn).not.toBeDisabled());
  });

  it('shows error on failed login', async () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'fail@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Secret123!' } });
    const loginBtn = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginBtn);

    await screen.findByText(/invalid credentials/i);
  });
});
