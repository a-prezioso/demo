import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MyBookingsPage } from '../MyBookingsPage';
import { bookingStateColors, normalizeBookingState } from '../statusMapper';

// Mock API client used by MyBookingsPage
jest.mock('../../../api/bookingsClient', () => {
  return {
    __esModule: true,
    listMyBookings: jest.fn(),
  };
});

// Types and helpers
import { listMyBookings } from '../../../api/bookingsClient';

type BookingItem = {
  id: string;
  deskId: string;
  startDate: string; // ISO
  status?: string;
  state?: string;
};

defineWindowSize(1024);

function defineWindowSize(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
}

function mockBookings(items: BookingItem[]) {
  (listMyBookings as jest.Mock).mockResolvedValue({ items });
}

function makeItem(id: string, deskId: string, iso: string, state: string): BookingItem {
  return { id, deskId, startDate: iso, state };
}

const now = new Date('2026-01-17T10:00:00.000Z');

describe('MyBookingsPage - badges integration', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (listMyBookings as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  test('renders badges for Passata, Attiva, Cancellata with correct labels and styles', async () => {
    mockBookings([
      makeItem('b1', 'D-100', '2026-01-10T08:00:00.000Z', 'PASSATA'),
      makeItem('b2', 'D-101', '2026-01-18T08:00:00.000Z', 'ATTIVA'),
      makeItem('b3', 'D-102', '2026-01-19T08:00:00.000Z', 'CANCELLATA'),
    ]);

    const { container } = render(<MyBookingsPage baseUrl="/api" />);

    const rows = await screen.findAllByTestId('booking-row');
    expect(rows).toHaveLength(3);

    // Map row order and expected states
    const expectations: Array<{ idx: number; label: string; state: string }> = [
      { idx: 0, label: 'Passata', state: 'PASSATA' },
      { idx: 1, label: 'Attiva', state: 'ATTIVA' },
      { idx: 2, label: 'Cancellata', state: 'CANCELLATA' },
    ];

    expectations.forEach(({ idx, label, state }) => {
      const row = rows[idx];
      const badge = within(row).getByRole('status');
      expect(badge).toHaveTextContent(label);

      // Check semantic state via data attribute
      const uiState = normalizeBookingState(state);
      expect(badge).toHaveAttribute('data-state', uiState);

      // Check visual colors via inline style
      const colors = bookingStateColors(uiState);
      expect(badge).toHaveStyle({ backgroundColor: colors.bg, color: colors.fg });
    });

    // Check basic snapshot (structure + inline styles)
    expect(container.firstChild).toMatchSnapshot();

    // No console errors/warnings during render
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('mobile and desktop viewports render readable badges and no layout errors', async () => {
    // Desktop first
    defineWindowSize(1280);
    mockBookings([
      makeItem('b1', 'D-200', '2026-01-10T08:00:00.000Z', 'PASSATA'),
      makeItem('b2', 'D-201', '2026-01-18T08:00:00.000Z', 'ATTIVA'),
      makeItem('b3', 'D-202', '2026-01-19T08:00:00.000Z', 'CANCELLATA'),
    ]);

    const { rerender } = render(<MyBookingsPage baseUrl="/api" />);
    let rows = await screen.findAllByTestId('booking-row');
    expect(rows).toHaveLength(3);
    // Labels present in desktop
    expect(screen.getByRole('status', { name: 'Passata' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Attiva' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Cancellata' })).toBeInTheDocument();

    // Switch to mobile
    defineWindowSize(375);
    window.dispatchEvent(new Event('resize'));

    // Rerender to simulate responsive update
    rerender(<MyBookingsPage baseUrl="/api" />);

    rows = await screen.findAllByTestId('booking-row');
    expect(rows).toHaveLength(3);

    // Labels present in mobile too (readability)
    expect(screen.getByRole('status', { name: 'Passata' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Attiva' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Cancellata' })).toBeInTheDocument();

    // No console errors/warnings during viewport changes
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
