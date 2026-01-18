import { computeBookingState } from '../booking.state.service';

declare const jest: any;

describe('booking.state.service - computeBookingState', () => {
  test('returns CANCELLATA when canceled flag is true', () => {
    const date = new Date('2025-01-10T00:00:00Z');
    const state = computeBookingState({ date, canceled: true }, new Date('2025-01-01T00:00:00Z'));
    expect(state).toBe('CANCELLATA');
  });

  test('returns PASSATA when date is before today (UTC)', () => {
    const state = computeBookingState({ date: new Date('2025-01-09T00:00:00Z') }, new Date('2025-01-10T12:00:00Z'));
    expect(state).toBe('PASSATA');
  });

  test('returns ATTIVA when date equals today (UTC)', () => {
    const state = computeBookingState({ date: new Date('2025-01-10T00:00:00Z') }, new Date('2025-01-10T01:23:45Z'));
    expect(state).toBe('ATTIVA');
  });

  test('returns ATTIVA when date is after today (UTC)', () => {
    const state = computeBookingState({ date: new Date('2025-01-11T00:00:00Z') }, new Date('2025-01-10T23:59:59Z'));
    expect(state).toBe('ATTIVA');
  });
});
