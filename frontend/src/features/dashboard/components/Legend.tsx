import React from "react";

export const Legend: React.FC = () => {
  return (
    <div className="legend" role="region" aria-label="Legenda stati postazioni">
      <div className="legend-item">
        <span className="legend-dot free" aria-hidden>●</span>
        <span>Libero</span>
      </div>
      <div className="legend-item">
        <span className="legend-dot busy" aria-hidden>■</span>
        <span>Occupato</span>
      </div>
      <div className="legend-item">
        <span className="legend-dot unavailable" aria-hidden>▲</span>
        <span>Non disponibile</span>
      </div>
    </div>
  );
};
