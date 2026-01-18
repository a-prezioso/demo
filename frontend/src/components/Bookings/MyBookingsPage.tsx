import React from 'react';
import { useSelectedDate } from '../../context/SelectedDateContext';

export const MyBookingsPage: React.FC = () => {
  const { date, setDate } = useSelectedDate();

  return (
    <div style={{ padding: '16px 16px 72px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Le mie prenotazioni</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="myBookingsDate" style={{ fontSize: 12 }}>Data</label>
          <input
            id="myBookingsDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Seleziona data prenotazioni"
          />
        </div>
      </header>

      <p style={{ marginTop: 0, color: '#555' }}>Mostrando prenotazioni per il giorno {date}.</p>

      {/* Placeholder list. In future, fetch from API using the selected date. */}
      <div role="list" aria-label={`Prenotazioni del ${date}`} style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div role="listitem" style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
          Nessuna prenotazione trovata per questa data.
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;
