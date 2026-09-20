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
  /**
   * Bind the signed-in Google identity so Pro can be restored from the
   * per-email ledger after a temporary logout / token refresh.
   */
  bindPlanUser: (email: string | null | undefined, name?: string | null) => void;
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
/** Email the current Pro entitlement is locked to — survives sign-out so Pro is not lost. */
const STORAGE_PRO_EMAIL = 'gdeck_pro_email';
/** Per-email entitlement ledger so re-login on the same device restores paid Pro. */
const STORAGE_PRO_LEDGER = 'gdeck_pro_ledger_v1';

type ProLedgerEntry = {
  tier: 'pro';
  planId: string;
  expiresAt: string;
  orderId?: string;
  updatedAt: string;
};

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== 'string') return null;
  const e = email.trim().toLowerCase();
  return e.includes('@') ? e : null;
}

function readProLedger(): Record<string, ProLedgerEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_PRO_LEDGER);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeProLedger(ledger: Record<string, ProLedgerEntry>) {
  try {
    localStorage.setItem(STORAGE_PRO_LEDGER, JSON.stringify(ledger));
  } catch {
    /* private mode */
  }
}

function upsertLedgerEntry(
  email: string | null | undefined,
  planId: string,
  expiresAt: string,
  orderId?: string
) {
  const key = normalizeEmail(email);
  if (!key) return;
  const ledger = readProLedger();
  ledger[key] = {
    tier: 'pro',
    planId,
    expiresAt,
    orderId,
    updatedAt: new Date().toISOString(),
  };
  writeProLedger(ledger);
}

function readLedgerEntry(email: string | null | undefined): ProLedgerEntry | null {
  const key = normalizeEmail(email);
  if (!key) return null;
  const entry = readProLedger()[key];
  if (!entry || entry.tier !== 'pro' || !entry.expiresAt) return null;
  if (isProPeriodExpired(entry.expiresAt)) return null;
  return entry;
}

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

function readStoredPro(preferredEmail?: string | null): {
  tier: PlanTier;
  expiresAt: string | null;
  planId: string | null;
  expired: boolean;
  email: string | null;
} {
  try {
    const rawTier = localStorage.getItem(STORAGE_TIER);
    const expiresAt = localStorage.getItem(STORAGE_PRO_EXPIRES);
    const planId = localStorage.getItem(STORAGE_PRO_PLAN);
    const boundEmail = normalizeEmail(localStorage.getItem(STORAGE_PRO_EMAIL));
    const pref = normalizeEmail(preferredEmail);

    // Prefer a still-valid per-email ledger entry (survives logout / token wipe).
    const ledgerHit =
      readLedgerEntry(pref) ||
      readLedgerEntry(boundEmail) ||
      null;
    if (ledgerHit) {
      // Hydrate the active slot from the ledger so UI boots as Pro immediately.
      try {
        localStorage.setItem(STORAGE_TIER, 'pro');
        localStorage.setItem(STORAGE_PRO_PLAN, ledgerHit.planId);
        localStorage.setItem(STORAGE_PRO_EXPIRES, ledgerHit.expiresAt);
        if (ledgerHit.orderId) localStorage.setItem(STORAGE_PRO_ORDER, ledgerHit.orderId);
        if (pref || boundEmail) {
          localStorage.setItem(STORAGE_PRO_EMAIL, pref || boundEmail || '');
        }
      } catch {}
      return {
        tier: 'pro',
        expiresAt: ledgerHit.expiresAt,
        planId: ledgerHit.planId || 'pro_monthly',
        expired: false,
        email: pref || boundEmail,
      };
    }

    if (rawTier !== 'pro') {
      return { tier: 'free', expiresAt: null, planId: null, expired: false, email: boundEmail };
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
        email: boundEmail,
      };
    }

    return {
      tier: 'pro',
      expiresAt,
      planId: planId || 'pro_monthly',
      expired: false,
      email: boundEmail,
    };
  } catch {
    return { tier: 'free', expiresAt: null, planId: null, expired: false, email: null };
  }
}

function persistProActive(
  planId: string,
  expiresAt: string,
  orderId?: string,
  email?: string | null
) {
  try {
    localStorage.setItem(STORAGE_TIER, 'pro');
    localStorage.setItem(STORAGE_PRO_PLAN, planId);
    localStorage.setItem(STORAGE_PRO_EXPIRES, expiresAt);
    if (orderId) localStorage.setItem(STORAGE_PRO_ORDER, orderId);
    const e = normalizeEmail(email);
    if (e) localStorage.setItem(STORAGE_PRO_EMAIL, e);
    upsertLedgerEntry(email, planId, expiresAt, orderId);
  } catch {
    /* private mode */
  }
}

