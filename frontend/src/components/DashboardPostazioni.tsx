import React, { useEffect, useState } from 'react';
import { fetchDesks, Desk, DeskStatus } from '../lib/desksApi';

const statusColor: Record<DeskStatus, string> = {
  FREE: '#22c55e',
  OCCUPIED: '#ef4444',
  UNAVAILABLE: '#9ca3af',
};

export function DashboardPostazioni({ baseUrl = '', refreshMs = 15000 }: { baseUrl?: string; refreshMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Desk[]>([]);

  const load = async () => {
    try {
      setError(null);
      const data = await fetchDesks(baseUrl);
      setItems(data.items);
    } catch (e: any) {
      setError(e?.message || 'Errore');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: any;
    load();
    if (refreshMs && refreshMs > 0) {
      timer = setInterval(load, refreshMs);
    }
    return () => timer && clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, refreshMs]);

  if (loading) return <div aria-label="loading">Caricamento…</div>;
  if (error) return <div role="alert">{error}</div>;

  return (
    <div className="grid grid-cols-3 gap-2" aria-label="dashboard">
      {items.map((d) => (
        <div key={d.id} data-testid={`desk-${d.id}`} style={{ backgroundColor: statusColor[d.status] }} className="h-12 rounded text-white flex items-center justify-center">
          {d.name}
        </div>
      ))}
      {items.length < 12 && Array.from({ length: 12 - items.length }).map((_, i) => (
        <div key={`empty-${i}`} className="h-12 rounded bg-gray-200" />
      ))}
    </div>
  );
}

export default DashboardPostazioni;
