import React, { useEffect, useMemo, useState } from "react";
import { fetchSeats } from "../api/dashboardApi";
import { Seat } from "../types";
import { SeatMap } from "../components/SeatMap";
import { Legend } from "../components/Legend";
import { InfoBottomSheet } from "../components/InfoBottomSheet";

export const DashboardPostazioni: React.FC = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Seat | null>(null);

  const load = async (controller?: AbortController) => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchSeats(controller?.signal);
      setSeats(data);
    } catch (e) {
      setError((e as Error).message || "Errore");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl);
    return () => ctrl.abort();
  }, []);

  const handleRetry = () => load();
  const handleSelect = (s: Seat) => setSelected(s);
  const handleCloseSheet = () => setSelected(null);
  const handleBook = (s: Seat) => {
    // hook prenotazione: per ora redirect a route fittizia
    window.location.href = `/prenotazioni/nuova?seatId=${encodeURIComponent(s.id)}`;
  };

  const hasData = useMemo(() => seats && seats.length > 0, [seats]);

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1 className="title">Dashboard</h1>
        <button className="refresh-btn" onClick={() => load()} aria-label="Aggiorna">⟳</button>
      </header>

      <Legend />

      <main className="page-content">
        {loading && (
          <div className="loading" role="status" aria-live="polite">
            <div className="spinner" /> Caricamento…
          </div>
        )}
        {!loading && error && (
          <div className="error" role="alert">
            <div>Errore nel caricamento</div>
            <button onClick={handleRetry}>Riprova</button>
          </div>
        )}
        {!loading && !error && hasData && (
          <SeatMap seats={seats} selectedId={selected?.id ?? null} onSelect={handleSelect} />
        )}
      </main>

      <InfoBottomSheet seat={selected} onClose={handleCloseSheet} onBook={handleBook} />
    </div>
  );
};
