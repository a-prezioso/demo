// Domain entity for Booking and booking state management
// Note: date is date-only semantics (Europe/Rome). Avoid logging sensitive PII.

export type BookingState = 'PASSATA' | 'ATTIVA' | 'CANCELLATA';

export interface Booking {
  id: string;
  userId: string;
  deskId: string;
  date: string; // YYYY-MM-DD
  // Start/end instants (UTC ISO) optional; if absent, UI/logic fall back to 09:00 local
  startAt?: string | null;
  endAt?: string | null;
  status: BookingState;
  cancelledAt?: string | null; // ISO string
  createdAt: string;
  updatedAt: string;
}
