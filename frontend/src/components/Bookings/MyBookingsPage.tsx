import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

// Align with backend DTO exposed in booking.repository.ts
export type UserBookingItemDto = {
  id: string;
  startDate: string; // ISO 8601 date (YYYY-MM-DD) or full datetime
  endDate: string | null; // null for date-only bookings
  deskId: string;
  status: string; // keep as string for UI
  notes?: string | null;
  tags?: string[] | null;
};

const PAGE_SIZE = 20;

function ensureDateTimeISO(s: string): string {
  // If input is date-only (YYYY-MM-DD), append midnight to avoid timezone drift
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00`;
  return s;
}

function parseDateSafe(s: string): Date {
  try {
    return new Date(ensureDateTimeISO(s));
  } catch {
    return new Date(NaN);
  }
}

function formatDateTimeRange(start: string, end: string | null, locale: string) {
  const startD = parseDateSafe(start);
  const endD = end ? parseDateSafe(end) : null;

  // Date label (short)
  const dateLabel = new Intl.DateTimeFormat(locale || undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(startD);

  // Time(s)
  const hasTime = /T\d{2}:\d{2}/.test(start) || (end ? /T\d{2}:\d{2}/.test(end) : false);
  const timeFmt = new Intl.DateTimeFormat(locale || undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const timeLabel = hasTime
    ? `${timeFmt.format(startD)}${endD ? ` – ${timeFmt.format(endD)}` : ''}`
    : 'Tutto il giorno';

  return { dateLabel, timeLabel };
}

export const MyBookingsPage: React.FC = () => {
  const { state, baseUrl } = useAuth();
  const [items, setItems] = useState<UserBookingItemDto[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locale = useMemo(() => (typeof navigator !== 'undefined' ? navigator.language : 'it-IT'), []);

  const accessToken = (state as any)?.accessToken || (state as any)?.token || '';

  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${baseUrl || '/api'}/bookings/my?page=${pageNum}&size=${PAGE_SIZE}`;
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data?.error || `Errore di rete (${res.status})`);
      }
      const data = await res.json();
      const list: UserBookingItemDto[] = Array.isArray(data)
        ? (data as UserBookingItemDto[])
        : Array.isArray((data as any)?.items)
        ? ((data as any).items as UserBookingItemDto[])
        : [];
      setItems((prev) => (pageNum === 1 ? list : [...prev, ...list]));
      // Determine hasMore: prefer server hint, fallback to length heuristic
      const serverHasMore = typeof (data as any)?.hasMore === 'boolean' ? (data as any).hasMore : undefined;
      setHasMore(serverHasMore !== undefined ? serverHasMore : list.length === PAGE_SIZE);
    } catch (e: any) {
      setError(e?.message || 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  }, [accessToken, baseUrl]);

  useEffect(() => {
    // Initial load
    fetchPage(1);
  }, [fetchPage]);

  const onRetry = () => fetchPage(page || 1);
  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next);
  };

  // Determine future/past for visual badges without reordering
  const now = new Date();
  function isFuture(item: UserBookingItemDto): boolean {
    const start = parseDateSafe(item.startDate);
    return start.getTime() >= now.getTime();
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Le mie prenotazioni</h1>
        <p style={styles.subtitle}>Elenco in ordine cronologico come fornito dall'API</p>
      </header>

      {error && (
        <div role="alert" aria-live="assertive" style={styles.error}>
          {error}
          <div>
            <button onClick={onRetry} style={styles.buttonSecondary} aria-label="Riprova">Riprova</button>
          </div>
        </div>
      )}

      {!error && loading && items.length === 0 && (
        <div role="status" aria-live="polite" style={styles.loading}>Caricamento…</div>
      )}

      {!error && !loading && items.length === 0 && (
        <div role="status" aria-live="polite" style={styles.empty}>Non hai ancora prenotazioni.</div>
      )}

      {items.length > 0 && (
        <section aria-label="Elenco prenotazioni" style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Orario</th>
                <th style={styles.th}>Postazione</th>
                <th style={styles.th}>Stato</th>
                <th style={styles.th} aria-label="Categoria (futura o passata)">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => {
                const { dateLabel, timeLabel } = formatDateTimeRange(b.startDate, b.endDate, locale);
                const future = isFuture(b);
                return (
                  <tr key={b.id}>
                    <td style={styles.td}>{dateLabel}</td>
                    <td style={styles.td}>{timeLabel}</td>
                    <td style={styles.td}>{b.deskId}</td>
                    <td style={styles.td}>
                      <span style={badgeForStatus(b.status)}>{b.status}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={future ? styles.badgeFuture : styles.badgePast}>
                        {future ? 'Prossima' : 'Passata'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {hasMore && !loading && !error && (
        <div style={styles.loadMoreWrap}>
          <button onClick={loadMore} style={styles.buttonPrimary} aria-label="Carica altre prenotazioni">
            Carica altri
          </button>
        </div>
      )}

      {loading && items.length > 0 && (
        <div role="status" aria-live="polite" style={styles.loadingMore}>Caricamento…</div>
      )}
    </div>
  );
};

function badgeForStatus(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 12,
    lineHeight: '18px',
    padding: '0 8px',
    borderRadius: 999,
    textTransform: 'capitalize',
    background: '#e5e7eb',
    color: '#374151',
  };
  const map: Record<string, React.CSSProperties> = {
    confirmed: { background: '#dcfce7', color: '#166534' },
    pending: { background: '#fef3c7', color: '#92400e' },
    canceled: { background: '#fee2e2', color: '#991b1b' },
  };
  return { ...base, ...(map[status] || {}) };
}

async function safeJson(res: Response): Promise<any | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '16px',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 20,
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: '#6b7280',
    fontSize: 13,
  },
  error: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  empty: {
    background: '#f3f4f6',
    color: '#374151',
    padding: 12,
    borderRadius: 8,
  },
  loading: {
    padding: 12,
    color: '#374151',
  },
  tableWrap: {
    overflowX: 'auto',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    background: '#fff',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
  },
  th: {
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 13,
    color: '#374151',
    padding: '10px 12px',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  td: {
    fontSize: 14,
    color: '#111827',
    padding: '10px 12px',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'top',
  },
  badgeFuture: {
    display: 'inline-block',
    fontSize: 12,
    lineHeight: '18px',
    padding: '0 8px',
    borderRadius: 999,
    background: '#dbeafe',
    color: '#1e40af',
  },
  badgePast: {
    display: 'inline-block',
    fontSize: 12,
    lineHeight: '18px',
    padding: '0 8px',
    borderRadius: 999,
    background: '#f3f4f6',
    color: '#374151',
  },
  loadMoreWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  buttonPrimary: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
  },
  buttonSecondary: {
    background: '#fff',
    color: '#2563eb',
    border: '1px solid #93c5fd',
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    marginTop: 8,
  },
  loadingMore: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 8,
  },
};

export default MyBookingsPage;
