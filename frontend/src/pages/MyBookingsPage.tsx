import React from 'react';
import { useSelectedDate } from '../context/SelectedDateContext';

// Simple placeholder for "Le mie prenotazioni" section
// In a real implementation, this would fetch user's bookings and render a list with status/actions

const MyBookingsPage: React.FC = () => {
  const { date, dateKey, setDate } = useSelectedDate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const d = new Date(v);
    if (!isNaN(d.getTime())) setDate(d);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Le mie prenotazioni</h1>
      <div style={{ margin: '0.5rem 0 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <label htmlFor="myb-date" style={{ fontSize: 12, color: '#374151' }}>Data:</label>
        <input id="myb-date" type="date" value={dateKey} onChange={handleChange} style={{ padding: '0.25rem 0.5rem', borderRadius: 6, border: '1px solid #d1d5db' }} />
      </div>
      <p style={{ color: '#6b7280', fontSize: 14 }}>Qui troverai l'elenco delle tue prenotazioni di postazioni.</p>
      <ul style={{ marginTop: '1rem', paddingLeft: '1.25rem' }}>
        <li>Esempio: Postazione 7 — {date.toLocaleDateString('it-IT')} — Stato: Confermata</li>
        <li>Esempio: Postazione 3 — {date.toLocaleDateString('it-IT')} — Stato: In attesa</li>
      </ul>
    </div>
  );
};

export default MyBookingsPage;
