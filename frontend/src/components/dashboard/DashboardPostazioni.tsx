import React, { useEffect, useMemo, useState } from 'react';

export type DeskStatus = 'FREE' | 'OCCUPIED' | 'UNAVAILABLE';

export interface Desk {
  id: string;
  name: string;
  status: DeskStatus;
}

export interface DashboardPostazioniProps {
  // If provided, component uses this list directly; otherwise fetches from API
  desks?: Desk[];
  // Optional custom fetcher
  fetchDesks?: () => Promise<Desk[]>;
  // Called when a desk is tapped/clicked
  onSelectDesk?: (desk: Desk) => void;
  // Called when user taps the booking button in the info panel
  onBook?: (desk: Desk) => void;
  // Optional class/style for outer container
  className?: string;
  style?: React.CSSProperties;
}

// Default fetcher attempting to load desks from a conventional endpoint
async function defaultFetchDesks(): Promise<Desk[]> {
  try {
    const res = await fetch('/api/desks');
    if (!res.ok) throw new Error('Errore rete');
    const body = await res.json();
    // Accept either { data: Desk[] } or Desk[]
    const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    return list as Desk[];
  } catch (e) {
    throw e;
  }
}

const styles = `
/* Mobile-first styles for DashboardPostazioni */
.sd-dashboard { max-width: 960px; margin: 0 auto; padding: 12px; overflow-x: hidden; }
.sd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.sd-title { font-size: 1.125rem; font-weight: 700; }
.sd-subtle { font-size: 0.85rem; color: #6b7280; }

.sd-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
@media (min-width: 640px) { .sd-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

.sd-cell { border-radius: 12px; min-height: 88px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.06); cursor: pointer; user-select: none; touch-action: manipulation; }
.sd-cell:active { transform: scale(0.98); }
.sd-cell .sd-name { font-weight: 700; font-size: 0.95rem; margin-top: 6px; }
.sd-cell .sd-meta { font-size: 0.75rem; opacity: 0.95; }

/* Status colors with good contrast */
.sd-free { background-color: #16a34a; color: #ffffff; }
.sd-occupied { background-color: #dc2626; color: #ffffff; }
.sd-unavailable { background-color: #6b7280; color: #ffffff; }

/* Simple icon badge */
.sd-icon { width: 20px; height: 20px; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.15); }

/* Bottom sheet info panel */
.sd-info-overlay { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; }
.sd-info-panel { background: #ffffff; border-top-left-radius: 16px; border-top-right-radius: 16px; box-shadow: 0 -6px 16px rgba(0,0,0,0.15); padding: 16px; }
.sd-info-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.sd-info-title { font-size: 1rem; font-weight: 800; }
.sd-chip { border-radius: 9999px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; }
.sd-chip-free { background: #dcfce7; color: #166534; }
.sd-chip-occupied { background: #fee2e2; color: #7f1d1d; }
.sd-chip-unavailable { background: #e5e7eb; color: #374151; }
.sd-actions { display: flex; gap: 8px; margin-top: 12px; }
.sd-btn { appearance: none; border: none; border-radius: 10px; padding: 10px 14px; font-weight: 700; font-size: 0.95rem; cursor: pointer; }
.sd-btn-primary { background: #2563eb; color: #fff; }
.sd-btn-secondary { background: #e5e7eb; color: #111827; }

/* Loading spinner */
.sd-center { display: flex; align-items: center; justify-content: center; padding: 24px; }
.sd-spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #2563eb; border-radius: 9999px; animation: sd-spin 1s linear infinite; }
@keyframes sd-spin { to { transform: rotate(360deg); } }

/* Error box */
.sd-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 10px; padding: 12px; }
`;

function StatusIcon({ status }: { status: DeskStatus }) {
  // Simple inline SVGs to avoid external dependencies
  if (status === 'FREE') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path d="M7 12l3 3 7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'OCCUPIED') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M7 11h10v7H7z" fill="currentColor" />
      <path d="M9 11V8a3 3 0 016 0v3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function statusClass(status: DeskStatus): string {
  switch (status) {
    case 'FREE':
      return 'sd-free';
    case 'OCCUPIED':
      return 'sd-occupied';
    default:
      return 'sd-unavailable';
  }
}

