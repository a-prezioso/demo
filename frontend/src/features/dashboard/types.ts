// Types for dashboard seats

export type SeatStatus = "FREE" | "BUSY" | "UNAVAILABLE";

export interface Seat {
  id: string;
  name: string; // e.g., A1, A2
  status: SeatStatus;
  // optional metadata
  description?: string;
}
