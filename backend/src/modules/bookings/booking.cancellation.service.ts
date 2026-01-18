/**
 * Booking cancellation policy service
 *
 * Centralizes business rules for user-initiated cancellations with a 24h cutoff.
 *
 * Timezone assumptions
 * - All computations are performed in UTC.
 * - If a booking does not carry an explicit startAt (datetime), we derive it from the
 *   date-only field using the configured default start time (default 09:00 UTC).
 * - Precision: decision is based on exact hours (fractional hours allowed). Cutoff is strict:
 *   cancellation is allowed only if hoursBeforeStart > cutoffHours (e.g., strictly more than 24h).
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

export const DEFAULT_CANCELLATION_POLICY: Required<CancellationPolicyConfig> = {
  defaultStartHourUtc: 9,
  defaultStartMinuteUtc: 0,
  cutoffHours: 24,
};

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Reads policy configuration from environment variables.
 * - BOOKING_DEFAULT_START_HOUR_UTC (0..23)
 * - BOOKING_DEFAULT_START_MINUTE_UTC (0..59)
 * - BOOKING_CANCELLATION_CUTOFF_HOURS (>= 0)
 */
export function getCancellationPolicyFromEnv(): Required<CancellationPolicyConfig> {
  return {
    defaultStartHourUtc: envInt('BOOKING_DEFAULT_START_HOUR_UTC', DEFAULT_CANCELLATION_POLICY.defaultStartHourUtc),
    defaultStartMinuteUtc: envInt(
      'BOOKING_DEFAULT_START_MINUTE_UTC',
      DEFAULT_CANCELLATION_POLICY.defaultStartMinuteUtc,
    ),
    cutoffHours: envInt('BOOKING_CANCELLATION_CUTOFF_HOURS', DEFAULT_CANCELLATION_POLICY.cutoffHours),
  };
}

/**
 * Computes the UTC start datetime for a booking.
 */
export function computeStartAtUTC(
  booking: Pick<Booking, 'date' | 'startAt'>,
  cfg?: CancellationPolicyConfig,
): Date {
  if (booking.startAt instanceof Date) return booking.startAt;
  const policy = { ...DEFAULT_CANCELLATION_POLICY, ...(cfg || {}) } as Required<CancellationPolicyConfig>;
  // booking.date is normalized to UTC midnight; build Date.UTC with day components from it
  const year = booking.date.getUTCFullYear();
  const month = booking.date.getUTCMonth(); // 0-based
  const day = booking.date.getUTCDate();
  const d = new Date(Date.UTC(year, month, day, policy.defaultStartHourUtc, policy.defaultStartMinuteUtc, 0, 0));
  return d;
}

/**
 * Decides whether a booking can be canceled according to the cutoff policy.
 */
export function decideCancellation(
  booking: Pick<Booking, 'date' | 'startAt' | 'state'>,
  now: Date = new Date(),
  cfg?: CancellationPolicyConfig,
): CancellationDecision {
  const policy = { ...DEFAULT_CANCELLATION_POLICY, ...(cfg || {}) } as Required<CancellationPolicyConfig>;
  const startAt = computeStartAtUTC(booking, policy);

  // If already canceled by state, deny.
  if ((booking as any).state === 'CANCELLATA') {
    return { allowed: false, reason: 'booking.already_canceled', hoursBeforeStart: undefined, startAt, now };
  }

  const diffMs = startAt.getTime() - now.getTime();
  const hoursBeforeStart = diffMs / 3600000; // may be negative

  // Allowed only if strictly more than cutoff hours remain
  const allowed = hoursBeforeStart > policy.cutoffHours;
  return allowed
    ? { allowed: true, hoursBeforeStart, startAt, now }
    : {
        allowed: false,
        reason: 'booking.cancellation_cutoff_24h',
        hoursBeforeStart,
        startAt,
        now,
      };
}
