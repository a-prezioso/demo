import React from "react";
import { Seat } from "../types";

interface Props {
  seat: Seat | null;
  onClose: () => void;
  onBook?: (seat: Seat) => void;
}

export const InfoBottomSheet: React.FC<Props> = ({ seat, onClose, onBook }) => {
  const visible = Boolean(seat);
  return (
    <div className={`bottom-sheet ${visible ? "open" : ""}`} aria-hidden={!visible}>
      <div className="bottom-sheet-header">
        <button className="close-btn" onClick={onClose} aria-label="Chiudi">×</button>
        <div className="title">{seat?.name ?? "Postazione"}</div>
      </div>
      <div className="bottom-sheet-body">
        <div className="row">
          <span className="label">Stato:</span>
          <span className={`value status-${seat?.status?.toLowerCase()}`}>
            {seat?.status === "FREE" ? "Libero" : seat?.status === "BUSY" ? "Occupato" : "Non disponibile"}
          </span>
        </div>
        {seat?.description && (
          <div className="row">
            <span className="label">Info:</span>
            <span className="value">{seat.description}</span>
          </div>
        )}
      </div>
      <div className="bottom-sheet-actions">
        {seat && seat.status === "FREE" && (
          <button className="primary" onClick={() => onBook?.(seat)}>Prenota</button>
        )}
        <button className="secondary" onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
};