function statusLabel(status: DeskStatus): string {
  switch (status) {
    case 'FREE':
      return 'Libero';
    case 'OCCUPIED':
      return 'Occupato';
    default:
      return 'Non disponibile';
  }
}

export const DashboardPostazioni: React.FC<DashboardPostazioniProps> = ({
  desks: desksProp,
  fetchDesks = defaultFetchDesks,
  onSelectDesk,
  onBook,
  className,
  style,
}) => {
  const [desks, setDesks] = useState<Desk[] | null>(desksProp ?? null);
  const [loading, setLoading] = useState<boolean>(!desksProp);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Desk | null>(null);

  // Memo to ensure exactly 12 positions in a 3x4 map. If less data provided, fill with placeholders.
  const gridDesks = useMemo(() => {
    const list = desks ?? [];
    const count = 12;
    if (list.length >= count) return list.slice(0, count);
    const placeholders: Desk[] = Array.from({ length: count - list.length }).map((_, i) => ({
      id: `placeholder-${i}`,
      name: `—`,
      status: 'UNAVAILABLE',
    }));
    return [...list, ...placeholders];
  }, [desks]);

  useEffect(() => {
    if (!desksProp) {
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchDesks();
          setDesks(data);
        } catch (e: any) {
          setError(e?.message || 'Errore di caricamento');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [desksProp, fetchDesks]);

  function handleSelect(d: Desk) {
    // Ignore placeholders
    if (d.id.startsWith('placeholder-')) return;
    setSelected(d);
    onSelectDesk?.(d);
  }

  function handleBook() {
    if (selected && selected.status === 'FREE') {
      onBook?.(selected);
    }
  }

  return (
    <div className={["sd-dashboard", className].filter(Boolean).join(' ')} style={style}>
      {/* Inject component styles once */}
      <style>{styles}</style>

      <div className="sd-header" aria-live="polite">
        <div className="sd-title">Mappa postazioni</div>
        <div className="sd-subtle">12 postazioni • mobile-first</div>
      </div>

      {loading && (
        <div className="sd-center" role="status" aria-live="polite" aria-busy="true">
          <div className="sd-spinner" />
        </div>
      )}

      {error && !loading && (
        <div className="sd-error" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span>Errore: {error}</span>
            <button className="sd-btn sd-btn-secondary" onClick={() => {
              setError(null);
              setLoading(true);
              (async () => {
                try {
                  const data = await fetchDesks();
                  setDesks(data);
                } catch (e: any) {
                  setError(e?.message || 'Errore di caricamento');
                } finally {
                  setLoading(false);
                }
              })();
            }}>Riprova</button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="sd-grid" role="grid" aria-label="Mappa 12 postazioni">
          {gridDesks.map((d, idx) => (
            <div
              key={d.id}
              role="gridcell"
              aria-label={`${d.name} - ${statusLabel(d.status)}`}
              tabIndex={0}
              className={["sd-cell", statusClass(d.status)].join(' ')}
              onClick={() => handleSelect(d)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(d); } }}
              style={{ minHeight: 88 }}
            >
              <div className="sd-icon" aria-hidden>
                <StatusIcon status={d.status} />
              </div>
              <div className="sd-name">{d.name}</div>
              <div className="sd-meta">{statusLabel(d.status)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom info panel */}
      {selected && (
        <div className="sd-info-overlay" role="dialog" aria-modal="true" aria-label={`Dettagli ${selected.name}`}>
          <div className="sd-info-panel">
            <div className="sd-info-row">
              <div>
                <div className="sd-info-title">{selected.name}</div>
                <div className={[
                  'sd-chip',
                  selected.status === 'FREE' ? 'sd-chip-free' : selected.status === 'OCCUPIED' ? 'sd-chip-occupied' : 'sd-chip-unavailable',
                ].join(' ')}>
                  {statusLabel(selected.status)}
                </div>
              </div>
              <button className="sd-btn sd-btn-secondary" onClick={() => setSelected(null)} aria-label="Chiudi pannello">Chiudi</button>
            </div>
            <div className="sd-actions">
              <button
                className="sd-btn sd-btn-primary"
                onClick={handleBook}
                disabled={selected.status !== 'FREE'}
                aria-disabled={selected.status !== 'FREE'}
              >
                Prenota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPostazioni;
