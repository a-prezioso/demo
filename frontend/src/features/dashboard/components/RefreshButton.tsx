import React from "react";

interface Props {
  onClick: () => void;
}

export const RefreshButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button className="fab-refresh" onClick={onClick} aria-label="Aggiorna">
      ⟳
    </button>
  );
};
