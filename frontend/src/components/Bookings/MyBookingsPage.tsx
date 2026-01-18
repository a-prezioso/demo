import React, { useEffect, useMemo, useState } from 'react';
import { listMyBookings, type UserBookingItemDto, cancelMyBooking } from '../../api/bookingsClient';
import { sortBookings } from './sortUtils';
import { BookingStatusBadge } from './BookingStatusBadge';

export type MyBookingsPageProps = { baseUrl?: string };

type UiState = 'idle' | 'loading' | 'error' | 'ready' | 'empty';

type ConfirmState = { id: string; open: boolean } | null;

type Toast = { type: 'success' | 'error'; message: string } | null;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function hoursDiff(fromIso: string, to = new Date()): number {
  const start = new Date(fromIso).getTime();
  const now = to.getTime();
  return (start - now) / (1000 * 60 * 60);
}

function canCancelClient(item: UserBookingItemDto): boolean {
  // Hide/disable cancel when clearly not allowed on client side:
  // - state already cancelled or passed
  const st = (item.state || item.status || '').toUpperCase();
  if (st.includes('CANC')) return false;
  if (st.includes('PASS')) return false;
  // - within 24 hours window (best-effort pre-check)
  const h = hoursDiff(item.startDate);
  return h >= 24;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ baseUrl = '/api' }) => {
  const [items, setItems] = useState<UserBookingItemDto[]>([]);
  const [ui, setUi] = useState<UiState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState<Toast>(null);

  const sortedItems = useMemo(() => sortBookings(items), [items]);

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

  async function handleConfirmCancel(id: string) {
    setConfirm({ id, open: false });
    try {
      const res = await cancelMyBooking(id, { baseUrl });
      // Optimistic: remove or update state
      setItems((prev) => prev.filter((x) => x.id !== id));
      setToast({ type: 'success', message: 'Prenotazione cancellata con successo' });
      // If backend returns updated item instead of deletion, merge it
      if (res.item) {
        setItems((prev) => {
          const exists = prev.find((p) => p.id === res.item!.id);
          if (!exists) return prev; // already removed
          return prev.map((p) => (p.id === res.item!.id ? res.item! : p));
        });
      }
    } catch (e: any) {
      const msg = e?.details?.reasonKey === 'booking.cannot_cancel_within_24h'
        ? 'La prenotazione non può essere cancellata perché mancano meno di 24 ore all’uso'
        : e?.message || 'Impossibile cancellare la prenotazione';
      setToast({ type: 'error', message: String(msg) });
    }
  }

  function closeToast() { setToast(null); }

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
      {toast && (
        <div role={toast.type === 'error' ? 'alert' : 'status'}
             style={{
               margin: '8px 0', padding: '8px 12px', borderRadius: 6,
               background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
               color: '#111827',
             }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{toast.message}</span>
            <button onClick={closeToast} aria-label="Chiudi">×</button>
          </div>
        </div>
      )}
      <ul>
        {sortedItems.map((b) => {
          const showCancel = canCancelClient(b);
          return (
            <li key={b.id} data-testid="booking-row" data-start={new Date(b.startDate).toISOString()} style={{ marginBottom: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 220 }}>
                  <div><strong>Postazione:</strong> {b.deskId}</div>
                  <div><strong>Data/ora:</strong> {formatDate(b.startDate)}</div>
                  <div>
                    <strong>Stato:</strong>{' '}
                    <BookingStatusBadge value={b.state ?? b.status} size="md" />
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => setConfirm({ id: b.id, open: true })}
                    disabled={!showCancel}
                    aria-disabled={!showCancel}
                    style={{
                      padding: '8px 12px', borderRadius: 6, border: '1px solid #dc2626',
                      background: showCancel ? '#ffffff' : '#f3f4f6', color: '#dc2626', cursor: showCancel ? 'pointer' : 'not-allowed',
                    }}
                    title={showCancel ? 'Cancella prenotazione' : 'Cancellazione non disponibile (entro 24 ore o già non attiva)'}
                  >
                    Cancella
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Simple confirm dialog */}
      {confirm && confirm.open && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, maxWidth: 420, width: '100%' }}>
            <h2 style={{ marginTop: 0 }}>Confermi la cancellazione della prenotazione?</h2>
            <p style={{ marginTop: 8 }}>Ricorda: puoi cancellare solo se mancano più di 24 ore all’orario di utilizzo.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setConfirm(null)}>Annulla</button>
              <button onClick={() => confirm?.id && handleConfirmCancel(confirm.id)} style={{ background: '#dc2626', color: '#fff', border: '1px solid #dc2626', padding: '6px 12px', borderRadius: 6 }}>Conferma</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
