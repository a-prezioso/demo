import React, { useMemo, useState } from 'react';
import '../../../assets/styles/dashboard.css';
import { LegendBar } from '../components/LegendBar';
import { StationDetail } from '../components/StationDetail';
import { StationsMap } from '../components/StationsMap';
import { Station, StationStatus, STATION_IDS } from '../types';
import { ConfirmBookingModal } from '../components/ConfirmBookingModal';

function mockStations(): Station[] {
  // Simple mock: alternate statuses for visual
  const statuses: StationStatus[] = ['available', 'busy', 'unavailable'];
  const now = new Date().toISOString();
  return STATION_IDS.map((id, i) => ({ id, status: statuses[i % statuses.length], updatedAt: now }));
}

export const DashboardPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const stations = useMemo(() => mockStations(), [lastUpdated]);

  const selected = stations.find((s) => s.id === selectedId) || null;

  const onRefresh = () => {
    // Placeholder: in future call API and update lastUpdated
    setLastUpdated(new Date().toISOString());
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const station = stations.find((s) => s.id === id);
    // Open confirmation only for available stations
    if (station?.status === 'available') {
      setConfirmOpen(true);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
  };

  const handleConfirmPreview = async (payload: { stationId: string; stationName?: string | null; date: Date; dateIso: string }) => {
    // TODO: integrate real API call: POST /bookings
    await new Promise((r) => setTimeout(r, 500));
    // Close modal and keep selection for details, or clear selection based on UX decision.
    setConfirmOpen(false);
    // Optionally show a feedback (toast). Placeholder: console.log
    // eslint-disable-next-line no-console
    console.log('Prenotazione confermata', payload);
  };

  return (
    <section className="dashboard">
      <header className="header">
        <h1 style={{ margin: 0, fontSize: '1.1rem' }}>Mappa postazioni</h1>
        <button className="icon-btn" aria-label="Aggiorna stato postazioni" onClick={onRefresh}>⟳</button>
      </header>

      <div className="map-wrapper">
        <StationsMap stations={stations} selectedId={selectedId} onSelect={handleSelect} />
        {/* Fallback list for very small screens */}
        <div className="fallback-list" aria-label="Lista postazioni (fallback)">
          {stations.map((s) => (
            <div key={s.id} className="row">
              <div className="state">
                <span className={`dot ${s.status}`} aria-hidden="true" /> {s.id}
              </div>
              <div>
                <button className="btn" onClick={() => handleSelect(s.id)} disabled={s.status !== 'available'}>
                  {s.status === 'available' ? 'Prenota' : 'Non disponibile'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <LegendBar updatedAt={lastUpdated} />

      {/* Detail panel: bottom sheet on mobile. On wide screens, could be rendered in a side panel container */}
      {!confirmOpen && <StationDetail station={selected} onClose={() => setSelectedId(null)} />}

      {/* Confirmation modal */}
      <ConfirmBookingModal
        open={confirmOpen}
        preview={{ stationId: selectedId || '', stationName: selected?.name ?? null, date: new Date() }}
        onCancel={handleCancelConfirm}
        onConfirmPreview={handleConfirmPreview}
      />
    </section>
  );
};
