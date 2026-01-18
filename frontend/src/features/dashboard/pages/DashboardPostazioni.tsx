import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchSeats } from "../api/dashboardApi";
import { Seat } from "../types";
import { SeatMap } from "../components/SeatMap";
import { Legend } from "../components/Legend";
import { InfoBottomSheet } from "../components/InfoBottomSheet";
import { RefreshButton } from "../components/RefreshButton";

export const DashboardPostazioni: React.FC = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Seat | null>(null);

  // Controls for avoiding duplicate requests and managing abort/polling
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const lastFetchRef = useRef(0);
  const mountedRef = useRef(true);

  const POLLING_MS = 30000; // 30s default, align with team decision if different
  const MIN_DEBOUNCE_MS = 1500; // avoid duplicate rapid requests

  const load = async (opts?: { background?: boolean; force?: boolean }) => {
    // Debounce/throttle control
    const now = Date.now();
    if (!opts?.force && now - lastFetchRef.current < MIN_DEBOUNCE_MS) {
      return;
    }
    if (inFlightRef.current) {
      return; // Skip if a request is already ongoing
    }

    inFlightRef.current = true;
    if (!opts?.background) {
      if (mountedRef.current) setLoading(true);
      if (mountedRef.current) setError(null);
    }

    // Abort any previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await fetchSeats(controller.signal);
      if (mountedRef.current) setSeats(data);
      lastFetchRef.current = Date.now();
    } catch (e) {
      // Ignore abort errors
      if ((e as any)?.name === "AbortError") return;
      if (!opts?.background) {
        if (mountedRef.current) setError((e as Error).message || "Errore");
      }
    } finally {
      inFlightRef.current = false;
      if (!opts?.background && mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    // Initial load (foreground)
    load();

    // Polling (background)
    const id = window.setInterval(() => {
      void load({ background: true });
    }, POLLING_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(id);
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep selected seat in sync with latest data
  useEffect(() => {
    if (!selected) return;
    const upd = seats.find((s) => s.id === selected.id);
    if (upd && upd !== selected) {
      setSelected(upd);
    }
  }, [seats, selected?.id]);

  const handleRetry = () => load({ force: true });
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
        <button
          className="refresh-btn"
          onClick={() => load({ force: true })}
          aria-label="Aggiorna"
          disabled={loading}
        >
          ⟳
        </button>
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

      {/* Floating refresh for quick manual update */}
      <RefreshButton onClick={() => load({ force: true })} />

      <InfoBottomSheet seat={selected} onClose={handleCloseSheet} onBook={handleBook} />
    </div>
  );
};