function clearProStorage(keepLastPlan = true) {
  try {
    localStorage.setItem(STORAGE_TIER, 'free');
    localStorage.removeItem(STORAGE_PRO_EXPIRES);
    localStorage.removeItem(STORAGE_PRO_ORDER);
    // Keep STORAGE_PRO_EMAIL + ledger so the same Google account can restore Pro
    // after a temporary sign-out without paying again during an active period.
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
}> = ({ children, userEmail: userEmailProp, userName: userNameProp }) => {
  // Identity can arrive via props OR via bindPlanUser() from App after Google auth.
  // Start from any stored profile email so a refresh restores Pro before auth finishes.
  const [boundEmail, setBoundEmail] = useState<string | null>(() => {
    const fromProp = normalizeEmail(userEmailProp);
    if (fromProp) return fromProp;
    try {
      const raw = localStorage.getItem('gdeck_user_profile');
      if (raw) {
        const p = JSON.parse(raw);
        return normalizeEmail(p?.email);
      }
    } catch {}
    return normalizeEmail(localStorage.getItem(STORAGE_PRO_EMAIL));
  });
  const [boundName, setBoundName] = useState<string | null>(() => userNameProp || null);

  const userEmail = normalizeEmail(userEmailProp) || boundEmail;
  const userName = userNameProp || boundName;

  const initialPro = readStoredPro(userEmail);

  // Paid plans only: Pro is granted only after a verified Payonify payment and
  // lasts exactly one billing interval (month or year). Legacy bare 'pro' flags
  // without an expiry are treated as expired and must re-pay.
  // Entitlement is bound to the Google email + local ledger so a temporary
  // logout / token refresh NEVER strips a paid period.
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

  // Sync user updates to accounts + restore Pro from the per-email ledger.
  // This is the fix for "I signed back in and lost Pro" — paid periods live in
  // gdeck_pro_ledger_v1 keyed by email and are re-applied on every identity change.
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

    const email = normalizeEmail(userEmail);
    if (!email) return;

    // 1) Active local Pro with no email binding yet → bind it to this account.
    try {
      const rawTier = localStorage.getItem(STORAGE_TIER);
      const expiresAt = localStorage.getItem(STORAGE_PRO_EXPIRES);
      const planId = localStorage.getItem(STORAGE_PRO_PLAN) || 'pro_monthly';
      const orderId = localStorage.getItem(STORAGE_PRO_ORDER) || undefined;
      if (rawTier === 'pro' && expiresAt && !isProPeriodExpired(expiresAt)) {
        const bound = normalizeEmail(localStorage.getItem(STORAGE_PRO_EMAIL));
        if (!bound || bound === email) {
          persistProActive(planId, expiresAt, orderId, email);
          setTierState('pro');
          setProPlanId(planId);
          setProExpiresAt(expiresAt);
          setNeedsRenewal(false);
          return;
        }
      }
    } catch {
      /* ignore */
    }

    // 2) Restore from ledger for this email (after logout / device refresh).
    const entry = readLedgerEntry(email);
    if (entry) {
      persistProActive(entry.planId, entry.expiresAt, entry.orderId, email);
      setTierState('pro');
      setProPlanId(entry.planId);
      setProExpiresAt(entry.expiresAt);
      setNeedsRenewal(false);
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
      // Pro is unlimited — do NOT touch the free monthly counter, otherwise a
      // mid-period downgrade would inherit an inflated used count.
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

  const bindPlanUser = useCallback((email: string | null | undefined, name?: string | null) => {
    const e = normalizeEmail(email);
    if (e) setBoundEmail(e);
    if (name) setBoundName(name);
  }, []);

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
      // Bind entitlement to the signed-in Google email + durable ledger.
      let emailForLedger = normalizeEmail(userEmail) || boundEmail;
      if (!emailForLedger) {
        try {
          emailForLedger = normalizeEmail(localStorage.getItem(STORAGE_PRO_EMAIL));
        } catch {
          emailForLedger = null;
        }
      }
      persistProActive(planId, expiresAt, opts?.orderId, emailForLedger);
      closeUpgradeModal();
    },
    [closeUpgradeModal, proExpiresAt, userEmail, boundEmail]
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
        bindPlanUser,
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
