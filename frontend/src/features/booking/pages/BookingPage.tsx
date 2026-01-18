import React, { useState } from "react";
import { DatePicker } from "../components/DatePicker";

export const BookingPage: React.FC = () => {
  const [date, setDate] = useState<string | null>(null);

  return (
    <div className="booking-page">
      <h1>Prenota una postazione</h1>
      <label htmlFor="booking-date">Data</label>
      <DatePicker value={date} onChange={setDate} />
      {date && <div className="selected-date">Data selezionata: {date}</div>}
    </div>
  );
};
