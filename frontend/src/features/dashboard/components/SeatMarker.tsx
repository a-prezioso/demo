import React from "react";
import { Seat } from "../types";

interface Props {
  seat: Seat;
  selected?: boolean;
  onClick?: (seat: Seat) => void;
}

export const SeatMarker: React.FC<Props> = ({ seat, selected, onClick }) => {
  const handle = () => onClick?.(seat);
  const cls = `seat-marker seat-${seat.status.toLowerCase()} ${selected ? "seat-selected" : ""}`;
  const ariaLabel = `${seat.name}: ${
    seat.status === "FREE" ? "Libero" : seat.status === "BUSY" ? "Occupato" : "Non disponibile"
  }`;

  return (
    <button
      className={cls}
      aria-label={ariaLabel}
      onClick={handle}
      disabled={seat.status === "UNAVAILABLE"}
    >
      <span className="seat-icon" aria-hidden>
        {seat.status === "FREE" && "✓"}
        {seat.status === "BUSY" && "●"}
        {seat.status === "UNAVAILABLE" && "🔒"}
      </span>
      <span className="seat-name">{seat.name}</span>
    </button>
  );
};
