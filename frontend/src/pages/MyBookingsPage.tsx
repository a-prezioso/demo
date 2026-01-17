import React from 'react';

// Simple placeholder for "Le mie prenotazioni" section
// In a real implementation, this would fetch user's bookings and render a list with status/actions

const MyBookingsPage: React.FC = () => {
  return (
    <div style={{ padding: '1rem' }}>
      <h1>Le mie prenotazioni</h1>
      <p style={{ color: '#6b7280', fontSize: 14 }}>Qui troverai l'elenco delle tue prenotazioni di postazioni.</p>
      <ul style={{ marginTop: '1rem', paddingLeft: '1.25rem' }}>
        <li>Esempio: Postazione 7 — 21/02/2026 — Stato: Confermata</li>
        <li>Esempio: Postazione 3 — 10/03/2026 — Stato: In attesa</li>
      </ul>
    </div>
  );
};

export default MyBookingsPage;
