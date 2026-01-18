import React, { useMemo, useState } from 'react';
import ProtectedRoute from '../../router/ProtectedRoute';
import { useDesksData } from './useDesksData';

export type DeskStatus = 'free' | 'busy' | 'unavailable';

export type Desk = {
  id: string; // D01..D12
  name: string; // es. "Postazione D01"
  x: number; // percent 0..100
  y: number; // percent 0..100
  status: DeskStatus;
};

export type BookingPreview = {
  deskId: string;
  deskName: string;
  bookingDate: Date;
  building?: string | null;
  floor?: string | null;
};

export type DashboardPageProps = {
  baseUrl?: string;
  desks?: Desk[]; // opzionale per injection/test; se assente usare layout demo
  onRefresh?: () => Promise<void> | void; // hook refresh esterno
  onBook?: (deskId: string) => void; // callback per aprire pagina prenotazione (legacy)
  onDeskSelected?: (desk: Desk, date: Date, preview: BookingPreview) => void; // nuovo evento
  onConfirmBooking?: (preview: BookingPreview) => void; // conferma prenotazione da popup
  pollingMs?: number; // intervallo aggiornamento periodico
  bookingDate?: Date; // data proveniente da datepicker globale; default: oggi
};

export const defaultDesks: Desk[] = [
  { id: 'D01', name: 'Postazione D01', x: 10, y: 15, status: 'free' },
  { id: 'D02', name: 'Postazione D02', x: 40, y: 15, status: 'busy' },
  { id: 'D03', name: 'Postazione D03', x: 70, y: 15, status: 'unavailable' },
  { id: 'D04', name: 'Postazione D04', x: 10, y: 40, status: 'free' },
  { id: 'D05', name: 'Postazione D05', x: 40, y: 40, status: 'busy' },
  { id: 'D06', name: 'Postazione D06', x: 70, y: 40, status: 'unavailable' },
  { id: 'D07', name: 'Postazione D07', x: 10, y: 65, status: 'free' },
  { id: 'D08', name: 'Postazione D08', x: 40, y: 65, status: 'busy' },
  { id: 'D09', name: 'Postazione D09', x: 70, y: 65, status: 'unavailable' },
  { id: 'D10', name: 'Postazione D10', x: 10, y: 85, status: 'free' },
  { id: 'D11', name: 'Postazione D11', x: 40, y: 85, status: 'busy' },
  { id: 'D12', name: 'Postazione D12', x: 70, y: 85, status: 'unavailable' },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  baseUrl = '/api',
  desks,
  onRefresh,
  onBook,
  onDeskSelected,
  onConfirmBooking,
  pollingMs,
  bookingDate,
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  // Integrate with backend via hook; if desks prop provided, keep using it (e.g., tests)
  const { desks: liveDesks, loading, error, lastUpdated, refresh } = useDesksData({
    baseUrl,
    pollingMs: pollingMs ?? 30000,
  });

  const items = desks || liveDesks || defaultDesks;

  const counts = useMemo(() => {
    return items.reduce(
      (acc, d) => {
        acc[d.status]++;
        return acc;
      },
      { free: 0, busy: 0, unavailable: 0 } as Record<DeskStatus, number>,
    );
  }, [items]);

  async function handleRefresh() {
    try {
      await refresh();
      await onRefresh?.();
    } catch (_) {
      // error is already set by hook; noop
    }
  }

  const todayAtStart = useMemo(() => {
    const dt = bookingDate ? new Date(bookingDate) : new Date();
    // normalizza a mezzanotte locale
    dt.setHours(0, 0, 0, 0);
    return dt;
  }, [bookingDate]);

  const current = useMemo(() => items.find((d) => d.id === selected) || null, [items, selected]);

  const currentPreview: BookingPreview | null = useMemo(() => {
    if (!current) return null;
    return {
      deskId: current.id,
      deskName: current.name,
      bookingDate: todayAtStart,
      building: null,
      floor: null,
    };
  }, [current, todayAtStart]);

  function onDeskTap(desk: Desk) {
    // Solo postazioni libere aprono il popup/preview
    if (desk.status !== 'free') {
      return; // nessuna azione su occupata/non disponibile
    }
    setSelected(desk.id);
    const preview: BookingPreview = {
      deskId: desk.id,
      deskName: desk.name,
      bookingDate: todayAtStart,
      building: null,
      floor: null,
    };
    onDeskSelected?.(desk, todayAtStart, preview);
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Mappa postazioni</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastUpdated && (
            <span style={styles.subtle} aria-live="polite">
              Aggiornato {formatRelative(lastUpdated)}
            </span>
          )}
          <button
            aria-label="Aggiorna"
            onClick={handleRefresh}
            disabled={loading}
            style={styles.refresh}
          >
            {loading ? '⏳' : '↻'}
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" style={styles.errorBox}>
          <span>Errore di rete: {error}</span>
          <button onClick={handleRefresh} style={styles.retryBtn}>Riprova</button>
        </div>
      )}

      <main style={styles.main}>
        <div style={styles.mapWrap}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={styles.svg}>
            <rect x="0" y="0" width="100" height="100" fill="#f1f5f9" rx="2" />
            {items.map((d) => (
              <DeskMarker
                key={d.id}
                desk={d}
                selected={selected === d.id}
                onSelect={() => onDeskTap(d)}
              />
            ))}
          </svg>
        </div>

        {/* Legend sticky bottom on mobile */}
        <div style={styles.legend} aria-label="Legenda stati">
          <LegendChip colorVar="var(--desk-free)" label={`Libero (${counts.free})`} symbol="●" />
          <LegendChip colorVar="var(--desk-busy)" label={`Occupato (${counts.busy})`} symbol="✕" />
          <LegendChip colorVar="var(--desk-na)" label={`Non disp. (${counts.unavailable})`} symbol="▦" />
        </div>
      </main>

      <DetailsSheet
        desk={current}
        preview={currentPreview}
        onClose={() => setSelected(null)}
        onBook={(deskId: string) => onBook?.(deskId)}
        onConfirm={(p) => onConfirmBooking?.(p)}
      />
    </div>
  );
};

