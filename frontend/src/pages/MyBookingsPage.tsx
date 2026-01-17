import React from 'react';
import { useSelectedDate } from '../context/SelectedDateContext';
import { useAuth } from '../context/AuthContext';
import { fetchMyBookings, BookingItem, FetchMyBookingsResponse } from '../services/myBookingsService';
import BookingStatusBadge from '../components/BookingStatusBadge';

// "Le mie prenotazioni" — shows the authenticated user's bookings
// Requirements:
// - Calls backend endpoint /api/bookings/me (or uses stub fallback)
// - Keeps API order; no client re-sorting
// - Distinguishes future vs past with separate sections
// - Handles loading, error, empty state, and progressive loading (pagination)
// - Responsive and accessible

const sectionTitleStyle: React.CSSProperties = {
  margin: '1rem 0 0.5rem',
  fontSize: 18,
  fontWeight: 600,
  color: '#111827',
};

const listContainerStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  overflowX: 'auto',
};

const headerRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(100px,120px) minmax(80px,110px) 1fr minmax(96px,120px)',
  gap: 8,
  alignItems: 'center',
  padding: '8px 12px',
  background: '#f3f4f6',
  color: '#374151',
  fontSize: 12,
  fontWeight: 600,
  minWidth: 560,
};

const itemRowStyleBase: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(100px,120px) minmax(80px,110px) 1fr minmax(96px,120px)',
  gap: 8,
  alignItems: 'center',
  padding: '10px 12px',
  borderTop: '1px solid #f3f4f6',
  fontSize: 14,
  minWidth: 560,
};

const pastItemStyle: React.CSSProperties = { color: '#6b7280' }; // dimmed

const metaStyle: React.CSSProperties = { color: '#6b7280', fontSize: 12 };

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: 8,
  background: '#111827',
  color: '#ffffff',
  border: '1px solid #111827',
  cursor: 'pointer',
};

const btnSecondaryStyle: React.CSSProperties = {
  ...btnStyle,
  background: '#ffffff',
  color: '#111827',
};

function formatDateIT(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  try {
    return dt.toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return dt.toLocaleDateString('it-IT');
  }
}

function formatTimeRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return 'Giornata intera';
  const s = start || '';
  const e = end || '';
  return `${s}${s && e ? ' – ' : ''}${e}`;
}

function computeBadgeStatus(item: BookingItem, isPast?: boolean): string {
  // If cancelled, always show cancelled
  if ((item.status || '').toUpperCase() === 'CANCELLED' || (item.status as any) === 'CANCELED') return 'CANCELLATA';
  // For past list, show PASSATA regardless of original status
  if (isPast) return 'PASSATA';
  // Otherwise reflect current/legacy status
  return String(item.status || 'UNKNOWN');
}

function ItemRow({ item, isPast }: { item: BookingItem; isPast?: boolean }) {
  const badgeStatus = computeBadgeStatus(item, isPast);
  return (
    <div role="row" style={{ ...itemRowStyleBase, ...(isPast ? pastItemStyle : null) }}>
      <div role="cell" aria-label="Data">{formatDateIT(item.date)}</div>
      <div role="cell" aria-label="Orario">{formatTimeRange(item.startTime, item.endTime)}</div>
      <div role="cell" aria-label="Postazione e sede">
        <div style={{ fontWeight: 500 }}>{item.deskName || `Postazione ${item.deskId}`}</div>
        {item.locationName ? <div style={metaStyle}>{item.locationName}</div> : null}
      </div>
      <div role="cell" aria-label="Stato">
        <BookingStatusBadge status={badgeStatus} />
      </div>
    </div>
  );
}

function HeaderRow() {
  return (
    <div role="row" style={headerRowStyle}>
      <div role="columnheader">Data</div>
      <div role="columnheader">Orario</div>
      <div role="columnheader">Sede/Spazio</div>
      <div role="columnheader">Stato</div>
    </div>
  );
}

