/**
 * Paid Pro period math shared by the client (local entitlement) and the server
 * (PayonifyStore subscription records). Periods are calendar-aligned from the
 * payment moment: monthly = +1 calendar month, annual = +1 calendar year.
 */

export type ProPlanId = 'pro_monthly' | 'pro_annual' | 'pro_monthly_zwg' | string;
export type ProInterval = 'month' | 'year';

export function intervalForPlanId(planId: string | null | undefined): ProInterval {
  if (!planId) return 'month';
  return planId.includes('annual') ? 'year' : 'month';
}

/** Add one billing interval to `from`, calendar-safe (handles month-end overflow). */
export function addBillingInterval(from: Date, interval: ProInterval): Date {
  const d = new Date(from.getTime());
  if (interval === 'year') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export function computePeriodEnd(
  start: Date | string | number = new Date(),
  planIdOrInterval: ProPlanId | ProInterval = 'month'
): Date {
  const startDate = start instanceof Date ? start : new Date(start);
  const interval: ProInterval =
    planIdOrInterval === 'month' || planIdOrInterval === 'year'
      ? planIdOrInterval
      : intervalForPlanId(String(planIdOrInterval));
  return addBillingInterval(startDate, interval);
}

export function computePeriodEndIso(
  start: Date | string | number = new Date(),
  planIdOrInterval: ProPlanId | ProInterval = 'month'
): string {
  return computePeriodEnd(start, planIdOrInterval).toISOString();
}

/** True when expiresAt is missing/invalid OR strictly in the past. */
export function isProPeriodExpired(expiresAt: string | null | undefined, now: Date = new Date()): boolean {
  if (!expiresAt) return true;
  const t = Date.parse(expiresAt);
  if (!Number.isFinite(t)) return true;
  return t <= now.getTime();
}

/**
 * Whole local calendar days from today until the expiry date (not a raw 24h ceil).
 * Expires later today → 0; expires tomorrow → 1; expires in 3 calendar days → 3.
 * 0 if expired/missing. Used for renewal reminders ("3 days before") and UI chips.
 */
export function daysRemainingInPeriod(expiresAt: string | null | undefined, now: Date = new Date()): number {
  if (!expiresAt) return 0;
  const end = new Date(expiresAt);
  if (!Number.isFinite(end.getTime())) return 0;
  // Already past the exact instant → expired.
  if (end.getTime() <= now.getTime()) return 0;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfEndDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = Math.round((startOfEndDay.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(0, diffDays);
}

export function formatProExpiry(expiresAt: string | null | undefined): string {
  if (!expiresAt) return '';
  const d = new Date(expiresAt);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function planLabel(planId: string | null | undefined): string {
  switch (planId) {
    case 'pro_annual':
      return 'G-Deck Pro (Annual)';
    case 'pro_monthly_zwg':
      return 'G-Deck Pro (Monthly ZWG)';
    case 'pro_monthly':
    default:
      return 'G-Deck Pro (Monthly)';
  }
}

export function planPriceLabel(planId: string | null | undefined): string {
  switch (planId) {
    case 'pro_annual':
      return '$120/year';
    case 'pro_monthly_zwg':
      return 'ZWG 320/month';
    case 'pro_monthly':
    default:
      return '$12/month';
  }
}
