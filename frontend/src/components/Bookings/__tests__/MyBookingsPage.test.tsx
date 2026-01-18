import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../../../context/AuthContext';
import { SelectedDateProvider } from '../../../context/SelectedDateContext';
import { MyBookingsPage } from '../MyBookingsPage';

// simple fetch mock
const g: any = global;

function mockFetchOnce(data: any, ok = true) {
  g.fetch = jest.fn().mockResolvedValueOnce({ ok, json: async () => data });
}

describe('MyBookingsPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  function Wrapper({ children }: any) {
    // Minimal AuthProvider wrapper with default baseUrl '/api'
    return (
      <AuthProvider>
        <SelectedDateProvider>{children}</SelectedDateProvider>
      </AuthProvider>
    );
  }

  test('renders empty state', async () => {
    mockFetchOnce({ items: [], page: 1, size: 20, hasMore: false });
    render(
      <Wrapper>
        <MyBookingsPage />
      </Wrapper>,
    );

    expect(await screen.findByText(/Caricamento/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Non hai ancora prenotazioni/i)).toBeInTheDocument());
  });

  test('renders a booking row and allows load more', async () => {
    mockFetchOnce({ items: [{ id: 'b1', startDate: '2030-01-01', endDate: null, deskId: 'D-01', status: 'confirmed' }], page: 1, size: 20, hasMore: true });
    mockFetchOnce({ items: [{ id: 'b2', startDate: '2030-01-02', endDate: null, deskId: 'D-02', status: 'pending' }], page: 2, size: 20, hasMore: false });

    render(
      <Wrapper>
        <MyBookingsPage />
      </Wrapper>,
    );

    await waitFor(() => expect(screen.getByText('D-01')).toBeInTheDocument());
    expect(screen.getByText(/Prossima/)).toBeInTheDocument();

    const loadMore = await screen.findByRole('button', { name: /Carica altri/i });
    fireEvent.click(loadMore);

    await waitFor(() => expect(screen.getByText('D-02')).toBeInTheDocument());
  });
});
