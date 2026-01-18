import React from 'react';
import { render, screen } from '@testing-library/react';
import { BookingStatusBadge } from '../BookingStatusBadge';

describe('BookingStatusBadge', () => {
  const t = (k: string) => ({
    'bookings.status.active': 'Attiva',
    'bookings.status.passed': 'Passata',
    'bookings.status.cancelled': 'Cancellata',
    'bookings.status.unknown': 'Sconosciuto',
  } as any)[k] || k;

  it('renders active state from raw value', () => {
    render(<BookingStatusBadge value="ACTIVE" i18n={t} />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-label', 'Attiva');
    expect(el).toHaveTextContent('Attiva');
    expect(el.getAttribute('data-state')).toBe('active');
  });

  it('renders passed state from raw value', () => {
    render(<BookingStatusBadge value="PASSATA" i18n={t} />);
    const el = screen.getByRole('status');
    expect(el).toHaveTextContent('Passata');
  });

  it('renders cancelled state from raw value', () => {
    render(<BookingStatusBadge value="CANCELLATA" i18n={t} />);
    const el = screen.getByRole('status');
    expect(el).toHaveTextContent('Cancellata');
  });

  it('falls back to unknown for unexpected values', () => {
    render(<BookingStatusBadge value="WHATEVER" i18n={t} />);
    const el = screen.getByRole('status');
    expect(el).toHaveTextContent('Sconosciuto');
  });

  it('accepts normalized state directly', () => {
    render(<BookingStatusBadge state="active" i18n={t} />);
    const el = screen.getByRole('status');
    expect(el).toHaveTextContent('Attiva');
  });
});
