/**
 * Booking domain model for desk reservations.
 */

export type BookingStatus = 'confirmed' | 'pending';

// New state enum managed by backend logic
export type BookingState = 'PASSATA' | 'ATTIVA' | 'CANCELLATA';

export interface Booking {
  id: string; // UUID
  userId: string;
  deskId: string; // keep as TEXT id to align with current desks model
  date: Date; // date-only (UTC midnight)
  status: BookingStatus; // legacy status kept for backward compatibility
  // New derived/managed state (optional for retro-compatibility)
  state?: BookingState;
  createdAt: Date;
  updatedAt: Date;
}
