import React, { useMemo, useState } from 'react';
import ProtectedRoute from '../../router/ProtectedRoute';

export type DeskStatus = 'free' | 'busy' | 'unavailable';

export type Desk = {
  id: string; // D01..D12
  name: string; // es. "Postazione D01"
  x: number; // percent 0..100
  y: number; // percent 0..100
  status: DeskStatus;
};

export type DashboardPageProps = {
  baseUrl?: string;
  desks?: Desk[]; // opzionale per injection/test; se assente usare layout demo
  onRefresh?: () => Promise<void> | void; // hook refresh esterno
  onBook?: (deskId: string) => void; // callback per aprire pagina prenotazione
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
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const items = desks || defaultDesks;

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
      setLoading(true);
      await onRefresh?.();
    } finally {
      setLoading(false);
    }
  }

  const current = useMemo(() => items.find((d) => d.id === selected) || null, [items, selected]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Mappa postazioni</h1>
        <button
          aria-label="Aggiorna"
          onClick={handleRefresh}
          disabled={loading}
          style={styles.refresh}
        >
          {loading ? '⏳' : '↻'}
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.mapWrap}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={styles.svg}>
            <rect x="0" y="0" width="100" height="100" fill="#f1f5f9" rx="2" />
            {items.map((d) => (
              <DeskMarker
                key={d.id}
                desk={d}
                selected={selected === d.id}
                onSelect={() => setSelected(d.id)}
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
        onClose={() => setSelected(null)}
        onBook={onBook}
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

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Postazione ${desk.id} – ${a11yStatus(status)}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
      style={{ cursor: 'pointer' }}
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
  onClose: () => void;
  onBook?: (deskId: string) => void;
}> = ({ desk, onClose, onBook }) => {
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
        <p style={styles.sheetSub}>Ultimo aggiornamento: appena ora</p>
        <div style={styles.sheetActions}>
          <button
            style={{ ...styles.primaryBtn, opacity: canBook ? 1 : 0.6 }}
            disabled={!canBook}
            onClick={() => onBook?.(desk.id)}
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
  refresh: {
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    borderRadius: 6,
    padding: '8px 10px',
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
