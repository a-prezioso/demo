/**
 * Booking repository
 */

import { query } from '../../db/client';
import type { Booking, BookingStatus } from './booking.model';

interface DbBookingRow {
  id: string;
  user_id: string;
  desk_id: string;
  date: string; // YYYY-MM-DD
  status: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: DbBookingRow): Booking {
  return {
    id: row.id,
    userId: row.user_id,
    deskId: row.desk_id,
    date: new Date(`${row.date}T00:00:00.000Z`),
    status: (row.status as BookingStatus) || 'confirmed',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface CreateBookingParams {
  userId: string;
  deskId: string;
  date: Date; // normalized date-only UTC
  status?: BookingStatus;
}

export async function createBooking(params: CreateBookingParams): Promise<Booking> {
  const sql = `
    INSERT INTO bookings (user_id, desk_id, date, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const res = await query<DbBookingRow>(sql, [
    params.userId,
    params.deskId,
    // Store as DATE without time in DB; pass ISO yyyy-mm-dd
    params.date.toISOString().slice(0, 10),
    params.status || 'confirmed',
  ]);
  return mapRow(res.rows[0]);
}

export async function findBookingByDeskAndDate(deskId: string, date: Date): Promise<Booking | null> {
  const sql = 'SELECT * FROM bookings WHERE desk_id = $1 AND date = $2 LIMIT 1';
  const res = await query<DbBookingRow>(sql, [deskId, date.toISOString().slice(0, 10)]);
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

export async function countUserBookingsOnDate(userId: string, date: Date): Promise<number> {
  const sql = 'SELECT COUNT(1) AS c FROM bookings WHERE user_id = $1 AND date = $2';
  const res = await query<{ c: string }>(sql, [userId, date.toISOString().slice(0, 10)]);
  const c = res.rows[0] && (res.rows[0] as any).c;
  return c ? parseInt(c, 10) : 0;
}
