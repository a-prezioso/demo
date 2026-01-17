import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useStationsPolling, Station } from '../hooks/useStationsPolling';

// DashboardPostazioni: mappa interattiva 12 postazioni (mobile-first)
// - Griglia 3x4 su mobile, 4x3 su viewport >= 768px
// - Stati: FREE (libero), OCCUPIED (occupato), UNAVAILABLE (non disponibile)
// - Colori accessibili e icone semplificate
// - Selezione mostra pannello informativo e azione di prenotazione (hook)
// - Gestione loading ed errore con retry e polling periodico

export type StationStatus = 'FREE' | 'OCCUPIED' | 'UNAVAILABLE';

export type { Station };

const STATUS_LABEL: Record<StationStatus, string> = {
  FREE: 'Libero',
  OCCUPIED: 'Occupato',
  UNAVAILABLE: 'Non disponibile',
};

const statusStyles: Record<StationStatus, { bg: string; fg: string; border?: string; icon: string } > = {
  FREE: { bg: '#059669', fg: '#ffffff', border: '1px solid #047857', icon: '●' }, // emerald
  OCCUPIED: { bg: '#dc2626', fg: '#ffffff', border: '1px solid #b91c1c', icon: '■' }, // red
  UNAVAILABLE: { bg: '#9ca3af', fg: '#111827', border: '1px solid #6b7280', icon: '×' }, // gray
};

const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const DashboardPostazioni: React.FC<{ onPrenota?: (s: Station) => void } > = ({ onPrenota }) => {
  const { tokens } = useAuth();
  const accessToken = tokens?.accessToken;

  // Polling hook: default every 30s; can be tuned via env or props in the future
  const { stations, loading, error, reload } = useStationsPolling({ token: accessToken, intervalMs: 30000, debounceMs: 300 });

  const [selected, setSelected] = React.useState<Station | null>(null);

  // Reset selection when data refreshes to avoid stale selection
  React.useEffect(() => {
    setSelected(null);
  }, [stations]);

  const handleSelect = (s: Station) => {
    setSelected(s);
  };

  const handlePrenota = (s: Station) => {
    if (onPrenota) {
      onPrenota(s);
      return;
    }
    // Default: semplice notifica. Integrazione reale può navigare a /booking
    // eslint-disable-next-line no-alert
    alert(`Azione prenotazione per: ${s.name}`);
  };

  const GridCell: React.FC<{ item: Station; index: number }> = ({ item, index }) => {
    const style = statusStyles[item.status];
    const isSelectable = item.status === 'FREE' || item.status === 'OCCUPIED';

    const base: React.CSSProperties = {
      position: 'relative',
      borderRadius: 10,
      border: style.border,
      background: style.bg,
      color: style.fg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 72, // Touch target sufficiente su mobile
      padding: '0.5rem',
      textAlign: 'center',
      userSelect: 'none',
      cursor: isSelectable ? 'pointer' : 'not-allowed',
      outline: 'none',
      width: '100%',
    };

    const handleKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isSelectable) handleSelect(item);
      }
    };

    return (
      <button
        type="button"
        onClick={() => isSelectable && handleSelect(item)}
        onKeyDown={handleKey}
        aria-label={`${item.name} — ${STATUS_LABEL[item.status]}`}
        title={`${item.name} — ${STATUS_LABEL[item.status]}`}
        style={base}
        disabled={!isSelectable}
      >
        <span aria-hidden style={{ fontSize: 12, position: 'absolute', top: 6, left: 8, opacity: 0.9 }}>#{index + 1}</span>
        <span aria-hidden style={{ fontSize: 18, marginRight: 8 }}>{style.icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <strong style={{ fontSize: 14 }}>{item.name}</strong>
          <span style={{ fontSize: 12, opacity: 0.95 }}>{STATUS_LABEL[item.status]}</span>
        </div>
      </button>
    );
  };

  return (
    <div style={{ width: '100%', margin: '0 auto', padding: '1rem', maxWidth: 920 }}>
      <h2 style={{ marginBottom: '0.75rem' }}>Mappa postazioni</h2>

      {loading && (
        <div role="status" aria-live="polite" style={{ margin: '0.5rem 0' }}>
          <span style={srOnly}>Caricamento…</span>
          <div style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #e5e7eb', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {error && (
        <div style={{ background: '#fde8e8', color: '#611a15', padding: '0.75rem', borderRadius: 8, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>{error}</div>
          <button onClick={() => void reload()} style={{ background: '#111827', color: '#ffffff', border: 0, borderRadius: 6, padding: '0.4rem 0.6rem' }}>Riprova</button>
        </div>
      )}

      <div
        className="desk-grid"
        data-desk-grid
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        }}
      >
        {stations.map((s, idx) => (
          <GridCell key={s.id} item={s} index={idx} />
        ))}
      </div>

      {/* Media query semplice inline: per compat garantiamo 4 colonne su viewports >= 768px */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (min-width: 768px) {
          .desk-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
        }
      `}</style>

      {/* Panel info selezione */}
      <div style={{ marginTop: '1rem' }}>
        {selected ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span aria-hidden style={{ fontSize: 18 }}>{statusStyles[selected.status].icon}</span>
              <div>
                <div style={{ fontWeight: 700 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: '#374151' }}>{STATUS_LABEL[selected.status]}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{ background: '#e5e7eb', color: '#111827', border: 0, borderRadius: 6, padding: '0.5rem 0.75rem' }}
              >
                Chiudi
              </button>
              <button
                type="button"
                onClick={() => handlePrenota(selected)}
                disabled={selected.status !== 'FREE'}
                style={{ background: selected.status === 'FREE' ? '#111827' : '#9ca3af', color: '#ffffff', border: 0, borderRadius: 6, padding: '0.5rem 0.75rem' }}
              >
                Prenota
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#6b7280' }}>Tocca una postazione per vedere i dettagli.</div>
        )}
      </div>

      {/* Nota accessibilità/legend */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {(['FREE','OCCUPIED','UNAVAILABLE'] as StationStatus[]).map(st => (
          <div key={st} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden style={{ display: 'inline-flex', width: 12, height: 12, borderRadius: 3, background: statusStyles[st].bg, border: statusStyles[st].border }} />
            <span style={{ fontSize: 12 }}>{STATUS_LABEL[st]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPostazioni;
