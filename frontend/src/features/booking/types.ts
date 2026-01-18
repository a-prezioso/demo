// Types for booking calendar/datepicker

export interface DisabledDatesResponse {
  // Preferred shape from backend
  dates?: string[]; // ISO date strings YYYY-MM-DD
  // Fallback: backend may return string[] directly
}
