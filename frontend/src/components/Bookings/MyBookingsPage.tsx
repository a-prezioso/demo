import React, { useEffect, useState } from 'react';
import { listMyBookings, type UserBookingItemDto } from '../../api/bookingsClient';
import { sortBookings } from './sortUtils';

export type MyBookingsPageProps = { baseUrl?: string };

type UiState = 'idle' | 'loading' | 'error' | 'ready' | 'empty';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ baseUrl = '/api' }) => {
  const [items, setItems] = useState<UserBookingItemDto[]>([]);
  const [ui, setUi] = useState<UiState>('idle');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setUi('loading');
    setError(null);
    try {
      const res = await listMyBookings({}, { baseUrl });
      const sorted = sortBookings(res.items || []);
      setItems(sorted);
      setUi(sorted.length ? 'ready' : 'empty');
    } catch (e: any) {
      setError(String(e?.message || 'error'));
      setUi('error');
    }
  }

  useEffect(() => { void load(); }, [baseUrl]);

  if (ui === 'loading' || ui === 'idle') {
    return <div aria-busy="true">Caricamento…</div>;
  }

  if (ui === 'error') {
    return (
      <div>
        <div role="alert">Errore: {error}</div>
        <button onClick={() => load()}>Riprova</button>
      </div>
    );
  }

  if (ui === 'empty') {
    return <div>Nessuna prenotazione</div>;
  }

  return (
    <div>
      <h1>Le Mie Prenotazioni</h1>
      <ul>
        {items.map((b) => (
          <li key={b.id} data-testid="booking-row" data-start={new Date(b.startDate).toISOString()}>
            <div>
              <strong>Postazione:</strong> {b.deskId}
            </div>
            <div>
              <strong>Data/ora:</strong> {formatDate(b.startDate)}
            </div>
            <div>
              <strong>Stato:</strong> {b.status}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
