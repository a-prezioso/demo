import React from 'react';

export interface BookingItem {
  id: string;
  date: string; // ISO date
  deskLabel: string;
  status: 'active' | 'cancelled' | 'completed';
}

export interface MyBookingsProps {
  items?: BookingItem[];
  onCancel?: (id: string) => void;
}

const DEFAULT_ITEMS: BookingItem[] = [
  { id: 'B1', date: new Date().toISOString().slice(0, 10), deskLabel: 'Postazione 3', status: 'active' },
  { id: 'B2', date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), deskLabel: 'Postazione 7', status: 'completed' },
];

export const MyBookings: React.FC<MyBookingsProps> = ({ items = DEFAULT_ITEMS, onCancel }) => {
  return (
    <section aria-label="Le mie prenotazioni" style={{ padding: '16px 16px 72px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Le mie prenotazioni</h1>
      </header>

      <ul role="list" aria-label="Elenco prenotazioni" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
        {items.map((b) => (
          <li key={b.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{b.deskLabel}</div>
              <div aria-label="Data prenotazione" style={{ color: '#555', fontSize: 14 }}>{formatDate(b.date)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span aria-label={`Stato: ${statusLabel(b.status)}`} style={{ fontSize: 12, color: statusColor(b.status), fontWeight: 600 }}>
                {statusLabel(b.status)}
              </span>
              {b.status === 'active' && (
                <button
                  className="sd-btn"
                  aria-label={`Annulla prenotazione ${b.id}`}
                  onClick={() => onCancel && onCancel(b.id)}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ef4444', background: '#fff', color: '#ef4444' }}
                >
                  Annulla
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

function statusLabel(s: BookingItem['status']) {
  switch (s) {
    case 'active':
      return 'Attiva';
    case 'cancelled':
      return 'Annullata';
    case 'completed':
      return 'Completata';
  }
}

function statusColor(s: BookingItem['status']) {
  switch (s) {
    case 'active':
      return '#0b74de';
    case 'cancelled':
      return '#ef4444';
    case 'completed':
      return '#16a34a';
  }
}

function formatDate(d: string) {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch {
    return d;
  }
}

export default MyBookings;
