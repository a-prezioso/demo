import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginForm } from '../LoginForm';

describe('LoginForm', () => {
  it('renders fields and submits values', async () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    const email = screen.getByLabelText(/email/i) as HTMLInputElement;
    const password = screen.getByLabelText(/password/i) as HTMLInputElement;
    const button = screen.getByRole('button', { name: /login/i });

    fireEvent.change(email, { target: { value: 'user@example.com' } });
    fireEvent.change(password, { target: { value: 'Secret123!' } });
    fireEvent.click(button);

    expect(onSubmit).toHaveBeenCalledWith({ email: 'user@example.com', password: 'Secret123!' });
  });
});
