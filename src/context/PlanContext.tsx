import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  computePeriodEndIso,
  daysRemainingInPeriod,
  formatProExpiry,
  intervalForPlanId,
  isProPeriodExpired,
  planLabel,
  planPriceLabel,
  type ProInterval,
} from '../lib/billing-period';

export type PlanTier = 'free' | 'pro';

export interface GoogleAccountProfile {
  id: string;
  email: string;
  name: string;
  type: 'personal' | 'work';
  company?: string;
  avatar?: string;
}

export interface UpgradeModalContext {
  title?: string;
  desc?: string;
  isAiLimit?: boolean;
  /** True when Pro just expired and the user must pay again. */
  isRenewal?: boolean;
}

export interface ActivateProOptions {
  /** pro_monthly | pro_annual | pro_monthly_zwg */
  planId?: string;
  /** ISO start; defaults to now. Renewals extend from max(now, current expiry). */
  paidAt?: string;
  /** Override computed end (ISO). */
  expiresAt?: string;
  orderId?: string;
}

export interface PlanContextType {
  tier: PlanTier;
  isPro: boolean;
  /** Active Pro plan id, or null on free. */
  proPlanId: string | null;
  /** ISO timestamp when the current paid period ends. null on free. */
  proExpiresAt: string | null;
  /** Calendar days left in the paid period (0 if free/expired). */
  proDaysRemaining: number;
  /** Human label e.g. "Sep 20, 2026". */
  proExpiresLabel: string;
  /** True when Pro lapsed and the user must check out again. */
  needsRenewal: boolean;
  /** AI messages used in the current calendar month (free tier). */
  aiQueriesUsed: number;
  /** Free-plan monthly AI message allowance (10). */
  maxFreeAiQueries: number;
  /** Messages still available this month on free; Infinity for Pro. */
  aiQueriesRemaining: number;
  canUseAi: boolean;
  /** YYYY-MM key the free counter is currently billed against. */
  aiQuotaMonth: string;
  incrementAiQuery: () => boolean;
  requirePro: (featureTitle?: string, featureDesc?: string) => boolean;
  openUpgradeModal: (ctx?: UpgradeModalContext) => void;
  closeUpgradeModal: () => void;
  upgradeModalOpen: boolean;
  upgradeModalContext: UpgradeModalContext | null;
  /**
   * Activate or renew Pro after a verified Payonify payment.
   * Prefer activatePro({ planId }) so the period matches the plan billed.
   * Bare upgradeToPro() defaults to one month (legacy callers).
   */
  upgradeToPro: (opts?: ActivateProOptions | string) => void;
  activatePro: (opts?: ActivateProOptions) => void;
  readonly isProductionBuild: boolean;
  downgradeToFree: (reason?: 'expired' | 'manual') => void;
  /** Development only: a no-op in production builds. */
  setMockPlan: (
    tier: PlanTier,
    mockAiCount?: number,
    mock?: { planId?: string; expiresInMs?: number; expiresAt?: string }
  ) => void;
  // Multi-Account Switching (Pro feature)
  accounts: GoogleAccountProfile[];
  activeAccount: GoogleAccountProfile;
  switchAccount: (accountId: string) => boolean;
  // Offline & Priority Sync
  prioritySyncActive: boolean;
  togglePrioritySync: () => boolean;
  syncLatencyMs: number;
}

/** Free plan: 10 G-Pilot AI messages per calendar month. */
export const MAX_FREE_AI_QUERIES = 10;

const STORAGE_USED = 'gdeck_ai_queries_used';
const STORAGE_MONTH = 'gdeck_ai_queries_month';
const STORAGE_TIER = 'gdeck_plan_tier';
const STORAGE_PRO_EXPIRES = 'gdeck_pro_expires_at';
const STORAGE_PRO_PLAN = 'gdeck_pro_plan_id';
const STORAGE_PRO_ORDER = 'gdeck_pro_order_id';

