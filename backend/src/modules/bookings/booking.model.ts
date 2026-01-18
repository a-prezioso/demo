/**
 * Booking domain model for desk reservations.
 */

export type BookingStatus = 'confirmed' | 'pending';

export interface Booking {
  id: string; // UUID
  userId: string;
  deskId: string; // keep as TEXT id to align with current desks model
  date: Date; // date-only (UTC midnight)
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}
