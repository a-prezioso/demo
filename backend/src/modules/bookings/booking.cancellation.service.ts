/**
 * Booking cancellation domain service
 *
 * Rule: a standard user can cancel a booking only if NOW + 24 hours <= booking start datetime.
 *
 * Timezone policy:
 * - We operate in UTC for deterministic server-side behavior.
 * - If a per-booking start datetime is not available, we derive it from the booking.date (date-only)
 *   by applying a configurable start hour/minute in UTC (default 09:00 UTC).
 *
 * This service centralizes the rule so it can be reused by API/controller layers and repositories.
 */

import type { Booking } from './booking.model';

export interface CancellationPolicyConfig {
  // When booking.startAt is not present, compute start as booking.date at this time (UTC)
  defaultStartHourUtc?: number; // 0..23 (default: 9)
  defaultStartMinuteUtc?: number; // 0..59 (default: 0)
  cutoffHours?: number; // hours threshold (default: 24)
}

export interface CancellationDecision {
  allowed: boolean;
  reason?: string; // i18n key or human message
  hoursBeforeStart?: number; // informational
  startAt: Date; // computed or provided start datetime (UTC)
  now: Date;
}

const DEFAULT_POLICY: Required<CancellationPolicyConfig> = {
  defaultStartHourUtc: 9,
  defaultStartMinuteUtc: 0,
  cutoffHours: 24,
};

export function computeStartAtUTC(dateOnly: Date, cfg?: CancellationPolicyConfig): Date {
  const p = { ...DEFAULT_POLICY, ...(cfg || {}) };
  // dateOnly is expected to be at 00:00:00.000Z (UTC midnight). We construct an ISO using UTC parts.
  const isoDate = dateOnly.toISOString().slice(0, 10);
  const hh = String(p.defaultStartHourUtc).padStart(2, '0');
  const mm = String(p.defaultStartMinuteUtc).padStart(2, '0');
  return new Date(`${isoDate}T${hh}:${mm}:00.000Z`);
}

export function hoursDiff(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60);
}

export function canCancelBooking(
  booking: Booking,
  opts?: { now?: Date; policy?: CancellationPolicyConfig },
): CancellationDecision {
  const now = opts?.now ?? new Date();
  const policy = { ...DEFAULT_POLICY, ...(opts?.policy || {}) };

  const startAt = booking.startAt ?? computeStartAtUTC(booking.date, policy);
  const h = hoursDiff(now, startAt);

  if (h > policy.cutoffHours) {
    return { allowed: true, hoursBeforeStart: h, startAt, now };
  }
  return {
    allowed: false,
    reason: 'booking.cancel.too_close_to_start',
    hoursBeforeStart: h,
    startAt,
    now,
  };
}
