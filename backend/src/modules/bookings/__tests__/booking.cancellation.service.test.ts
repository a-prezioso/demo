import { canCancelBooking, computeStartAtUTC } from '../booking.cancellation.service';
import type { Booking } from '../booking.model';

function makeBooking(dateIso: string): Booking {
  return {
    id: 'b1',
    userId: 'u1',
    deskId: 'd1',
    date: new Date(`${dateIso}T00:00:00.000Z`),
    status: 'confirmed',
    createdAt: new Date(`${dateIso}T00:00:00.000Z`),
    updatedAt: new Date(`${dateIso}T00:00:00.000Z`),
  };
}

describe('booking.cancellation.service', () => {
  test('computeStartAtUTC builds start at default 09:00Z', () => {
    const d = new Date('2025-02-10T00:00:00.000Z');
    const start = computeStartAtUTC(d);
    expect(start.toISOString()).toBe('2025-02-10T09:00:00.000Z');
  });

  test('canCancelBooking allows only if more than 24 hours before start', () => {
    const booking = makeBooking('2025-02-10');

    // Now set to 2025-02-09T08:59Z -> start at 2025-02-10T09:00Z, diff just over 24h
    const now1 = new Date('2025-02-09T08:59:00.000Z');
    const res1 = canCancelBooking(booking, { now: now1 });
    expect(res1.allowed).toBe(true);

    // Now exactly 24h before -> not allowed
    const now2 = new Date('2025-02-09T09:00:00.000Z');
    const res2 = canCancelBooking(booking, { now: now2 });
    expect(res2.allowed).toBe(false);

    // Inside 24h window -> not allowed
    const now3 = new Date('2025-02-09T10:00:00.000Z');
    const res3 = canCancelBooking(booking, { now: now3 });
    expect(res3.allowed).toBe(false);
  });

  test('policy can be customized (e.g., start time and cutoff)', () => {
    const booking = makeBooking('2025-02-10');
    const now = new Date('2025-02-09T08:00:00.000Z');
    const res = canCancelBooking(booking, { now, policy: { defaultStartHourUtc: 8, cutoffHours: 12 } });
    // start at 08:00Z next day -> 24h; cutoff 12h, 24 > 12 -> allowed
    expect(res.allowed).toBe(true);
  });
});
