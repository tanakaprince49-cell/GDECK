import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type PlanTier = 'free' | 'trial' | 'pro';

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
  trialDaysRemaining: number;
  trialStartDate: string | null;
  isPro: boolean;
  aiQueriesUsed: number;
  maxFreeAiQueries: number;
  canUseAi: boolean;
  incrementAiQuery: () => boolean;
  requirePro: (featureTitle?: string, featureDesc?: string) => boolean;
  openUpgradeModal: (ctx?: UpgradeModalContext) => void;
  closeUpgradeModal: () => void;
  upgradeModalOpen: boolean;
  upgradeModalContext: UpgradeModalContext | null;
  upgradeToPro: () => void;
  startProTrial: () => void;
  downgradeToFree: () => void;
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

const MAX_FREE_AI_QUERIES = 10;
const TRIAL_DURATION_DAYS = 14;

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
  // Initialize Tier: Default to 14-day Pro Trial for first-time connected users!
  const [tier, setTierState] = useState<PlanTier>(() => {
    try {
      const savedTier = localStorage.getItem('gdeck_plan_tier') as PlanTier;
      if (savedTier && ['free', 'trial', 'pro'].includes(savedTier)) {
        return savedTier;
      }
    } catch {}
    return 'trial'; // 14-Day Free Pro Trial by default
  });

  const [trialStartDate, setTrialStartDate] = useState<string>(() => {
    try {
      const savedDate = localStorage.getItem('gdeck_trial_start_date');
      if (savedDate) return savedDate;
    } catch {}
    const now = new Date().toISOString();
    try {
      localStorage.setItem('gdeck_trial_start_date', now);
    } catch {}
    return now;
  });

  const [aiQueriesUsed, setAiQueriesUsed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gdeck_ai_queries_used');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

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

  // Calculate remaining trial days
  const calculateTrialDaysRemaining = (): number => {
    if (tier !== 'trial') return 0;
    try {
      const start = new Date(trialStartDate).getTime();
      const now = Date.now();
      const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      const remaining = TRIAL_DURATION_DAYS - elapsedDays;
      return Math.max(0, remaining);
    } catch {
      return 14;
    }
  };

  const trialDaysRemaining = calculateTrialDaysRemaining();

  const isPro = tier === 'pro' || (tier === 'trial' && trialDaysRemaining > 0);

  const canUseAi = isPro || aiQueriesUsed < MAX_FREE_AI_QUERIES;

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

  const incrementAiQuery = useCallback((): boolean => {
    if (isPro) {
      // Unlimited AI for Pro
      setAiQueriesUsed((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem('gdeck_ai_queries_used', String(next));
        } catch {}
        return next;
      });
      return true;
    }

    if (aiQueriesUsed >= MAX_FREE_AI_QUERIES) {
      openUpgradeModal({
        title: 'Free AI Assists Limit Reached',
        desc: 'You’ve unlocked 10/10 free AI assists this month. Upgrade to G-Deck Pro for unlimited AI.',
        isAiLimit: true,
      });
      return false;
    }

    const next = aiQueriesUsed + 1;
    setAiQueriesUsed(next);
    try {
      localStorage.setItem('gdeck_ai_queries_used', String(next));
    } catch {}

    // If this just reached the limit, notify user
    if (next >= MAX_FREE_AI_QUERIES) {
      setTimeout(() => {
        openUpgradeModal({
          title: 'Free AI Assists Limit Reached',
          desc: 'You’ve unlocked 10/10 free AI assists this month. Upgrade to G-Deck Pro for unlimited AI.',
          isAiLimit: true,
        });
      }, 1500);
    }

    return true;
  }, [isPro, aiQueriesUsed, openUpgradeModal]);

  const upgradeToPro = useCallback(() => {
    setTierState('pro');
    try {
      localStorage.setItem('gdeck_plan_tier', 'pro');
    } catch {}
    closeUpgradeModal();
  }, [closeUpgradeModal]);

  const startProTrial = useCallback(() => {
    setTierState('trial');
    const now = new Date().toISOString();
    setTrialStartDate(now);
    try {
      localStorage.setItem('gdeck_plan_tier', 'trial');
      localStorage.setItem('gdeck_trial_start_date', now);
    } catch {}
    closeUpgradeModal();
  }, [closeUpgradeModal]);

  const downgradeToFree = useCallback(() => {
    setTierState('free');
    try {
      localStorage.setItem('gdeck_plan_tier', 'free');
    } catch {}
    closeUpgradeModal();
  }, [closeUpgradeModal]);

  const setMockPlan = useCallback((newTier: PlanTier, mockAiCount?: number) => {
    setTierState(newTier);
    try {
      localStorage.setItem('gdeck_plan_tier', newTier);
    } catch {}

    if (newTier === 'trial') {
      const now = new Date().toISOString();
      setTrialStartDate(now);
      try {
        localStorage.setItem('gdeck_trial_start_date', now);
      } catch {}
    }

    if (mockAiCount !== undefined) {
      setAiQueriesUsed(mockAiCount);
      try {
        localStorage.setItem('gdeck_ai_queries_used', String(mockAiCount));
      } catch {}
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
        trialDaysRemaining,
        trialStartDate,
        isPro,
        aiQueriesUsed,
        maxFreeAiQueries: MAX_FREE_AI_QUERIES,
        canUseAi,
        incrementAiQuery,
        requirePro,
        openUpgradeModal,
        closeUpgradeModal,
        upgradeModalOpen,
        upgradeModalContext,
        upgradeToPro,
        startProTrial,
        downgradeToFree,
        setMockPlan,
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
