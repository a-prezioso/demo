import React, { useCallback, useMemo, useState } from 'react';
import { BookingList } from './BookingList';
import { isBookingCancellable, cancelBooking, getBookingStartDate } from '../../lib/bookingApi';

interface MyBookingsProps {
  bookings: any[];
  onRefresh?: () => void; // optional callback to refetch list from parent/store
}

// Localizable strings
const i18n = {
  title: 'Le mie prenotazioni',
  cancel: 'Cancella',
  cancelConfirmTitle: 'Conferma cancellazione',
  cancelConfirmMsg: 'Confermi la cancellazione della prenotazione? Ricorda: la cancellazione è consentita solo fino a 24 ore prima dell\'orario di utilizzo.',
  cancelSuccess: 'Prenotazione cancellata correttamente',
  cancelError24h: 'La prenotazione non può essere cancellata perché mancano meno di 24 ore all\'orario di utilizzo',
  cancelGenericError: 'Si è verificato un errore durante la cancellazione della prenotazione',
  close: 'Chiudi',
};

export const MyBookings: React.FC<MyBookingsProps> = ({ bookings, onRefresh }) => {
  const [items, setItems] = useState<any[]>(bookings || []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // reflect external changes
  React.useEffect(() => setItems(bookings || []), [bookings]);

  const canCancelMap = useMemo(() => {
    const now = new Date();
    const map: Record<string, { allowed: boolean; reason?: string }> = {};
    for (const b of items) {
      map[b.id] = isBookingCancellable(b, now);
    }
    return map;
  }, [items]);

  const handleCancel = useCallback(async (booking: any) => {
    setError(null);
    const start = getBookingStartDate(booking);
    const pre = isBookingCancellable(booking);
    // Optional pre-check to avoid unnecessary calls
    if (!pre.allowed) {
      if (pre.reason === 'LESS_THAN_24H') {
        setError(i18n.cancelError24h);
      } else {
        setError(i18n.cancelGenericError);
      }
      return;
    }

    const confirmed = window.confirm(`${i18n.cancelConfirmTitle}\n\n${i18n.cancelConfirmMsg}`);
    if (!confirmed) return;

    try {
      setBusyId(booking.id);
      const res = await cancelBooking(booking.id);
      if (!res.success) {
        const code = res.error?.code || '';
        if (code === 'BOOKING_CANCELLATION_WINDOW') {
          setError(i18n.cancelError24h);
        } else {
          setError(res.error?.message || i18n.cancelGenericError);
        }
        return;
      }

      // Update UI: remove or mark as cancelled
      const updated = items
        .map((b) => (b.id === booking.id ? { ...b, status: 'CANCELLATA' } : b))
        .filter((b) => b.status !== 'CANCELLATA');
      setItems(updated);
      setSuccess(i18n.cancelSuccess);
      onRefresh?.();
    } finally {
      setBusyId(null);
    }
  }, [items, onRefresh]);

  return (
    <div>
      <h2>{i18n.title}</h2>
      {error && (
        <div role="alert" style={{ color: '#a00', marginBottom: 8 }}>
          {error} <button onClick={() => setError(null)}>{i18n.close}</button>
        </div>
      )}
      {success && (
        <div role="status" style={{ color: '#0a0', marginBottom: 8 }}>
          {success} <button onClick={() => setSuccess(null)}>{i18n.close}</button>
        </div>
      )}
      <BookingList
        bookings={items}
        renderActions={(b: any) => {
          const can = canCancelMap[b.id] || { allowed: false };
          const disabled = !can.allowed || busyId === b.id;
          return (
            <button
              aria-label={`Cancella prenotazione ${b?.id}`}
              disabled={disabled}
              onClick={() => handleCancel(b)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                backgroundColor: disabled ? '#ddd' : '#e74c3c',
                color: '#fff',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {busyId === b.id ? '...' : i18n.cancel}
            </button>
          );
        }}
      />
    </div>
  );
};

export default MyBookings;
