/**
 * Bookings controller: create desk reservation with closed-days validation.
 * Endpoint shapes supported by frontend client:
 * - POST /api/desks/:deskId/book  { date }
 * - POST /api/bookings            { deskId, date, userId? }
 *
 * Authentication: ideally use access token to identify user; for demo we accept optional userId.
 */

import type { RequestLike, ResponseLike } from '../auth/auth.controller';
import type { AuthenticatedRequestLike } from '../auth/jwt.middleware';
import { computeDisabledDates, parseIsoDate } from '../../modules/calendar/holiday.service';
import { createBooking, findBookingByDeskAndDate, countUserBookingsOnDate } from '../../modules/bookings/booking.repository';

function normalizeDateOnly(input: string): Date | null {
  const d = parseIsoDate(input);
  if (!d) return null;
  // normalize to UTC midnight
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isClosedDate(date: Date): boolean {
  const iso = date.toISOString().slice(0, 10);
  const disabled = computeDisabledDates(date, date);
  return disabled.includes(iso);
}

function getAuthUserId(req: AuthenticatedRequestLike, fallback?: string | null): string | null {
  if (req && req.user && req.user.id) return req.user.id;
  // fallback for demo/stub
  if (fallback && typeof fallback === 'string' && fallback.trim() !== '') return fallback;
  return null;
}

async function handleCreate(userId: string, deskId: string, dateIso: string, res: ResponseLike) {
  // 1) validate inputs
  if (!deskId || typeof deskId !== 'string') {
    res.status(400).json({ error: 'invalid_input', details: { deskId: 'required' } });
    return;
  }
  const date = normalizeDateOnly(dateIso || '');
  if (!date) {
    res.status(400).json({ error: 'invalid_input', details: { date: 'invalid_format' } });
    return;
  }

  // 2) closed days validation
  if (isClosedDate(date)) {
    res.status(422).json({ code: 'COWORKING_CLOSED', message: 'Il coworking è chiuso in questa data' });
    return;
  }

  // 3) basic conflict validations
  const existing = await findBookingByDeskAndDate(deskId, date);
  if (existing) {
    res.status(409).json({ code: 'DESK_ALREADY_BOOKED', message: 'La postazione è già prenotata in questa data' });
    return;
  }

  const userBookings = await countUserBookingsOnDate(userId, date);
  if (userBookings > 0) {
    res.status(409).json({ code: 'USER_ALREADY_BOOKED', message: 'Hai già una prenotazione in questa data' });
    return;
  }

  // 4) persist
  try {
    const booking = await createBooking({ userId, deskId, date, status: 'confirmed' });
    res.status(201).json({
      bookingId: booking.id,
      status: booking.status,
      deskId: booking.deskId,
      date: booking.date.toISOString().slice(0, 10),
      message: 'Prenotazione confermata',
    });
  } catch (e: any) {
    const msg = String(e && e.message ? e.message : 'error');
    if (/unique/i.test(msg) || /duplicate/i.test(msg) || /constraint/i.test(msg)) {
      res.status(409).json({ code: 'DESK_ALREADY_BOOKED', message: 'La postazione è già prenotata in questa data' });
      return;
    }
    res.status(500).json({ error: 'internal_error' });
  }
}

// Handler for POST /api/desks/:deskId/book
export async function bookDeskHandler(req: AuthenticatedRequestLike & { params?: any; body?: any }, res: ResponseLike) {
  const deskId = req?.params?.deskId || (req as any).deskId || (req as any)?.body?.deskId;
  const date = (req as any)?.body?.date;
  const userId = getAuthUserId(req, (req as any)?.body?.userId || null);
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  await handleCreate(userId, String(deskId || ''), String(date || ''), res);
}

// Handler for POST /api/bookings
export async function createBookingHandler(req: AuthenticatedRequestLike & { body?: any }, res: ResponseLike) {
  const deskId = (req as any)?.body?.deskId;
  const date = (req as any)?.body?.date;
  const userId = getAuthUserId(req, (req as any)?.body?.userId || null);
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  await handleCreate(userId, String(deskId || ''), String(date || ''), res);
}
