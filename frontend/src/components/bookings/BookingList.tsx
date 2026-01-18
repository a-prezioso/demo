import React from 'react';

export type BookingItem = {
  id: string;
  start: string; // ISO date-time
  end: string; // ISO date-time
  location?: string;
  status?: string;
  title?: string; // desk/room name or generic title
};

export interface BookingListProps {
  items: BookingItem[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

function byStartAsc(a: BookingItem, b: BookingItem) {
  const ta = new Date(a.start).getTime();
  const tb = new Date(b.start).getTime();
  return ta - tb;
}

export function BookingList({ items, loading, error, emptyMessage = 'Nessuna prenotazione' }: BookingListProps) {
  if (loading) {
    return (
      <div data-testid="loading" aria-live="polite" role="status">
        Caricamento...
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="error" role="alert">
        Errore: {error}
      </div>
    );
  }

  const sorted = [...(items || [])].sort(byStartAsc);

  if (sorted.length === 0) {
    return (
      <div data-testid="empty-state">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div data-testid="my-bookings-list">
      <ul>
        {sorted.map((b) => {
          const start = new Date(b.start);
          const end = new Date(b.end);
          const dateFormatter = new Intl.DateTimeFormat(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          const timeFormatter = new Intl.DateTimeFormat(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          });
          const dateLabel = `${dateFormatter.format(start)} ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
          return (
            <li key={b.id} data-testid="booking-row">
              <div data-testid="booking-title">{b.title || 'Prenotazione'}</div>
              <div data-testid="booking-date">{dateLabel}</div>
              {b.location ? (
                <div data-testid="booking-location">{b.location}</div>
              ) : null}
              {b.status ? (
                <div data-testid="booking-status">{b.status}</div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default BookingList;
