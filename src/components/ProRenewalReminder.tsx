import React, { useEffect, useRef } from 'react';
import { usePlan } from '../context/PlanContext';
import { useNotifications } from '../context/NotificationContext';
import { daysRemainingInPeriod, formatProExpiry, planPriceLabel } from '../lib/billing-period';

/**
 * Daily Pro renewal reminders for the last 3 calendar days of a paid period.
 *
 * Fires once per local calendar day while:
 *   1 <= daysRemaining <= 3  (and Pro is still active)
 *
 * Delivers:
 *   - In-app bell + toast (always, if notifyBilling is on)
 *   - Browser Notification push when desktop push is enabled + permission granted
 *
 * Dedup key: gdeck_pro_renewal_notified_day = "YYYY-MM-DD" (local).
 * Window must be open (or revisited that day) for the reminder to fire — there is
 * no background service worker / server push yet.
 */

const STORAGE_DAY = 'gdeck_pro_renewal_notified_day';
/** Inclusive upper bound: remind on day 3, day 2, day 1 before expiry. */
export const PRO_RENEWAL_REMINDER_DAYS = 3;
const CHECK_EVERY_MS = 60 * 1000; // 1 min — cheap; day key still blocks re-fire

function localDayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildCopy(daysLeft: number, expiresLabel: string, planId: string | null) {
  const price = planPriceLabel(planId || 'pro_monthly');
  if (daysLeft <= 1) {
    return {
      title: 'Pro expires tomorrow',
      message: `Your G-Deck Pro period ends ${
        expiresLabel ? `on ${expiresLabel}` : 'within a day'
      }. Renew today (${price}) so unlimited AI and every Pro feature stay on.`,
      priority: 'urgent' as const,
    };
  }
  if (daysLeft === 2) {
    return {
      title: 'Pro renews in 2 days',
      message: `Your G-Deck Pro period ends on ${expiresLabel || 'the day after tomorrow'}. Renew now (${price}) to keep unlimited AI without a gap.`,
      priority: 'high' as const,
    };
  }
  return {
    title: `Pro renews in ${daysLeft} days`,
    message: `Your G-Deck Pro period ends on ${expiresLabel || 'soon'}. You have ${daysLeft} days left — renew (${price}) anytime so nothing turns off.`,
    priority: 'high' as const,
  };
}

/**
 * Pure helper exported for unit tests.
 * Returns the reminder payload if one should fire now, else null.
 */
export function shouldSendProRenewalReminder(opts: {
  isPro: boolean;
  proExpiresAt: string | null;
  lastNotifiedDay: string | null;
  now?: Date;
  windowDays?: number;
}): { daysLeft: number; dayKey: string } | null {
  const now = opts.now || new Date();
  const windowDays = opts.windowDays ?? PRO_RENEWAL_REMINDER_DAYS;
  if (!opts.isPro || !opts.proExpiresAt) return null;

  const daysLeft = daysRemainingInPeriod(opts.proExpiresAt, now);
  if (daysLeft < 1 || daysLeft > windowDays) return null;

  const dayKey = localDayKey(now);
  if (opts.lastNotifiedDay === dayKey) return null;

  return { daysLeft, dayKey };
}

export const ProRenewalReminder: React.FC = () => {
  const { isPro, proExpiresAt, proExpiresLabel, proPlanId, openUpgradeModal } = usePlan();
  const { addNotification, settings } = useNotifications();
  const lastFiredDayRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      lastFiredDayRef.current = localStorage.getItem(STORAGE_DAY);
    } catch {
      lastFiredDayRef.current = null;
    }
  }, []);

  useEffect(() => {
    const run = () => {
      if (!settings.notifyBilling) return;

      let lastDay = lastFiredDayRef.current;
      try {
        lastDay = localStorage.getItem(STORAGE_DAY) || lastDay;
      } catch {}

      const decision = shouldSendProRenewalReminder({
        isPro,
        proExpiresAt,
        lastNotifiedDay: lastDay,
      });
      if (!decision) return;

      const expiresLabel = proExpiresLabel || formatProExpiry(proExpiresAt);
      const copy = buildCopy(decision.daysLeft, expiresLabel, proPlanId);

      addNotification({
        title: copy.title,
        message: copy.message,
        category: 'billing',
        priority: copy.priority,
        actionTab: 'upgrade',
        actionText: 'Renew Pro',
        // tag collapses duplicate OS notifications for the same day
        tag: `gdeck-pro-renewal-${decision.dayKey}`,
      });

      lastFiredDayRef.current = decision.dayKey;
      try {
        localStorage.setItem(STORAGE_DAY, decision.dayKey);
      } catch {}
    };

    run();
    const id = window.setInterval(run, CHECK_EVERY_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVis);
    // Midnight rollover: schedule a one-shot at local midnight + 2s, then rely on interval.
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2, 0);
    const midnightTimer = window.setTimeout(run, Math.max(1000, nextMidnight.getTime() - now.getTime()));

    return () => {
      window.clearInterval(id);
      window.clearTimeout(midnightTimer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [isPro, proExpiresAt, proExpiresLabel, proPlanId, settings.notifyBilling, addNotification]);

  // Desktop notification / in-app toast "Renew Pro" → open upgrade modal.
  useEffect(() => {
    const onUpgrade = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      openUpgradeModal({
        isRenewal: true,
        title: detail.title || 'Renew G-Deck Pro',
        desc:
          detail.desc ||
          'Your Pro period is ending soon. Pay again to keep unlimited AI and every Pro feature.',
      });
    };
    window.addEventListener('gdeck_open_upgrade', onUpgrade as EventListener);
    return () => window.removeEventListener('gdeck_open_upgrade', onUpgrade as EventListener);
  }, [openUpgradeModal]);

  return null;
};

export default ProRenewalReminder;