const LegendChip: React.FC<{ colorVar: string; label: string; symbol: string }> = ({
  colorVar,
  label,
  symbol,
}) => (
  <div style={{ ...styles.chip, background: colorVar }}>{symbol} {label}</div>
);

const DeskMarker: React.FC<{
  desk: Desk;
  selected?: boolean;
  onSelect: () => void;
}> = ({ desk, selected, onSelect }) => {
  const { status } = desk;
  const { bg, border, fore } = getColor(status);
  const size = 8; // in viewBox units
  const x = desk.x - size / 2;
  const y = desk.y - size / 2;

  const isClickable = status === 'free';

  return (
    <g
      role={isClickable ? 'button' : 'img'}
      aria-disabled={!isClickable}
      tabIndex={isClickable ? 0 : -1}
      aria-label={`Postazione ${desk.id} – ${a11yStatus(status)}`}
      onClick={() => isClickable && onSelect()}
      onKeyDown={(e) => {
        if (!isClickable) return;
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
      style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
    >
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        rx={2}
        fill={bg}
        stroke={selected ? '#0ea5e9' : border}
        strokeWidth={selected ? 1.5 : 1}
        opacity={status === 'unavailable' ? 0.7 : 1}
      />
      <text x={desk.x} y={desk.y + 0.5} textAnchor="middle" fontSize={2.8} fill={fore}>
        {desk.id}
      </text>
    </g>
  );
};

const DetailsSheet: React.FC<{
  desk: Desk | null;
  preview: BookingPreview | null;
  onClose: () => void;
  onBook?: (deskId: string) => void; // legacy
  onConfirm?: (preview: BookingPreview) => void;
}> = ({ desk, preview, onClose, onBook, onConfirm }) => {
  const isOpen = !!desk;
  if (!desk) return null;
  const { bg, border, fore } = getColor(desk.status);
  const canBook = desk.status === 'free';
  return (
    <div style={{ ...styles.sheet, transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}>
      <div style={styles.sheetBar} />
      <div style={styles.sheetContent}>
        <div style={{ ...styles.badge, background: bg, borderColor: border, color: fore }}>
          {symbolFor(desk.status)} {a11yStatus(desk.status)}
        </div>
        <h2 style={styles.sheetTitle}>{desk.name}</h2>
        {preview && (
          <p style={styles.sheetSub}>
            Data prenotazione: {formatDate(preview.bookingDate)}
          </p>
        )}
        <div style={styles.sheetActions}>
          <button
            style={{ ...styles.primaryBtn, opacity: canBook ? 1 : 0.6 }}
            disabled={!canBook}
            onClick={() => {
              if (!canBook) return;
              // callback nuova con preview; manteniamo anche compat legacy
              if (preview) onConfirm?.(preview);
              onBook?.(desk.id);
            }}
          >
            Prenota
          </button>
          <button style={styles.secondaryBtn} onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
};

function a11yStatus(s: DeskStatus): string {
  return s === 'free' ? 'Libero' : s === 'busy' ? 'Occupato' : 'Non disponibile';
}
function symbolFor(s: DeskStatus): string {
  return s === 'free' ? '●' : s === 'busy' ? '✕' : '▦';
}
function getColor(s: DeskStatus): { bg: string; border: string; fore: string } {
  switch (s) {
    case 'free':
      return { bg: 'var(--desk-free)', border: 'var(--desk-free-border)', fore: 'var(--desk-free-fore)' };
    case 'busy':
      return { bg: 'var(--desk-busy)', border: 'var(--desk-busy-border)', fore: 'var(--desk-busy-fore)' };
    default:
      return { bg: 'var(--desk-na)', border: 'var(--desk-na-border)', fore: 'var(--desk-na-fore)' };
  }
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 10000) return 'ora';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s fa`;
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m fa`;
  const d = new Date(date);
  return d.toLocaleTimeString();
}

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

const styles: Record<string, React.CSSProperties> = {
  page: {
    '--desk-free': '#16a34a',
    '--desk-free-border': '#15803d',
    '--desk-free-fore': '#ffffff',
    '--desk-busy': '#dc2626',
    '--desk-busy-border': '#b91c1c',
    '--desk-busy-fore': '#ffffff',
    '--desk-na': '#6b7280',
    '--desk-na-border': '#4b5563',
    '--desk-na-fore': '#ffffff',
  } as React.CSSProperties,
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
  },
  title: { fontSize: 18, margin: 0 },
  subtle: { color: '#64748b', fontSize: 12 } as React.CSSProperties,
  refresh: {
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    borderRadius: 6,
    padding: '8px 10px',
    cursor: 'pointer',
  },
  errorBox: {
    margin: '8px 12px',
    padding: '8px 10px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    color: '#7f1d1d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  retryBtn: {
    background: '#fee2e2',
    color: '#7f1d1d',
    border: '1px solid #fecaca',
    borderRadius: 6,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  main: { padding: 12 },
  mapWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 9',
    background: '#f8fafc',
    borderRadius: 8,
    boxShadow: 'inset 0 0 0 1px #e5e7eb',
    overflow: 'hidden',
  },
  svg: { width: '100%', height: '100%' },
  legend: {
    position: 'sticky',
    bottom: 0,
    marginTop: 12,
    background: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: 8,
    padding: 8,
    zIndex: 4,
  },
  chip: {
    color: '#fff',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 12,
    boxShadow: '0 1px 2px rgba(0,0,0,0.06) inset',
  },
  sheet: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    background: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
    transition: 'transform 0.2s ease-out',
  },
  sheetBar: {
    width: 40,
    height: 4,
    background: '#e5e7eb',
    borderRadius: 999,
    margin: '8px auto 0',
  },
  sheetContent: { padding: 16 },
  sheetTitle: { margin: '8px 0', fontSize: 18 },
  sheetSub: { margin: '0 0 12px 0', color: '#64748b', fontSize: 13 },
  sheetActions: { display: 'flex', gap: 8, marginTop: 8 },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid transparent',
    fontSize: 12,
  },
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

export const DashboardRoute: React.FC<DashboardPageProps> = (props) => (
  <ProtectedRoute>
    <DashboardPage {...props} />
  </ProtectedRoute>
);

export default DashboardPage;
