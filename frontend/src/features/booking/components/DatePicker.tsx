import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchDisabledDates } from "../api/calendarApi";

// Minimal headless date picker wrapper using native input type=date for demo purposes.
// It supports disabling specific dates and all Sundays via isDateDisabled predicate.

interface Props {
  value?: string | null; // YYYY-MM-DD
  onChange?: (value: string | null) => void;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
}

// Helpers
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

function isSunday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m - 1), d));
  // Use UTC to avoid TZ shifts for all-day dates
  return dt.getUTCDay() === 0; // Sunday
}

export const DatePicker: React.FC<Props> = ({ value, onChange, min, max }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [disabledDates, setDisabledDates] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const monthRange = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return { start: formatDate(start), end: formatDate(end) };
  }, [currentMonth]);

  const loadDisabled = useCallback(async () => {
    try {
      setError(null);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const dates = await fetchDisabledDates({ start: monthRange.start, end: monthRange.end }, ac.signal);
      // Ensure Sundays are disabled even if API misses them
      const ensured = new Set<string>(dates);
      // Also add Sundays within the month range
      const start = new Date(monthRange.start + "T00:00:00Z");
      const end = new Date(monthRange.end + "T00:00:00Z");
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        const s = formatDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
        if (isSunday(s)) ensured.add(s);
      }
      setDisabledDates(ensured);
    } catch (e) {
      console.error(e);
      setError("Impossibile caricare i giorni non prenotabili");
      // Fallback: at least disable Sundays in current month
      const ensured = new Set<string>();
      const start = new Date(monthRange.start + "T00:00:00Z");
      const end = new Date(monthRange.end + "T00:00:00Z");
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        const s = formatDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
        if (isSunday(s)) ensured.add(s);
      }
      setDisabledDates(ensured);
    }
  }, [monthRange.end, monthRange.start]);

  useEffect(() => {
    loadDisabled();
    return () => abortRef.current?.abort();
  }, [loadDisabled]);

  const isDisabled = useCallback((dateStr: string) => {
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    if (disabledDates.has(dateStr)) return true;
    if (isSunday(dateStr)) return true; // ensure Sundays are always disabled
    return false;
  }, [disabledDates, min, max]);

  // For native input type=date we cannot visually disable specific dates,
  // so we intercept change and block invalid selections.
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const v = e.target.value || null;
    if (v && isDisabled(v)) {
      // prevent selection
      e.preventDefault();
      // Reset input value to previous valid value
      if (value) e.target.value = value;
      else e.target.value = "";
      return;
    }
    onChange?.(v);
  };

  const goPrevMonth = () => setCurrentMonth((d) => startOfMonth(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
  const goNextMonth = () => setCurrentMonth((d) => startOfMonth(new Date(d.getFullYear(), d.getMonth() + 1, 1)));

  return (
    <div className="date-picker">
      <div className="date-picker-header">
        <button type="button" onClick={goPrevMonth} aria-label="Mese precedente">◀</button>
        <div className="month-label">
          {currentMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </div>
        <button type="button" onClick={goNextMonth} aria-label="Mese successivo">▶</button>
      </div>
      <div className="date-picker-input">
        <input type="date" value={value ?? ""} onChange={handleChange} min={min} max={max} />
      </div>
      <div className="date-picker-legend" role="note">
        Alcuni giorni sono bloccati per festività o chiusura coworking.
      </div>
      {error && <div className="date-picker-error" role="alert">{error}</div>}
      {/* Debug helper: list disabled dates for current month */}
      {/* <pre>{JSON.stringify([...disabledDates], null, 2)}</pre> */}
    </div>
  );
};
