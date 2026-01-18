import React from "react";
import { Seat } from "../types";

interface Props {
  seat: Seat | null;
  dateLabel: string; // es. 18/01/2026
  onConfirm: (seat: Seat) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export const ConfirmBookingModal: React.FC<Props> = ({ seat, dateLabel, onConfirm, onCancel, loading, error }) => {
  const visible = Boolean(seat);
  const title = seat ? `Conferma prenotazione` : "";
  const message = seat ? `Confermi la prenotazione della postazione ${seat.name} per la data ${dateLabel}?` : "";

  return (
    <div className={`modal ${visible ? "open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="confirm-booking-title" aria-hidden={!visible}>
      <div className="modal-backdrop" onClick={onCancel} />
      <div className="modal-content">
        <h2 id="confirm-booking-title" className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        {error && <div className="modal-error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button className="secondary" onClick={onCancel} disabled={loading}>Annulla</button>
          <button className="primary" onClick={() => seat && onConfirm(seat)} disabled={loading}>
            {loading ? "Conferma…" : "Conferma"}
          </button>
        </div>
      </div>
    </div>
  );
};
