import React, { useEffect, useMemo, useState } from 'react';

export type ConfirmBookingModalProps = {
  open: boolean;
  stationId: string;
  stationName?: string | null;
  // If provided, use this date; otherwise fallback to today
  date?: Date | null;
  onConfirm?: (payload: { stationId: string; dateIso: string }) => Promise<void> | void;
  onCancel?: () => void;
};

function formatDateIT(date: Date): string {
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const ConfirmBookingModal: React.FC<ConfirmBookingModalProps> = ({ open, stationId, stationName, date, onConfirm, onCancel }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookingDate = useMemo(() => date ?? new Date(), [date]);
  const pretty = formatDateIT(bookingDate);
  const dateIso = toIsoDate(bookingDate);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const titleId = 'confirm-booking-title';
  const descId = 'confirm-booking-desc';

  const handleConfirm = async () => {
    setError(null);
    try {
      setSubmitting(true);
      await onConfirm?.({ stationId, dateIso });
    } catch (e: any) {
      setError(e?.message || 'Errore temporaneo, riprova');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 999,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="bottom-sheet"
        style={{ paddingBottom: 24, zIndex: 1000 }}
      >
        <h2 id={titleId} style={{ marginTop: 0 }}>Confermi prenotazione?</h2>
        <p id={descId} style={{ marginBottom: 12 }}>
          Stai prenotando la postazione <strong>{stationId}{stationName ? ` — ${stationName}` : ''}</strong>
          {' '}per il giorno <strong>{pretty}</strong>.
        </p>
        {error && <div style={{ color: '#DC2626', marginBottom: 8 }}>{error}</div>}
        <div className="actions">
          <button className="btn" onClick={onCancel} disabled={submitting}>Annulla</button>
          <button className="btn primary" onClick={handleConfirm} disabled={submitting}>{submitting ? 'Conferma…' : 'Conferma'}</button>
        </div>
      </div>
    </>
  );
};