/** Calendar-month key in the user's local timezone (YYYY-MM). */
export function currentAiQuotaMonth(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function readStoredUsage(): { used: number; month: string } {
  const thisMonth = currentAiQuotaMonth();
  try {
    const savedMonth = localStorage.getItem(STORAGE_MONTH);
    const savedUsed = localStorage.getItem(STORAGE_USED);
    // New month → free allowance resets.
    if (savedMonth !== thisMonth) {
      localStorage.setItem(STORAGE_MONTH, thisMonth);
      localStorage.setItem(STORAGE_USED, '0');
      return { used: 0, month: thisMonth };
    }
    const used = savedUsed ? parseInt(savedUsed, 10) : 0;
    return { used: Number.isFinite(used) && used > 0 ? used : 0, month: thisMonth };
  } catch {
    return { used: 0, month: thisMonth };
  }
}

function persistUsage(used: number, month: string) {
  try {
    localStorage.setItem(STORAGE_USED, String(used));
    localStorage.setItem(STORAGE_MONTH, month);
  } catch {
    /* private mode / quota */
  }
}

function readStoredPro(): {
  tier: PlanTier;
  expiresAt: string | null;
  planId: string | null;
  expired: boolean;
} {
  try {
    const rawTier = localStorage.getItem(STORAGE_TIER);
    const expiresAt = localStorage.getItem(STORAGE_PRO_EXPIRES);
    const planId = localStorage.getItem(STORAGE_PRO_PLAN);

    if (rawTier !== 'pro') {
      return { tier: 'free', expiresAt: null, planId: null, expired: false };
    }

    // Legacy Pro with no expiry: treat as already lapsed so they must re-pay.
    // (Pre-period builds granted lifetime Pro via a bare flag.)
    if (!expiresAt || isProPeriodExpired(expiresAt)) {
      try {
        localStorage.setItem(STORAGE_TIER, 'free');
        localStorage.removeItem(STORAGE_PRO_EXPIRES);
        // Keep planId so renewal copy can reference the last plan.
      } catch {}
      return {
        tier: 'free',
        expiresAt: expiresAt || null,
        planId: planId || 'pro_monthly',
        expired: true,
      };
    }

    return { tier: 'pro', expiresAt, planId: planId || 'pro_monthly', expired: false };
  } catch {
    return { tier: 'free', expiresAt: null, planId: null, expired: false };
  }
}

function persistProActive(planId: string, expiresAt: string, orderId?: string) {
  try {
    localStorage.setItem(STORAGE_TIER, 'pro');
    localStorage.setItem(STORAGE_PRO_PLAN, planId);
    localStorage.setItem(STORAGE_PRO_EXPIRES, expiresAt);
    if (orderId) localStorage.setItem(STORAGE_PRO_ORDER, orderId);
  } catch {
    /* private mode */
  }
}

function clearProStorage(keepLastPlan = true) {
  try {
    localStorage.setItem(STORAGE_TIER, 'free');
    localStorage.removeItem(STORAGE_PRO_EXPIRES);
    localStorage.removeItem(STORAGE_PRO_ORDER);
    if (!keepLastPlan) localStorage.removeItem(STORAGE_PRO_PLAN);
  } catch {
    /* private mode */
  }
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{
  children: ReactNode;
  userEmail?: string | null;
  userName?: string | null;
}> = ({ children, userEmail, userName }) => {
  const initialPro = readStoredPro();

  // Paid plans only: Pro is granted only after a verified Payonify payment and
  // lasts exactly one billing interval (month or year). Legacy bare 'pro' flags
  // without an expiry are treated as expired and must re-pay.
  const [tier, setTierState] = useState<PlanTier>(initialPro.tier);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(
    initialPro.tier === 'pro' ? initialPro.expiresAt : null
  );
  const [proPlanId, setProPlanId] = useState<string | null>(initialPro.planId);
  const [needsRenewal, setNeedsRenewal] = useState<boolean>(initialPro.expired);

  const initialUsage = readStoredUsage();
  const [aiQueriesUsed, setAiQueriesUsed] = useState<number>(initialUsage.used);
  const [aiQuotaMonth, setAiQuotaMonth] = useState<string>(initialUsage.month);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeModalContext, setUpgradeModalContext] = useState<UpgradeModalContext | null>(null);

  // Multi-Account state
  const [accounts, setAccounts] = useState<GoogleAccountProfile[]>(() => {
    const primaryEmail = userEmail || 'tanakaprince49@gmail.com';
    const primaryName = userName || 'Tanaka Prince';
    return [
      {
        id: 'acc-personal',
        email: primaryEmail,
        name: primaryName,
        type: 'personal',
      },
      {
        id: 'acc-work',
        email: primaryEmail.replace('@gmail.com', '@workspace.cloud'),
        name: `${primaryName} (Work Enterprise)`,
        type: 'work',
        company: 'Google Workspace Enterprise',
      },
    ];
  });

  const [activeAccountId, setActiveAccountId] = useState<string>('acc-personal');
  const [prioritySyncActive, setPrioritySyncActive] = useState<boolean>(true);
  const [syncLatencyMs, setSyncLatencyMs] = useState<number>(42);

  // Sync user updates to accounts
  useEffect(() => {
    if (userEmail) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === 'acc-personal'
            ? { ...acc, email: userEmail, name: userName || acc.name }
            : acc
        )
      );
    }
  }, [userEmail, userName]);

  // Roll the free AI counter into a new calendar month if the tab stays open across midnight
  // on the 1st, or if the user left the app open overnight on month boundary.
  useEffect(() => {
    const ensureMonth = () => {
      const thisMonth = currentAiQuotaMonth();
      setAiQuotaMonth((prevMonth) => {
        if (prevMonth === thisMonth) return prevMonth;
        setAiQueriesUsed(0);
        persistUsage(0, thisMonth);
        return thisMonth;
      });
    };
    ensureMonth();
    const id = window.setInterval(ensureMonth, 60 * 60 * 1000);
    const onVis = () => {
      if (document.visibilityState === 'visible') ensureMonth();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const openUpgradeModal = useCallback((ctx?: UpgradeModalContext) => {
    setUpgradeModalContext(ctx || null);
    setUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(false);
    setUpgradeModalContext(null);
  }, []);

  const expireProNow = useCallback(
    (opts?: { silent?: boolean }) => {
      setTierState('free');
      setProExpiresAt(null);
      setNeedsRenewal(true);
      clearProStorage(true);
      if (!opts?.silent) {
        openUpgradeModal({
          isRenewal: true,
          title: 'Pro period ended',
          desc: `Your G-Deck Pro period has ended. Pay again (${planPriceLabel(
            proPlanId || 'pro_monthly'
          )}) to keep unlimited AI and every Pro feature.`,
        });
      }
    },
    [openUpgradeModal, proPlanId]
  );

  // Enforce paid period: when proExpiresAt is past, drop to free and prompt renewal.
  useEffect(() => {
    const check = () => {
      if (tier !== 'pro') return;
      if (isProPeriodExpired(proExpiresAt)) {
        expireProNow();
      }
    };
    check();
    // Every 60s + on tab focus so a long-lived session still lapses on time.
    const id = window.setInterval(check, 60 * 1000);
    const onVis = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [tier, proExpiresAt, expireProNow]);

  const isPro = tier === 'pro' && !isProPeriodExpired(proExpiresAt);
  const proDaysRemaining = isPro ? daysRemainingInPeriod(proExpiresAt) : 0;
  const proExpiresLabel = isPro ? formatProExpiry(proExpiresAt) : '';

  const canUseAi = isPro || aiQueriesUsed < MAX_FREE_AI_QUERIES;
  const aiQueriesRemaining = isPro
    ? Number.POSITIVE_INFINITY
    : Math.max(0, MAX_FREE_AI_QUERIES - aiQueriesUsed);

  const requirePro = useCallback(
    (featureTitle?: string, featureDesc?: string): boolean => {
      if (isPro) return true;
      if (needsRenewal) {
        openUpgradeModal({
          isRenewal: true,
          title: featureTitle || 'Renew G-Deck Pro',
          desc:
            featureDesc ||
            `Your Pro period ended. Pay again (${planPriceLabel(
              proPlanId || 'pro_monthly'
            )}) to unlock this feature.`,
        });
        return false;
      }
      openUpgradeModal({
        title: featureTitle || 'G-Deck Pro Feature',
        desc: featureDesc || 'Upgrade to G-Deck Pro for $12/month to unlock this cross-tool automation.',
      });
      return false;
    },
    [isPro, needsRenewal, openUpgradeModal, proPlanId]
  );

  const openAiLimitPaywall = useCallback(
    (remaining: number) => {
      openUpgradeModal({
        title: 'Free AI messages used up',
        desc:
          remaining <= 0
            ? `You’ve used all ${MAX_FREE_AI_QUERIES} free G-Pilot messages this month. Upgrade to G-Deck Pro for unlimited AI.`
            : `You’ve used your free G-Pilot messages for this month. Upgrade to G-Deck Pro for unlimited AI.`,
        isAiLimit: true,
      });
    },
    [openUpgradeModal]
  );

  const incrementAiQuery = useCallback((): boolean => {
    const thisMonth = currentAiQuotaMonth();

    if (isPro) {
      setAiQueriesUsed((prev) => {
        const next = prev + 1;
        persistUsage(next, thisMonth);
        return next;
      });
      setAiQuotaMonth(thisMonth);
      return true;
    }

    let used = aiQueriesUsed;
    if (aiQuotaMonth !== thisMonth) {
      used = 0;
      setAiQuotaMonth(thisMonth);
      setAiQueriesUsed(0);
      persistUsage(0, thisMonth);
    }

    if (used >= MAX_FREE_AI_QUERIES) {
      openAiLimitPaywall(0);
      return false;
    }

    const next = used + 1;
    setAiQueriesUsed(next);
    persistUsage(next, thisMonth);

    if (next >= MAX_FREE_AI_QUERIES) {
      setTimeout(() => openAiLimitPaywall(0), 1200);
    }

    return true;
  }, [isPro, aiQueriesUsed, aiQuotaMonth, openAiLimitPaywall]);

  const activatePro = useCallback(
    (opts?: ActivateProOptions) => {
      const planId = opts?.planId || 'pro_monthly';
      const interval: ProInterval = intervalForPlanId(planId);
      const paidAt = opts?.paidAt ? new Date(opts.paidAt) : new Date();
      const paidAtSafe = Number.isFinite(paidAt.getTime()) ? paidAt : new Date();

      // Renewals stack: if still inside a paid window, extend from the current end.
      let periodStart = paidAtSafe;
      if (proExpiresAt && !isProPeriodExpired(proExpiresAt)) {
        const currentEnd = new Date(proExpiresAt);
        if (currentEnd.getTime() > periodStart.getTime()) {
          periodStart = currentEnd;
        }
      }

      const expiresAt =
        opts?.expiresAt && Number.isFinite(Date.parse(opts.expiresAt))
          ? opts.expiresAt
          : computePeriodEndIso(periodStart, interval);

      setTierState('pro');
      setProPlanId(planId);
      setProExpiresAt(expiresAt);
      setNeedsRenewal(false);
      persistProActive(planId, expiresAt, opts?.orderId);
      closeUpgradeModal();
    },
    [closeUpgradeModal, proExpiresAt]
  );

  // Back-compat: upgradeToPro() or upgradeToPro('pro_annual') or upgradeToPro({ planId })
  const upgradeToPro = useCallback(
    (opts?: ActivateProOptions | string) => {
      if (typeof opts === 'string') {
        activatePro({ planId: opts });
      } else {
        activatePro(opts);
      }
    },
    [activatePro]
  );

  const downgradeToFree = useCallback(
    (reason: 'expired' | 'manual' = 'manual') => {
      setTierState('free');
      setProExpiresAt(null);
      setNeedsRenewal(reason === 'expired');
      clearProStorage(true);
      closeUpgradeModal();
    },
    [closeUpgradeModal]
  );

  const isProductionBuild = Boolean(import.meta.env.PROD);

  const setMockPlan = useCallback(
    (
      newTier: PlanTier,
      mockAiCount?: number,
      mock?: { planId?: string; expiresInMs?: number; expiresAt?: string }
    ) => {
      if (import.meta.env.PROD) {
        console.warn('[gdeck] setMockPlan is disabled in production builds.');
        return;
      }
      if (newTier === 'pro') {
        const planId = mock?.planId || 'pro_monthly';
        const expiresAt =
          mock?.expiresAt ||
          (mock?.expiresInMs != null
            ? new Date(Date.now() + mock.expiresInMs).toISOString()
            : computePeriodEndIso(new Date(), planId));
        setTierState('pro');
        setProPlanId(planId);
        setProExpiresAt(expiresAt);
        setNeedsRenewal(false);
        persistProActive(planId, expiresAt);
      } else {
        setTierState('free');
        setProExpiresAt(null);
        setNeedsRenewal(false);
        clearProStorage(false);
      }

      if (mockAiCount !== undefined) {
        const month = currentAiQuotaMonth();
        setAiQueriesUsed(mockAiCount);
        setAiQuotaMonth(month);
        persistUsage(mockAiCount, month);
      }
    },
    []
  );

  const switchAccount = useCallback(
    (accountId: string): boolean => {
      if (!isPro) {
        openUpgradeModal({
          title: needsRenewal ? 'Renew G-Deck Pro' : 'Multiple Google Account Switching',
          isRenewal: needsRenewal,
          desc: needsRenewal
            ? `Your Pro period ended. Pay again to switch between personal and work Google accounts.`
            : 'Toggle seamlessly between personal Gmail and corporate Google Workspace accounts without signing out.',
        });
        return false;
      }
      setActiveAccountId(accountId);
      return true;
    },
    [isPro, needsRenewal, openUpgradeModal]
  );

  const togglePrioritySync = useCallback((): boolean => {
    if (!isPro) {
      openUpgradeModal({
        title: needsRenewal ? 'Renew G-Deck Pro' : 'Offline Mode & Priority Sync',
        isRenewal: needsRenewal,
        desc: needsRenewal
          ? 'Your Pro period ended. Pay again to unlock Priority Sync.'
          : 'Unlock ultra-fast local disk caching with background delta refresh so your dashboard loads in under 100ms.',
      });
      return false;
    }
    setPrioritySyncActive((prev) => !prev);
    setSyncLatencyMs(prioritySyncActive ? 320 : 38);
    return true;
  }, [isPro, needsRenewal, prioritySyncActive, openUpgradeModal]);

  const activeAccount =
    accounts.find((a) => a.id === activeAccountId) || accounts[0];

  return (
    <PlanContext.Provider
      value={{
        tier: isPro ? 'pro' : 'free',
        isPro,
        proPlanId,
        proExpiresAt: isPro ? proExpiresAt : null,
        proDaysRemaining,
        proExpiresLabel,
        needsRenewal,
        aiQueriesUsed,
        maxFreeAiQueries: MAX_FREE_AI_QUERIES,
        aiQueriesRemaining,
        canUseAi,
        aiQuotaMonth,
        incrementAiQuery,
        requirePro,
        openUpgradeModal,
        closeUpgradeModal,
        upgradeModalOpen,
        upgradeModalContext,
        upgradeToPro,
        activatePro,
        downgradeToFree,
        setMockPlan,
        isProductionBuild,
        accounts,
        activeAccount,
        switchAccount,
        prioritySyncActive,
        togglePrioritySync,
        syncLatencyMs,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};

// Re-export helpers used by checkout UI
export { planLabel, planPriceLabel, formatProExpiry };
