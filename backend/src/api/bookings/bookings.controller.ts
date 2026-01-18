/**
 * Bookings controller: create desk reservation with closed-days validation.
 * Endpoint shapes supported by frontend client:
 * - POST /api/desks/:deskId/book  { date }
 * - POST /api/bookings            { deskId, date, userId? }
 * - DELETE /api/bookings/:id      cancella la prenotazione (regole dominio)
 * - POST /api/bookings/:id/cancel idem
 *
 * Authentication: ideally use access token to identify user; for demo we accept optional userId.
 */

import type { RequestLike, ResponseLike } from '../auth/auth.controller';
import type { AuthenticatedRequestLike } from '../auth/jwt.middleware';
import { computeDisabledDates, parseIsoDate } from '../../modules/calendar/holiday.service';
import { createBooking, findBookingByDeskAndDate, countUserBookingsOnDate, listUserBookings, cancelBookingForUser, findBookingById } from '../../modules/bookings/booking.repository';
import type { BookingState } from '../../modules/bookings/booking.model';
import { computeBookingState } from '../../modules/bookings/booking.state.service';

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
    // Ignore any client-provided state in input by not reading it at all.
    const booking = await createBooking({ userId, deskId, date, status: 'confirmed' });
    const computedState: BookingState = (booking as any).state || computeBookingState({ date: booking.date });
    res.status(201).json({
      bookingId: booking.id,
      status: booking.status,
      deskId: booking.deskId,
      date: booking.date.toISOString().slice(0, 10),
      state: computedState,
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
  // Explicitly ignore any "state" provided by client
  const _ignoredState = (req as any)?.body?.state; // eslint-disable-line @typescript-eslint/no-unused-vars
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
  // Explicitly ignore any "state" provided by client
  const _ignoredState = (req as any)?.body?.state; // eslint-disable-line @typescript-eslint/no-unused-vars
  const userId = getAuthUserId(req, (req as any)?.body?.userId || null);
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  await handleCreate(userId, String(deskId || ''), String(date || ''), res);
}

// Handler for GET /api/bookings/me?page=&size=&includeCanceled=
export async function listMyBookingsHandler(req: AuthenticatedRequestLike & { query?: any }, res: ResponseLike) {
  const userId = getAuthUserId(req, null);
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const page = Number((req as any)?.query?.page || 1);
  const size = Number((req as any)?.query?.size || 20);
  const includeCanceled = String((req as any)?.query?.includeCanceled || 'false') === 'true';

  try {
    const result = await listUserBookings(userId, { page, size, includeCanceled });
    // Ensure each item has a state computed by backend logic
    const items = (result.items || []).map((it: any) => {
      if (it && it.state) return it;
      const dateStr: string = it && it.startDate ? String(it.startDate) : '';
      const d = normalizeDateOnly(dateStr);
      const computed = d ? computeBookingState({ date: d }) : 'ATTIVA';
      return { ...it, state: computed };
    });
    res.status(200).json({
      page: result.page,
      size: result.size,
      total: result.total,
      items,
    });
  } catch (_e) {
    res.status(500).json({ error: 'internal_error' });
  }
}

// DELETE /api/bookings/:id
export async function deleteBookingHandler(req: AuthenticatedRequestLike & { params?: any }, res: ResponseLike) {
  const userId = getAuthUserId(req, null);
  if (!userId) { res.status(401).json({ error: 'unauthorized' }); return; }
  const id = String(req?.params?.id || '');
  if (!id) { res.status(400).json({ error: 'invalid_input', details: { id: 'required' } }); return; }

  // Business rule: cannot cancel a past booking
  const existing = await findBookingById(id);
  if (!existing || existing.userId !== userId) { res.status(404).json({ error: 'not_found' }); return; }
  const state = computeBookingState({ date: existing.date });
  if (state === 'PASSATA') { res.status(409).json({ code: 'BOOKING_ALREADY_PAST', message: 'Impossibile cancellare una prenotazione già passata' }); return; }

  const updated = await cancelBookingForUser(id, userId);
  if (!updated) { res.status(404).json({ error: 'not_found' }); return; }
  res.status(200).json({ id: updated.id, state: updated.state || computeBookingState({ date: updated.date, canceled: true }) });
}

// POST /api/bookings/:id/cancel
export async function cancelBookingHandler(req: AuthenticatedRequestLike & { params?: any }, res: ResponseLike) {
  return deleteBookingHandler(req, res);
}
