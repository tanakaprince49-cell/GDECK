import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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
}

export interface PlanContextType {
  tier: PlanTier;
  isPro: boolean;
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
  upgradeToPro: () => void;
  readonly isProductionBuild: boolean;
  downgradeToFree: () => void;
  /** Development only: a no-op in production builds. */
  setMockPlan: (tier: PlanTier, mockAiCount?: number) => void;
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

const DEFAULT_ACCOUNTS: GoogleAccountProfile[] = [
  {
    id: 'acc-personal',
    email: 'tanakaprince49@gmail.com',
    name: 'Tanaka Prince',
    type: 'personal',
  },
  {
    id: 'acc-work',
    email: 'tanaka@workspace.cloud',
    name: 'Tanaka Prince (G-Suite Admin)',
    type: 'work',
    company: 'Acme Global Ventures',
  },
];

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{
  children: ReactNode;
  userEmail?: string | null;
  userName?: string | null;
}> = ({ children, userEmail, userName }) => {
  // Paid plans only: the automatic 14-day trial is gone, so 'free' is the entry tier and
  // Pro arrives exclusively through a verified Payonify payment. Accounts still holding a
  // legacy 'trial' value resolve to free.
  const [tier, setTierState] = useState<PlanTier>(() => {
    try {
      return localStorage.getItem(STORAGE_TIER) === 'pro' ? 'pro' : 'free';
    } catch {}
    return 'free';
  });

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
    // Check hourly — cheap, catches long-lived sessions crossing month boundary.
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

  const isPro = tier === 'pro';

  const canUseAi = isPro || aiQueriesUsed < MAX_FREE_AI_QUERIES;
  const aiQueriesRemaining = isPro
    ? Number.POSITIVE_INFINITY
    : Math.max(0, MAX_FREE_AI_QUERIES - aiQueriesUsed);

  const openUpgradeModal = useCallback((ctx?: UpgradeModalContext) => {
    setUpgradeModalContext(ctx || null);
    setUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(false);
    setUpgradeModalContext(null);
  }, []);

  const requirePro = useCallback(
    (featureTitle?: string, featureDesc?: string): boolean => {
      if (isPro) return true;
      openUpgradeModal({
        title: featureTitle || 'G-Deck Pro Feature',
        desc: featureDesc || 'Upgrade to G-Deck Pro for $12/month to unlock this cross-tool automation.',
      });
      return false;
    },
    [isPro, openUpgradeModal]
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
    // Always re-check month so a send at 00:01 on the 1st still gets a fresh allowance.
    const thisMonth = currentAiQuotaMonth();

    if (isPro) {
      // Track usage for analytics UI only — Pro is unlimited.
      setAiQueriesUsed((prev) => {
        const next = prev + 1;
        persistUsage(next, thisMonth);
        return next;
      });
      setAiQuotaMonth(thisMonth);
      return true;
    }

    // Month rolled over since last render — reset then allow this message.
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

    // Hit the cap on this send — open paywall shortly after the reply lands.
    if (next >= MAX_FREE_AI_QUERIES) {
      setTimeout(() => openAiLimitPaywall(0), 1200);
    }

    return true;
  }, [isPro, aiQueriesUsed, aiQuotaMonth, openAiLimitPaywall]);

  const upgradeToPro = useCallback(() => {
    setTierState('pro');
    try {
      localStorage.setItem(STORAGE_TIER, 'pro');
    } catch {}
    closeUpgradeModal();
  }, [closeUpgradeModal]);

  const downgradeToFree = useCallback(() => {
    setTierState('free');
    try {
      localStorage.setItem(STORAGE_TIER, 'free');
    } catch {}
    closeUpgradeModal();
  }, [closeUpgradeModal]);

  const isProductionBuild = Boolean(import.meta.env.PROD);

  const setMockPlan = useCallback((newTier: PlanTier, mockAiCount?: number) => {
    if (import.meta.env.PROD) {
      console.warn('[gdeck] setMockPlan is disabled in production builds.');
      return;
    }
    setTierState(newTier);
    try {
      localStorage.setItem(STORAGE_TIER, newTier);
    } catch {}

    if (mockAiCount !== undefined) {
      const month = currentAiQuotaMonth();
      setAiQueriesUsed(mockAiCount);
      setAiQuotaMonth(month);
      persistUsage(mockAiCount, month);
    }
  }, []);

  const switchAccount = useCallback(
    (accountId: string): boolean => {
      if (!isPro) {
        openUpgradeModal({
          title: 'Multiple Google Account Switching',
          desc: 'Toggle seamlessly between personal Gmail and corporate Google Workspace accounts without signing out.',
        });
        return false;
      }
      setActiveAccountId(accountId);
      return true;
    },
    [isPro, openUpgradeModal]
  );

  const togglePrioritySync = useCallback((): boolean => {
    if (!isPro) {
      openUpgradeModal({
        title: 'Offline Mode & Priority Sync',
        desc: 'Unlock ultra-fast local disk caching with background delta refresh so your dashboard loads in under 100ms.',
      });
      return false;
    }
    setPrioritySyncActive((prev) => !prev);
    setSyncLatencyMs(prioritySyncActive ? 320 : 38);
    return true;
  }, [isPro, prioritySyncActive, openUpgradeModal]);

  const activeAccount =
    accounts.find((a) => a.id === activeAccountId) || accounts[0];

  return (
    <PlanContext.Provider
      value={{
        tier,
        isPro,
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
