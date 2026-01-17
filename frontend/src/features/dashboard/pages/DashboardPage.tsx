import React, { useMemo, useState } from 'react';
import '../../../assets/styles/dashboard.css';
import { LegendBar } from '../components/LegendBar';
import { StationDetail } from '../components/StationDetail';
import { StationsMap } from '../components/StationsMap';
import { Station, StationStatus, STATION_IDS } from '../types';

function mockStations(): Station[] {
  // Simple mock: alternate statuses for visual
  const statuses: StationStatus[] = ['available', 'busy', 'unavailable'];
  const now = new Date().toISOString();
  return STATION_IDS.map((id, i) => ({ id, status: statuses[i % statuses.length], updatedAt: now }));
}

export const DashboardPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const stations = useMemo(() => mockStations(), [lastUpdated]);

  const selected = stations.find((s) => s.id === selectedId) || null;

  const onRefresh = () => {
    // Placeholder: in future call API and update lastUpdated
    setLastUpdated(new Date().toISOString());
  };

  return (
    <section className="dashboard">
      <header className="header">
        <h1 style={{ margin: 0, fontSize: '1.1rem' }}>Mappa postazioni</h1>
        <button className="icon-btn" aria-label="Aggiorna stato postazioni" onClick={onRefresh}>⟳</button>
      </header>

      <div className="map-wrapper">
        <StationsMap stations={stations} selectedId={selectedId} onSelect={setSelectedId} />
        {/* Fallback list for very small screens */}
        <div className="fallback-list" aria-label="Lista postazioni (fallback)">
          {stations.map((s) => (
            <div key={s.id} className="row">
              <div className="state">
                <span className={`dot ${s.status}`} aria-hidden="true" /> {s.id}
              </div>
              <div>
                <button className="btn" onClick={() => setSelectedId(s.id)}>Apri</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <LegendBar updatedAt={lastUpdated} />

      {/* Detail panel: bottom sheet on mobile. On wide screens, could be rendered in a side panel container */}
      <StationDetail station={selected} onClose={() => setSelectedId(null)} />
    </section>
  );
};
