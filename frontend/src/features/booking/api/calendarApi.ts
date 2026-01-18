import { DisabledDatesResponse } from "../types";

export interface FetchDisabledDatesParams {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export async function fetchDisabledDates(params: FetchDisabledDatesParams, signal?: AbortSignal): Promise<string[]> {
  const qs = new URLSearchParams({ start: params.start, end: params.end }).toString();
  const res = await fetch(`/api/calendar/disabled-dates?${qs}`, { signal });
  if (!res.ok) {
    throw new Error("FAILED_TO_FETCH_DISABLED_DATES");
  }
  const data: DisabledDatesResponse | string[] = await res.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.dates)) return data.dates;
  return [];
}
