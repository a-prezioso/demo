import React, { useEffect, useMemo, useRef } from 'react';
import type { BookingPreview } from '../Dashboard/DashboardPage';

export type BookingConfirmationDialogProps = {
  isOpen: boolean;
  preview: BookingPreview | null;
  onConfirm: (preview: BookingPreview) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  titleText?: string; // optional custom title
};

export const BookingConfirmationDialog: React.FC<BookingConfirmationDialogProps> = ({
  isOpen,
  preview,
  onConfirm,
  onCancel,
  loading,
  titleText,
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useMemo(() => `booking-dialog-title`, []);

  useEffect(() => {
    if (!isOpen) return;
    // Focus confirm as primary action, fallback to title for screen readers
    const t = setTimeout(() => {
      if (confirmRef.current) confirmRef.current.focus();
      else if (titleRef.current) titleRef.current.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !preview) return null;

  function formatDate(date: Date): string {
    try {
      const d = new Date(date);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return '';
    }
  }

  return (
    <div style={styles.overlay}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={styles.dialog}
      >
        <h2 id={titleId} ref={titleRef} tabIndex={-1} style={styles.title}>
          {titleText || 'Conferma prenotazione'}
        </h2>
        <div style={styles.content}>
          <div style={styles.row}><span style={styles.label}>Postazione:</span><span>{preview.deskName} ({preview.deskId})</span></div>
          <div style={styles.row}><span style={styles.label}>Data:</span><span>{formatDate(preview.bookingDate)}</span></div>
          {preview.building ? (
            <div style={styles.row}><span style={styles.label}>Edificio:</span><span>{preview.building}</span></div>
          ) : null}
          {preview.floor ? (
            <div style={styles.row}><span style={styles.label}>Piano:</span><span>{preview.floor}</span></div>
          ) : null}
        </div>
        <div style={styles.actions}>
          <button
            ref={confirmRef}
            onClick={() => onConfirm(preview)}
            disabled={!!loading}
            style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}
            aria-busy={!!loading}
          >
            {loading ? 'Conferma…' : 'Conferma'}
          </button>
          <button onClick={onCancel} style={styles.secondaryBtn}>Annulla</button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  dialog: {
    width: 'min(92vw, 480px)',
    background: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    padding: 16,
    border: '1px solid #e5e7eb',
  },
  title: {
    margin: '4px 0 12px 0',
    fontSize: 18,
    outline: 'none',
  },
  content: {
    display: 'grid',
    gap: 8,
    marginBottom: 12,
  },
  row: { display: 'flex', gap: 8, alignItems: 'baseline' },
  label: { color: '#64748b', minWidth: 88, display: 'inline-block' },
  actions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 },
  primaryBtn: {
    background: '#2c7be5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 12px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  secondaryBtn: {
    background: '#f1f5f9',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '10px 12px',
    cursor: 'pointer',
    fontWeight: 500,
  },
};

export default BookingConfirmationDialog;
