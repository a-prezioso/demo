import React from 'react';

export type ConfirmBookingModalProps = {
  open: boolean;
  stationName: string;
  stationId?: string;
  date: Date; // booking date (date-only semantics)
  onCancel: () => void;
  onConfirm: () => void;
};

function formatDateIT(d: Date): string {
  try {
    return d.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return d.toLocaleDateString('it-IT');
  }
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(17, 24, 39, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 12,
  width: 'min(92vw, 420px)',
  boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '1rem 1rem 0.5rem 1rem',
};

const bodyStyle: React.CSSProperties = {
  padding: '0 1rem 1rem 1rem',
  color: '#374151',
  fontSize: 14,
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.5rem',
  padding: '0.75rem 1rem 1rem',
};

const btnBase: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  padding: '0.5rem 0.75rem',
  cursor: 'pointer',
};

const ConfirmBookingModal: React.FC<ConfirmBookingModalProps> = ({ open, stationName, stationId, date, onCancel, onConfirm }) => {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (open) {
      const prev = document.activeElement as HTMLElement | null;
      dialogRef.current?.focus();
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
      };
      document.addEventListener('keydown', handler);
      return () => {
        document.removeEventListener('keydown', handler);
        prev?.focus?.();
      };
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div style={overlayStyle} aria-hidden={!open}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-booking-title"
        tabIndex={-1}
        style={modalStyle}
      >
        <div style={headerStyle}>
          <h3 id="confirm-booking-title" style={{ margin: 0 }}>Confermare prenotazione?</h3>
        </div>
        <div style={bodyStyle}>
          <p style={{ marginTop: 0 }}>Stai per prenotare la seguente postazione:</p>
          <ul style={{ margin: 0, padding: '0 0 0 1.1rem' }}>
            <li><strong>Data:</strong> {formatDateIT(date)}</li>
            <li><strong>Postazione:</strong> {stationName}{stationId ? ` (#${stationId})` : ''}</li>
          </ul>
          <p style={{ fontSize: 12, color: '#6b7280' }}>Verifica le informazioni prima di confermare. Potrai modificare o annullare la prenotazione secondo le policy del coworking.</p>
        </div>
        <div style={footerStyle}>
          <button type="button" onClick={onCancel} style={{ ...btnBase, background: '#e5e7eb', color: '#111827' }}>Annulla</button>
          <button type="button" onClick={onConfirm} style={{ ...btnBase, background: '#111827', color: '#ffffff' }}>Conferma</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBookingModal;