function useBookingsSection(scope: 'future' | 'past') {
  const { tokens, user } = useAuth();
  const [items, setItems] = React.useState<BookingItem[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [initialized, setInitialized] = React.useState(false);

  const load = React.useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res: FetchMyBookingsResponse = await fetchMyBookings({
        token: tokens?.accessToken,
        limit: 20,
        cursor: reset ? null : cursor,
        scope,
        userId: user?.id,
      });
      if (reset) setItems(res.items);
      else setItems(prev => [...prev, ...res.items]);
      setCursor(res.nextCursor ?? null);
      setInitialized(true);
    } catch (e: any) {
      setError(e?.message || 'Errore durante il caricamento');
    } finally {
      setLoading(false);
    }
  }, [tokens?.accessToken, user?.id, cursor, scope, loading]);

  React.useEffect(() => {
    // Initial load
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const hasMore = !!cursor;

  return { items, hasMore, loadMore: () => load(false), reload: () => load(true), loading, error, initialized };
}

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

const MyBookingsPage: React.FC = () => {
  const { date } = useSelectedDate();

  const future = useBookingsSection('future');
  const [showPast, setShowPast] = React.useState(false);
  const past = useBookingsSection('past');

  React.useEffect(() => {
    if (showPast && !past.initialized && !past.loading) past.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPast]);

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Le mie prenotazioni</h1>

      {/* Future section */}
      <section aria-labelledby="heading-future" style={{ marginTop: 8 }}>
        <h2 id="heading-future" style={sectionTitleStyle}>Prossime</h2>
        <div style={listContainerStyle} role="table" aria-label="Prossime prenotazioni">
          <HeaderRow />
          <div role="rowgroup">
            {future.loading && !future.initialized ? (
              <div style={{ padding: 12 }} role="status" aria-live="polite">Caricamento…</div>
            ) : future.error ? (
              <div style={{ padding: 12, color: '#B91C1C' }}>Errore: {future.error} <button onClick={future.reload} style={{ ...btnSecondaryStyle, marginLeft: 8 }}>Riprova</button></div>
            ) : future.items.length === 0 ? (
              <div style={{ padding: 12, color: '#6b7280' }}>Nessuna prenotazione futura trovata.</div>
            ) : (
              future.items.map((it) => <ItemRow key={it.id} item={it} />)
            )}
          </div>
        </div>
        {future.hasMore && (
          <div style={{ marginTop: 8 }}>
            <button onClick={future.loadMore} disabled={future.loading} style={btnStyle}>
              {future.loading ? 'Caricamento…' : 'Carica altre'}
            </button>
          </div>
        )}
      </section>

      {/* Past section */}
      <section aria-labelledby="heading-past" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h2 id="heading-past" style={sectionTitleStyle}>Passate</h2>
          <button
            aria-expanded={showPast}
            aria-controls="past-list"
            onClick={() => setShowPast(s => !s)}
            style={btnSecondaryStyle}
          >
            {showPast ? 'Nascondi' : 'Mostra'}
          </button>
        </div>
        {showPast && (
          <div id="past-list" style={{ ...listContainerStyle, marginTop: 8 }} role="table" aria-label="Prenotazioni passate">
            <HeaderRow />
            <div role="rowgroup">
              {past.loading && !past.initialized ? (
                <div style={{ padding: 12 }} role="status" aria-live="polite">Caricamento…</div>
              ) : past.error ? (
                <div style={{ padding: 12, color: '#B91C1C' }}>Errore: {past.error} <button onClick={past.reload} style={{ ...btnSecondaryStyle, marginLeft: 8 }}>Riprova</button></div>
              ) : past.items.length === 0 ? (
                <div style={{ padding: 12, color: '#6b7280' }}>Nessuna prenotazione passata.</div>
              ) : (
                past.items.map((it) => <ItemRow key={it.id} item={it} isPast />)
              )}
            </div>
          </div>
        )}
        {showPast && past.hasMore && (
          <div style={{ marginTop: 8 }}>
            <button onClick={past.loadMore} disabled={past.loading} style={btnStyle}>
              {past.loading ? 'Caricamento…' : 'Carica altre'}
            </button>
          </div>
        )}
      </section>

      {/* SR helper for the current context date (shared across app) */}
      <div style={srOnly} aria-live="polite">Contesto data corrente: {date.toLocaleDateString('it-IT')}</div>
    </div>
  );
};

export default MyBookingsPage;
