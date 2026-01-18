import React, { useEffect, useState } from 'react';
import BookingList, { BookingItem } from './BookingList';

interface ApiBookingItem {
  id: string;
  start: string;
  end: string;
  location?: string;
  status?: string;
  title?: string;
}

export function MyBookings() {
  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/bookings/me');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        const list = (data?.data || data?.items || []) as ApiBookingItem[];
        if (mounted) {
          setItems(list as BookingItem[]);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Errore di caricamento');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section aria-labelledby="my-bookings-title">
      <h1 id="my-bookings-title">Le Mie Prenotazioni</h1>
      <BookingList items={items} loading={loading} error={error} emptyMessage="Nessuna prenotazione" />
    </section>
  );
}

export default MyBookings;
