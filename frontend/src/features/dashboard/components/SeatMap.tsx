import React from "react";
import { Seat } from "../types";
import { SeatMarker } from "./SeatMarker";

interface Props {
  seats: Seat[];
  selectedId?: string | null;
  onSelect?: (seat: Seat) => void;
}

// Simple 3x4 responsive grid map
export const SeatMap: React.FC<Props> = ({ seats, selectedId, onSelect }) => {
  return (
    <div className="seat-map" role="grid" aria-label="Mappa postazioni">
      {seats.map((s) => (
        <div role="gridcell" key={s.id} className="seat-cell">
          <SeatMarker seat={s} selected={selectedId === s.id} onClick={onSelect} />
        </div>
      ))}
    </div>
  );
};
