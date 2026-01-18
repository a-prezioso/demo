/**
 * Booking cancellation policy service
 */

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

const DEFAULTS: Required<CancellationPolicyConfig> = {
  defaultStartHourUtc: 9,
  defaultStartMinuteUtc: 0,
  cutoffHours: 24,
};

export function computeStartAt(date: Date, cfg: Required<CancellationPolicyConfig>): Date {
  const iso = date.toISOString().slice(0, 10);
  return new Date(`${iso}T${String(cfg.defaultStartHourUtc).padStart(2, '0')}:${String(
    cfg.defaultStartMinuteUtc,
  ).padStart(2, '0')}:00.000Z`);
}

export function canUserCancelBooking(
  booking: { date: Date; startAt?: Date | null },
  config?: CancellationPolicyConfig,
  now?: Date,
): CancellationDecision {
  const cfg = { ...DEFAULTS, ...(config || {}) } as Required<CancellationPolicyConfig>;
  const current = now ?? new Date();
  const start = booking.startAt ?? computeStartAt(booking.date, cfg);
  const diffMs = start.getTime() - current.getTime();
  const hours = diffMs / (1000 * 60 * 60);

  if (hours >= cfg.cutoffHours) {
    return { allowed: true, startAt: start, now: current, hoursBeforeStart: hours };
  }
  return {
    allowed: false,
    reason: 'CUTOFF_24H_NOT_MET',
    startAt: start,
    now: current,
    hoursBeforeStart: hours,
  };
}
