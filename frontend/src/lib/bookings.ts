import { apiFetch } from './api';

export interface CreateBookingPayload {
  deskId: string;
  date: string; // ISO date or yyyy-mm-dd
  timeSlot?: string | null;
}

export interface BookingResponse {
  id: string;
  deskId: string;
  date: string;
  timeSlot?: string | null;
  status?: string;
}

export async function createBooking(payload: CreateBookingPayload, token?: string, baseUrl = '') {
  // Convention: backend returns { success: true, data: {...} }
  const res = await apiFetch<{ success?: boolean; data?: BookingResponse } | BookingResponse>(`${baseUrl}/api/bookings`, {
    method: 'POST',
    body: payload,
    token,
  });
  if ((res as any)?.data) return (res as any).data as BookingResponse;
  return res as BookingResponse;
}
