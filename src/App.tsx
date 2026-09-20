import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  LogOut,
  ExternalLink,
  Menu,
  X,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Search,
  Pin,
  LayoutGrid,
  Check,
  Star,
  SlidersHorizontal,
  Lock,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Settings,
  Grid,
  Maximize,
  Minimize,
  Trash2,
  Coffee,
} from 'lucide-react';

import {
  initAuth,
  googleSignIn,
  reconnectWorkspace,
  ensureFreshAccessToken,
  logout,
  deleteAccountPermanently,
} from './services/auth';
import { ConfirmModal } from './components/ConfirmModal';
import { DeleteAccountModal } from './components/DeleteAccountModal';
import { SecurityCenterModal } from './components/SecurityCenterModal';
import { OverviewView } from './components/OverviewView';
import { DriveView } from './components/DriveView';
import { SheetsView } from './components/SheetsView';
import { GmailView } from './components/GmailView';
import { CalendarView } from './components/CalendarView';
import { TasksView } from './components/TasksView';
import { ContactsView } from './components/ContactsView';
import { MeetView } from './components/MeetView';
import { FormsView } from './components/FormsView';
import { KeepView } from './components/KeepView';

// Top 10 Core Google Workspace Tools
import { DocsView } from './components/DocsView';
import { SlidesView } from './components/SlidesView';
import { ChatView } from './components/ChatView';
import { MessagesView } from './components/MessagesView';
import { WorkspaceAppView } from './components/WorkspaceAppView';

import GPilotChat from './components/GPilotChat';
import { OnboardingModal, OnboardingPreferences } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { GDeckLogo } from './components/GDeckLogo';
import { GoogleLogo } from './components/GoogleIcons';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationCenter } from './components/NotificationCenter';
import { NotificationToast } from './components/NotificationToast';
import { ProRenewalReminder } from './components/ProRenewalReminder';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { TermsOfServiceView } from './components/TermsOfServiceView';
import { LandingView } from './components/LandingView';
import { usePlan } from './context/PlanContext';
import { UpgradeModal } from './components/UpgradeModal';
import { OmniSearchModal } from './components/OmniSearchModal';
import { WorkspaceFocusTarget } from './types/focus';
import { ProBadge } from './components/ProBadge';
import { CheckoutSuccessView } from './components/CheckoutSuccessView';
import { CheckoutCancelView } from './components/CheckoutCancelView';
import {
  ALL_WORKSPACE_TOOLS,
  CATEGORIES,
  DEFAULT_PINNED_TOOL_IDS,
  ToolDefinition,
} from './constants/tools';
import { SUPPORT_CAMPAIGN_URL } from './constants/support';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('gdeck_workspace_token');
    } catch {
      return null;
    }
  });
  const [needsAuth, setNeedsAuth] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('gdeck_workspace_token');
    } catch {
      return true;
    }
  });
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes('checkout/success') || search.includes('checkout/success') || search.includes('session_id')) return 'checkout_success';
      if (path.includes('checkout/cancel') || search.includes('checkout/cancel')) return 'checkout_cancel';
      if (path.includes('privacy') || search.includes('privacy')) return 'privacy';
      if (path.includes('terms') || search.includes('terms')) return 'terms';
    }
    return 'overview';
  });

  // Subscription Plan & Features
  const {
    tier,
    isPro,
    proExpiresLabel,
    proDaysRemaining,
    needsRenewal,
    openUpgradeModal,
    requirePro,
    accounts,
    activeAccount,
    switchAccount,
  } = usePlan();

  const [omniSearchOpen, setOmniSearchOpen] = useState<boolean>(false);
  // A search result the destination view should open directly, then clear.
  const [omniFocus, setOmniFocus] = useState<WorkspaceFocusTarget | null>(null);

  // Global Keyboard Shortcut for Omni-Search (Cmd+K / Ctrl+K)
  const openOmniSearch = () => {
    // Free users get the paywall immediately — never the locked Omni shell.
    if (
      !requirePro(
        'Omni-Search',
        'Search Gmail, Calendar, Drive and Tasks at the same time from one bar (⌘K).'
      )
    ) {
      return;
    }
    setOmniSearchOpen(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOmniSearchOpen((prev) => {
          if (prev) return false;
          // Free: open paywall and keep modal closed
          if (
            !requirePro(
              'Omni-Search',
              'Search Gmail, Calendar, Drive and Tasks at the same time from one bar (⌘K).'
            )
          ) {
            return false;
          }
          return true;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [requirePro]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [showSecurityCenter, setShowSecurityCenter] = useState<boolean>(false);
  const [accountDeletedBanner, setAccountDeletedBanner] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Category Dropdown State for Desktop Nav
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<string | null>(null);
  const [showWaffleMenu, setShowWaffleMenu] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const waffleRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);

  // Pinned tools
  const [pinnedTools, setPinnedTools] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gdeck_pinned_tools');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PINNED_TOOL_IDS;
  });

  const togglePin = (toolId: string) => {
    setPinnedTools((prev) => {
      const next = prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId];
      try {
        localStorage.setItem('gdeck_pinned_tools', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const [onboardingPrefs, setOnboardingPrefs] = useState<OnboardingPreferences | null>(() => {
    try {
      const saved = localStorage.getItem('gdeck_onboarding');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Ensure Light Mode is always applied to document element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.classList.add('theme-light');
      document.body.style.backgroundColor = '#F8FAFD';
      document.body.style.color = '#1F1F1F';
      localStorage.setItem('gdeck-theme', 'light');
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (waffleRef.current && !waffleRef.current.contains(event.target as Node)) {
        setShowWaffleMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target as Node)) {
        setOpenCategoryDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Firebase Auth is persisted locally — on refresh we restore the user and
    // silently refresh the Google Workspace access token (no popup).
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setNeedsAuth(false);
        setAuthError(null);
      },
      (reason) => {
        if (reason === 'signed_out') {
          setUser(null);
          setToken(null);
          setNeedsAuth(true);
          return;
        }
        // Firebase user still present but Workspace token missing/expired —
        // keep the user object so we don't look "logged out"; try silent refresh,
        // and only then ask them to reconnect Workspace (one click, not full logout).
        setNeedsAuth(true);
        setAuthError(
          reason === 'workspace_token_missing' || reason === 'refresh_failed'
            ? 'Your Google Workspace session needs a quick reconnect. Tap Sign in once — you stay signed in after that.'
            : null
        );
      }
    );

    const handleAuthExpired = async (e: any) => {
      // Prefer silent refresh over forcing the landing/sign-in screen.
      try {
        const fresh = await ensureFreshAccessToken();
        if (fresh) {
          setToken(fresh);
          setNeedsAuth(false);
          setAuthError(null);
          return;
        }
      } catch {
        /* fall through */
      }
      // Recoverable: keep Firebase user if any, prompt reconnect without wiping session.
      setToken(null);
      setNeedsAuth(true);
      setAuthError(
        e?.detail?.message ||
          'Your Google Workspace access expired. Sign in once to refresh — you will stay signed in.'
      );
    };

    window.addEventListener('gdeck_auth_expired', handleAuthExpired);

    // Proactively refresh the access token every ~45 minutes while the tab is open.
    const refreshTimer = window.setInterval(async () => {
      try {
        const fresh = await ensureFreshAccessToken();
        if (fresh) {
          setToken(fresh);
          setNeedsAuth(false);
        }
      } catch {
        /* ignore */
      }
    }, 45 * 60 * 1000);

    const onVis = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const fresh = await ensureFreshAccessToken();
        if (fresh) {
          setToken(fresh);
          setNeedsAuth(false);
          setAuthError(null);
        }
      } catch {
        /* ignore */
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      unsubscribe();
      window.removeEventListener('gdeck_auth_expired', handleAuthExpired);
      window.clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Mobile full-screen effect
  useEffect(() => {
    if (activeTab === 'overview') {
      setIsFullscreen(false);
    } else {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsFullscreen(true);
      }
    }
  }, [activeTab]);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      // Prefer a consent pass when we already know the Firebase user but lost the
      // Workspace refresh token — captures offline access for stay-signed-in.
      const result = user ? await reconnectWorkspace() : await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        setAuthError(null);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign in popup was closed before completing authorization.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Pop-up was blocked. Allow pop-ups for G-Deck and try again.');
      } else {
        setAuthError(err.message || 'Failed to authenticate with Google Workspace.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setShowLogoutConfirm(false);
      setShowProfileMenu(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleAccountDeletedSuccess = () => {
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setShowDeleteAccountModal(false);
    setShowProfileMenu(false);
    setMobileMenuOpen(false);
    setShowOnboarding(false);
    setAccountDeletedBanner(true);
  };

  const handleCompleteOnboarding = (prefs: OnboardingPreferences) => {
    setOnboardingPrefs(prefs);
    try {
      localStorage.setItem('gdeck_onboarding', JSON.stringify(prefs));
      localStorage.setItem('gdeck_onboarding_completed', 'true');
    } catch {}
    setShowOnboarding(false);
  };

  // Filter tools for global search
  const filteredSearchTools = ALL_WORKSPACE_TOOLS.filter((t) => {
    if (!globalSearchQuery.trim()) return false;
    return (
      t.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(globalSearchQuery.toLowerCase())
    );
  });

  return (
    <NotificationProvider token={token}>
      <div className="min-h-screen bg-[#F8FAFD] flex flex-col antialiased text-[#1F1F1F] selection:bg-[#c2e7ff] selection:text-[#001d35] relative" style={{ fontFamily: "'Google Sans', Roboto, sans-serif" }}>
      {/* Account Deletion Notice Banner */}
      {accountDeletedBanner && (
        <div id="account-deleted-banner" className="bg-[#188038] text-white px-4 py-3 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-md z-50 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 mx-auto">
            <Check className="w-4 h-4 shrink-0" />
            <span>Your account and all associated workspace data have been permanently deleted.</span>
          </div>
          <button
            onClick={() => setAccountDeletedBanner(false)}
            className="p-1 hover:bg-white/20 rounded-full cursor-pointer transition-colors shrink-0"
            aria-label="Close message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Google Workspace Top App Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#dadce0] shadow-xs">
        <div className="w-full mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Identity - Google Workspace Deck */}
          <div className="flex items-center gap-1 shrink-0">
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 -ml-1 text-[#5f6368] hover:bg-[#f1f3f4] rounded-full transition-colors sm:hidden"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5 text-[#1f1f1f]" />
              </button>
            )}
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 sm:pr-3 rounded-lg hover:bg-[#f1f3f4] transition-colors cursor-pointer group"
              title="Google Workspace Deck Dashboard"
            >
              <GDeckLogo size="sm" />
              <div className="flex flex-col text-left">
                <span className="text-lg sm:text-xl font-medium tracking-tight text-[#5f6368] font-['Google_Sans',Roboto,sans-serif]">
                  G-Deck
                </span>
              </div>
            </button>
          </div>

          {/* Center: Google Search Pill */}
          {!needsAuth && token && (
            <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl mx-auto relative items-center gap-2">
              <div className="w-full relative flex items-center">
                <div className="absolute left-4 pointer-events-none text-[#5f6368]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search in Google Workspace, apps, and tools..."
                  value={globalSearchQuery}
                  onFocus={() => setShowSearchResults(true)}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  className="w-full pl-11 pr-24 py-2.5 bg-[#f0f4f9] hover:bg-[#e9eef6] focus:bg-white text-sm text-[#1f1f1f] placeholder-[#5f6368] rounded-full border border-transparent focus:border-[#1a73e8] focus:shadow-[0_1px_3px_1px_rgba(60,64,67,0.15)] transition-all outline-none"
                />
                <div className="absolute right-2.5 flex items-center gap-1">
                  {globalSearchQuery && (
                    <button
                      onClick={() => setGlobalSearchQuery('')}
                      className="p-1 text-[#5f6368] hover:text-[#1f1f1f] rounded-full hover:bg-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={openOmniSearch}
                    className="px-2 py-0.5 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md border border-purple-200 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Omni-Search across Gmail, Calendar, Drive, Tasks (Cmd+K)"
                  >
                    <span className="hidden lg:inline">Omni</span>
                    <kbd className="text-[10px] bg-white px-1 py-0.2 rounded border border-purple-200 text-purple-600 font-mono">⌘K</kbd>
                    <ProBadge size="xs" showLockOnFree={false} />
                  </button>
                </div>
              </div>

              {/* Quick Search Dropdown */}
              {showSearchResults && globalSearchQuery.trim() && (
                <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl border border-[#dadce0] shadow-xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[11px] font-bold text-[#5f6368] px-3 py-1.5 uppercase tracking-wider">
                    Google Tools Matching "{globalSearchQuery}"
                  </div>
                  {filteredSearchTools.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#5f6368]">
                      No Google Workspace tools found matching your query
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {filteredSearchTools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <div
                            key={tool.id}
                            onClick={() => {
                              setActiveTab(tool.id);
                              setShowSearchResults(false);
                              setGlobalSearchQuery('');
                            }}
                            className="p-2.5 rounded-xl hover:bg-[#f0f4f9] cursor-pointer flex items-center justify-between group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-white border border-[#dadce0]">
                                <Icon className="w-5 h-5 object-contain" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-[#1f1f1f] group-hover:text-[#1a73e8]">
                                  {tool.name}
                                </p>
                                <p className="text-[11px] text-[#5f6368]">{tool.desc}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-medium text-[#5f6368] bg-[#f1f3f4] px-2 py-0.5 rounded-md">
                              {tool.category}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right Header: Google 9-dot Waffle + Account Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {!needsAuth && token && (
              <NotificationCenter onNavigateTab={(tab) => setActiveTab(tab)} />
            )}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Subscription Status Pill */}
                {isPro ? (
                  <button
                    onClick={() =>
                      openUpgradeModal({
                        title: 'G-Deck Pro Member',
                        desc: proExpiresLabel
                          ? `Pro is active until ${proExpiresLabel}${proDaysRemaining > 0 ? ` (${proDaysRemaining}d left)` : ''}. Pay again before then to keep Pro without interruption.`
                          : 'Your Pro period is active. Pay again at the end of the period to renew.',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-200 bg-purple-100 rounded-full border border-purple-300 transition-colors cursor-pointer"
                    title={
                      proExpiresLabel
                        ? `Pro active until ${proExpiresLabel}`
                        : 'G-Deck Pro Member'
                    }
                    id="header-pro-status-pill"
                  >
                    <span className="hidden sm:inline">
                      {proDaysRemaining > 0 && proDaysRemaining <= 7
                        ? `Pro · ${proDaysRemaining}d left`
                        : 'Pro Active'}
                    </span>
                    <span className="sm:hidden">Pro</span>
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      openUpgradeModal(
                        needsRenewal
                          ? {
                              isRenewal: true,
                              title: 'Pro period ended',
                              desc: 'Your Pro period ended. Pay again to unlock unlimited AI and every Pro feature.',
                            }
                          : undefined
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                      needsRenewal
                        ? 'text-amber-900 hover:bg-amber-100 bg-amber-50 border-amber-300'
                        : 'text-purple-700 hover:bg-purple-100 bg-purple-50 border-purple-200'
                    }`}
                    title={
                      needsRenewal
                        ? 'Pro period ended — renew to keep Pro'
                        : 'Upgrade to G-Deck Pro ($12/month)'
                    }
                    id="header-upgrade-pill"
                  >
                    <span>{needsRenewal ? 'Renew Pro' : 'Upgrade'}</span>
                    <ProBadge size="xs" showLockOnFree={false} />
                  </button>
                )}

                {/* Support: Buy me a coffee (Tributejar campaign) */}
                <a
                  id="header-support-coffee-btn"
                  href={SUPPORT_CAMPAIGN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#8a5a00] hover:bg-[#fdf3d7] bg-[#fffbeb] rounded-full border border-[#f0e0b0] transition-colors cursor-pointer"
                  title="Buy me a coffe — support G-Deck development"
                >
                  <Coffee className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Buy me a coffe</span>
                </a>

                {/* 9-dot Google App Launcher (Waffle Menu) */}
                <div ref={waffleRef} className="relative hidden xs:block">
                  <button
                    id="waffle-menu-btn"
                    onClick={() => setShowWaffleMenu(!showWaffleMenu)}
                    className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
                    title="Google apps launcher"
                  >
                    <Grid className="w-5 h-5" />
                  </button>

                  {/* 9-dot Google Apps Popover Grid */}
                  {showWaffleMenu && (
                    <div className="fixed sm:absolute top-16 sm:top-auto left-4 right-4 sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-80 rounded-3xl bg-white border border-[#dadce0] shadow-[0_4px_24px_rgba(60,64,67,0.2)] p-4 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between pb-3 border-b border-[#f1f3f4] mb-3">
                        <span className="text-xs font-bold text-[#1f1f1f]">Google Apps</span>
                        <button
                          onClick={() => {
                            setActiveTab('overview');
                            setShowWaffleMenu(false);
                          }}
                          className="text-xs font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                        >
                          Workspace Deck
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1">
                        {ALL_WORKSPACE_TOOLS.map((tool) => {
                          const Icon = tool.icon;
                          const isCurrent = activeTab === tool.id;
                          return (
                            <button
                              key={tool.id}
                              onClick={() => {
                                setActiveTab(tool.id);
                                setShowWaffleMenu(false);
                              }}
                              className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                                isCurrent
                                  ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                                  : 'hover:bg-[#f0f4f9] text-[#1f1f1f]'
                              }`}
                            >
                              <div className="p-1 rounded-xl bg-white border border-slate-100 shadow-2xs">
                                <Icon className="w-6 h-6 object-contain" />
                              </div>
                              <span className="text-[11px] truncate w-full text-center">
                                {tool.name.replace('Google ', '')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Google Account Profile Menu */}
                <div ref={profileRef} className="relative">
                  <button
                    id="profile-menu-btn"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="p-0.5 sm:p-1 rounded-full hover:ring-4 hover:ring-[#e8f0fe] transition-all cursor-pointer flex items-center gap-2"
                    title="Google Account"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Google Account'}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#dadce0]"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-bold">
                        {user.displayName ? user.displayName[0].toUpperCase() : 'G'}
                      </div>
                    )}
                  </button>

                  {/* Profile Details Dropdown */}
                  {showProfileMenu && (
                    <div className="fixed sm:absolute top-14 sm:top-auto left-4 right-4 sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-80 max-w-sm ml-auto rounded-3xl bg-white border border-[#dadce0] shadow-[0_4px_24px_rgba(60,64,67,0.2)] p-4 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex flex-col items-center text-center pb-4 border-b border-[#f1f3f4]">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="User"
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-full object-cover border border-[#dadce0] mb-2"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-lg font-bold mb-2">
                            {user.displayName ? user.displayName[0].toUpperCase() : 'G'}
                          </div>
                        )}
                        <p className="text-sm font-bold text-[#1f1f1f]">
                          {user.displayName || 'Google User'}
                        </p>
                        <p className="text-xs text-[#5f6368] truncate max-w-[220px]">
                          {user.email}
                        </p>
                        <span className="mt-2 text-[10px] font-semibold text-[#188038] bg-[#e6f4ea] px-2.5 py-0.5 rounded-full border border-[#ceead6] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Connected via OAuth
                        </span>
                      </div>

                      {/* Multi-Account Switching (Pro Feature) */}
                      <div className="py-2.5 border-b border-[#f1f3f4]">
                        <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-[#5f6368] uppercase tracking-wider">
                          <span>Google Accounts</span>
                          <ProBadge size="xs" featureTitle="Multiple Google Accounts" />
                        </div>
                        <div className="space-y-1 mt-1">
                          {accounts.map((acc) => (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => {
                                if (switchAccount(acc.id)) {
                                  setShowProfileMenu(false);
                                }
                              }}
                              className={`w-full px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                                activeAccount.id === acc.id
                                  ? 'bg-purple-50 text-purple-900 font-semibold'
                                  : 'hover:bg-[#f0f4f9] text-[#1f1f1f]'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {acc.name[0]}
                                </div>
                                <div className="flex flex-col text-left truncate">
                                  <span className="truncate">{acc.name}</span>
                                  <span className="text-[10px] text-[#5f6368] truncate">{acc.email}</span>
                                </div>
                              </div>
                              {activeAccount.id === acc.id ? (
                                <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              ) : !isPro ? (
                                <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                              ) : null}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 space-y-1.5">
                        <button
                          id="profile-customize-prefs-btn"
                          onClick={() => {
                            setShowSettingsModal(true);
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-xl text-left flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#5f6368]" />
                          <span>Settings & Preferences</span>
                        </button>

                        <button
                          id="profile-signout-btn"
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowLogoutConfirm(true);
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-xl text-left flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-[#5f6368]" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                id="header-sign-in-btn"
                onClick={handleSignIn}
                disabled={isLoggingIn}
                className="px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all hover:shadow-[0_2px_6px_2px_rgba(60,64,67,0.15)]"
              >
                <GoogleLogo className="w-4 h-4" />
                <span>{isLoggingIn ? 'Connecting...' : 'Sign In'}</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            {!needsAuth && token && (
              <button
                id="mobile-menu-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 sm:p-2 text-[#5f6368] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-[#1f1f1f]" /> : <Menu className="w-5 h-5 text-[#1f1f1f]" />}
              </button>
            )}
          </div>
        </div>

        {/* Google Material 3 Navigation Hub */}
        {!needsAuth && token && (
          <div
            ref={navDropdownRef}
            className="hidden lg:block border-t border-[#dadce0] bg-white py-1.5 px-4 sm:px-6 lg:px-8"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Category Pills with Dashboard button */}
              <nav className="flex items-center gap-1.5 flex-wrap">
                <button
                  id="nav-tab-overview"
                  onClick={() => {
                    setActiveTab('overview');
                    setOpenCategoryDropdown(null);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'overview'
                      ? 'google-nav-pill-active'
                      : 'google-nav-pill-inactive'
                  }`}
                >
                  <GoogleLogo className="w-3.5 h-3.5" />
                  <span>Workspace Dashboard</span>
                </button>

                <div className="h-4 w-px bg-[#dadce0] mx-1" />

                {CATEGORIES.map((category) => {
                  const categoryTools = ALL_WORKSPACE_TOOLS.filter((t) => t.category === category);
                  const isCatActive = categoryTools.some((t) => t.id === activeTab);
                  const isOpen = openCategoryDropdown === category;

                  return (
                    <div key={category} className="relative">
                      <button
                        onClick={() => {
                          setOpenCategoryDropdown(isOpen ? null : category);
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          isCatActive
                            ? 'bg-[#e8f0fe] text-[#1a73e8] font-semibold border border-[#d2e3fc]'
                            : 'text-[#444746] hover:bg-[#f0f4f9] hover:text-[#1f1f1f]'
                        }`}
                      >
                        <span>{category}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-[#1a73e8]' : 'text-[#5f6368]'
                          }`}
                        />
                      </button>

                      {/* Category Dropdown */}
                      {isOpen && (
                        <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white border border-[#dadce0] shadow-[0_4px_24px_rgba(60,64,67,0.18)] p-2 z-50 animate-in fade-in slide-in-from-top-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368] px-3 py-1.5">
                            {category}
                          </div>
                          <div className="space-y-0.5">
                            {categoryTools.map((tool) => {
                              const Icon = tool.icon;
                              const isSelected = activeTab === tool.id;
                              const isPinned = pinnedTools.includes(tool.id);

                              return (
                                <div
                                  key={tool.id}
                                  onClick={() => {
                                    setActiveTab(tool.id);
                                    setOpenCategoryDropdown(null);
                                  }}
                                  className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors group ${
                                    isSelected
                                      ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                                      : 'text-[#1f1f1f] hover:bg-[#f0f4f9]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-1 rounded-lg bg-white border border-slate-100 shrink-0">
                                      <Icon className="w-5 h-5 object-contain" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold truncate">{tool.name}</p>
                                      <p className="text-[10px] text-[#5f6368] truncate">
                                        {tool.badge}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePin(tool.id);
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isPinned
                                        ? 'text-[#1a73e8] hover:bg-[#e8f0fe]'
                                        : 'text-[#5f6368] hover:text-[#1f1f1f] hover:bg-slate-100 opacity-0 group-hover:opacity-100'
                                    }`}
                                    title={isPinned ? 'Unpin from dashboard' : 'Pin to dashboard'}
                                  >
                                    <Pin
                                      className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`}
                                    />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* All Tools Launcher */}
              <button
                onClick={() => setShowWaffleMenu(!showWaffleMenu)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-[#444746] hover:bg-[#f0f4f9] hover:text-[#1f1f1f] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>Top 10 Google Suite</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && !needsAuth && token && (
          <div className="lg:hidden border-t border-[#dadce0] bg-white p-4 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-top duration-200">
            {/* Mobile User Profile & Sign Out Bar */}
            {user && (
              <div className="p-3.5 bg-[#f8fafd] rounded-2xl border border-[#dadce0] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-[#dadce0] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {user.displayName ? user.displayName[0].toUpperCase() : 'G'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1f1f1f] truncate">
                      {user.displayName || 'Google User'}
                    </p>
                    <p className="text-[11px] text-[#5f6368] truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id="mobile-sign-out-btn"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="px-2.5 py-1.5 bg-[#f1f3f4] hover:bg-[#e8eaed] text-[#3c4043] rounded-full text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                  <button
                    id="mobile-delete-account-btn"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowDeleteAccountModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-[#fce8e6] hover:bg-[#fad2cf] text-[#d93025] rounded-full text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-[#f5c6cb]"
                    title="Delete account permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#5f6368] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="mobile-search-input"
                type="text"
                placeholder="Search tools & apps..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-xs bg-[#f0f4f9] rounded-full border border-transparent focus:border-[#1a73e8] focus:bg-white outline-none"
              />
            </div>

            {/* Dashboard Quick Button */}
            <button
              id="mobile-nav-dashboard-btn"
              onClick={() => {
                setActiveTab('overview');
                setMobileMenuOpen(false);
              }}
              className={`w-full px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#c2e7ff] text-[#001d35] border border-[#b3defa]'
                  : 'text-[#1f1f1f] bg-[#f0f4f9] hover:bg-[#e8f0fe]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GoogleLogo className="w-4 h-4" />
                <span>Workspace Dashboard</span>
              </div>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-[#dadce0] text-[#5f6368]">
                Home
              </span>
            </button>

            {/* Filtered tools if searching, or categories */}
            {globalSearchQuery.trim() ? (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368] px-2">
                  Matching Tools ({filteredSearchTools.length})
                </p>
                {filteredSearchTools.length === 0 ? (
                  <p className="text-xs text-[#5f6368] p-3 text-center">No matching tools</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {filteredSearchTools.map((tool) => {
                      const Icon = tool.icon;
                      const isActive = activeTab === tool.id;
                      return (
                        <div
                          key={tool.id}
                          onClick={() => {
                            setActiveTab(tool.id);
                            setMobileMenuOpen(false);
                            setGlobalSearchQuery('');
                          }}
                          className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${
                            isActive
                              ? 'bg-[#c2e7ff] border-[#b3defa] text-[#001d35] font-semibold'
                              : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f] hover:bg-[#f0f4f9]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className="w-5 h-5 object-contain" />
                            <span className="text-xs font-medium truncate">{tool.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              CATEGORIES.map((category) => {
                const categoryTools = ALL_WORKSPACE_TOOLS.filter((t) => t.category === category);
                return (
                  <div key={category} className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368] px-2">
                      {category}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {categoryTools.map((tool) => {
                        const Icon = tool.icon;
                        const isActive = activeTab === tool.id;
                        const isPinned = pinnedTools.includes(tool.id);
                        return (
                          <div
                            key={tool.id}
                            onClick={() => {
                              setActiveTab(tool.id);
                              setMobileMenuOpen(false);
                            }}
                            className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${
                              isActive
                                ? 'bg-[#c2e7ff] border-[#b3defa] text-[#001d35] font-semibold'
                                : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f] hover:bg-[#f0f4f9]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className="w-5 h-5 object-contain" />
                              <span className="text-xs font-medium truncate">{tool.name}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePin(tool.id);
                              }}
                              className={`p-1.5 rounded-lg ${
                                isPinned ? 'text-[#1a73e8]' : 'text-[#5f6368]'
                              }`}
                              title={isPinned ? 'Unpin' : 'Pin'}
                            >
                              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

            {/* Settings & preferences link */}
            <div className="pt-2 border-t border-[#dadce0] flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSettingsModal(true);
                }}
                className="text-xs text-[#1a73e8] hover:underline font-semibold flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" /> Settings & Preferences
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full mx-auto relative flex flex-col ${
          activeTab === 'chat'
            ? 'max-w-full px-1 sm:px-2 py-1'
            : 'max-w-7xl p-2 sm:p-4 md:p-6 lg:p-8'
        }`}
      >
        {activeTab === 'privacy' ? (
          <PrivacyPolicyView onBack={() => setActiveTab('overview')} />
        ) : activeTab === 'terms' ? (
          <TermsOfServiceView onBack={() => setActiveTab('overview')} />
        ) : activeTab === 'checkout_success' ? (
          <CheckoutSuccessView
            onReturnToDashboard={() => {
              window.history.replaceState({}, '', '/');
              setActiveTab('overview');
            }}
          />
        ) : activeTab === 'checkout_cancel' ? (
          <CheckoutCancelView
            onReturnToDashboard={() => {
              window.history.replaceState({}, '', '/');
              setActiveTab('overview');
            }}
            onRetry={() => {
              window.history.replaceState({}, '', '/');
              setActiveTab('overview');
              openUpgradeModal();
            }}
          />
        ) : needsAuth || !token ? (
          /* High-Converting SEO Landing Screen */
          <LandingView
            onSignIn={handleSignIn}
            isLoggingIn={isLoggingIn}
            authError={authError}
          />
        ) : (
          /* Active Views */
          <div className="flex flex-col flex-1 h-full">
            {/* Breadcrumb Bar */}
            {activeTab !== 'overview' && activeTab !== 'chat' && (
              <div className="mb-3 sm:mb-5 flex items-center justify-between bg-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-[#dadce0] shadow-2xs">
                <nav
                  aria-label="Breadcrumb"
                  className="text-xs text-[#5f6368] flex items-center gap-1.5 sm:gap-2 font-medium"
                >
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="hover:text-[#1a73e8] transition-colors cursor-pointer flex items-center gap-1.5 font-semibold text-[#1f1f1f]"
                  >
                    Google Workspace
                  </button>
                  <span>/</span>
                  <span className="capitalize text-[#1a73e8] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-[#e8f0fe] border border-[#d2e3fc]">
                    {activeTab}
                  </span>
                </nav>
              </div>
            )}

            {activeTab === 'overview' && (
              <OverviewView
                token={token}
                userName={user?.displayName || null}
                onNavigateTab={(tab) => setActiveTab(tab)}
                anchorTools={onboardingPrefs?.anchorTools}
                userRole={onboardingPrefs?.role}
                tabCount={onboardingPrefs?.tabCount}
                onOpenOnboarding={() => setShowOnboarding(true)}
                pinnedTools={pinnedTools}
                onTogglePin={togglePin}
                onDeleteAccount={() => setShowDeleteAccountModal(true)}
                onOpenSecurity={() => setShowSecurityCenter(true)}
              />
            )}
            {/* 1. Gmail */}
            {activeTab === 'gmail' && (
              <GmailView
                token={token}
                onBackToOverview={() => setActiveTab('overview')}
                onNavigateTab={(tab) => setActiveTab(tab)}
                focusTarget={omniFocus}
                onFocusHandled={() => setOmniFocus(null)}
              />
            )}
            {/* 2. Google Drive */}
            {activeTab === 'drive' && (
              <DriveView
                token={token}
                onBackToOverview={() => setActiveTab('overview')}
                onNavigateTab={(tab) => setActiveTab(tab)}
                focusTarget={omniFocus}
                onFocusHandled={() => setOmniFocus(null)}
              />
            )}
            {/* 3. Google Docs */}
            {activeTab === 'docs' && (
              <DocsView
                token={token}
                onBackToOverview={() => setActiveTab('overview')}
                focusTarget={omniFocus}
                onFocusHandled={() => setOmniFocus(null)}

                userName={user?.displayName || 'Tanaka Prince'}
                userEmail={user?.email || 'tanakaprince49@gmail.com'}
                userPhoto={user?.photoURL || undefined}
              />
            )}
            {/* 4. Google Sheets */}
            {activeTab === 'sheets' && (
              <SheetsView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {/* 5. Google Calendar */}
            {activeTab === 'calendar' && (
              <CalendarView
                token={token}
                onBackToOverview={() => setActiveTab('overview')}
                focusTarget={omniFocus}
                onFocusHandled={() => setOmniFocus(null)}
              />
            )}
            {/* 6. Google Meet */}
            {activeTab === 'meet' && (
              <MeetView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {/* 7. Google Slides */}
            {activeTab === 'slides' && (
              <SlidesView
                token={token}
                onBackToOverview={() => setActiveTab('overview')}
                userName={user?.displayName || 'Tanaka Prince'}
                userEmail={user?.email || 'tanakaprince49@gmail.com'}
                userPhoto={user?.photoURL || undefined}
              />
            )}
            {/* 8. Google Forms */}
            {activeTab === 'forms' && (
              <FormsView
                token={token}
                onBackToOverview={() => setActiveTab('overview')}
                userName={user?.displayName || 'Tanaka Prince'}
                userEmail={user?.email || 'tanakaprince49@gmail.com'}
                userPhoto={user?.photoURL || undefined}
              />
            )}
            {/* 9. Google Keep */}
            {activeTab === 'keep' && (
              <KeepView onBackToOverview={() => setActiveTab('overview')} />
            )}
            {/* 10. Google Tasks */}
            {activeTab === 'tasks' && (
              <TasksView
                token={token}
                onBackToOverview={() => setActiveTab('overview')}
                focusTarget={omniFocus}
                onFocusHandled={() => setOmniFocus(null)}
              />
            )}

            {/* Supplementary Utilities */}
            {activeTab === 'contacts' && (
              <ContactsView
                token={token}
                onComposeEmail={(email) => {
                  setActiveTab('gmail');
                }}
                onBackToOverview={() => setActiveTab('overview')}
              />
            )}
            {activeTab === 'chat' && (
              <ChatView
                token={token}
                onBackToOverview={() => setActiveTab('overview')}
                userName={user?.displayName || 'Tanaka Prince'}
                userEmail={user?.email || 'tanakaprince49@gmail.com'}
                userPhoto={user?.photoURL || undefined}
              />
            )}
            {activeTab === 'messages' && (
              <MessagesView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {/* Any of the 24 Workspace Tools */}
            {(() => {
              const builtInTabs = [
                'overview',
                'gmail',
                'drive',
                'docs',
                'sheets',
                'calendar',
                'meet',
                'slides',
                'forms',
                'keep',
                'tasks',
                'contacts',
                'chat',
                'messages',
                'privacy',
                'terms',
              ];
              if (!builtInTabs.includes(activeTab)) {
                const matchedTool = ALL_WORKSPACE_TOOLS.find((t) => t.id === activeTab);
                if (matchedTool) {
                  return (
                    <WorkspaceAppView
                      tool={matchedTool}
                      userEmail={user?.email}
                      onBackToOverview={() => setActiveTab('overview')}
                    />
                  );
                }
              }
              return null;
            })()}
          </div>
        )}
      </main>

      {/* Footer */}
      {!isFullscreen && (
      <footer className="bg-white border-t border-[#dadce0] py-4 px-6 text-center text-xs text-[#5f6368] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 G-Deck (gdeck.org). All rights reserved.</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('privacy')}
              className="text-[#1a73e8] hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('terms')}
              className="text-[#1a73e8] hover:underline cursor-pointer"
            >
              Terms of Service
            </button>
            <span>•</span>
            <a
              href="mailto:support@gdeck.org"
              className="text-[#5f6368] hover:text-[#1f1f1f] hover:underline"
            >
              Contact Support
            </a>
            <span>•</span>
            <a
              href={SUPPORT_CAMPAIGN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#1a73e8] hover:underline cursor-pointer"
              title="Support G-Deck development"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Buy me a coffe</span>
            </a>
            {user && (
              <>
                <span>•</span>
                <button
                  id="footer-delete-account-btn"
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="text-[#d93025] hover:underline font-semibold cursor-pointer"
                >
                  Delete Account
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
      )}

      {/* Confirmation Modal for Logging Out */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out of Google Workspace"
        description="Are you sure you want to sign out? This will clear your temporary access token and disconnect the active Google session."
        confirmLabel="Sign Out"
        isDestructive={false}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Delete Account Permanently Modal */}
      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onSuccess={handleAccountDeletedSuccess}
        userEmail={user?.email}
      />

      {/* Security & Privacy Center Modal */}
      <SecurityCenterModal
        isOpen={showSecurityCenter}
        onClose={() => setShowSecurityCenter(false)}
        userEmail={user?.email}
        onOpenPrivacyPolicy={() => setActiveTab('privacy')}
        onOpenDeleteAccount={() => setShowDeleteAccountModal(true)}
      />

      {/* G-Deck Pro Subscription & Upgrade Modal */}
      <UpgradeModal />

      {/* Omni-Search Across Workspace Modal (Cmd+K) */}
      <OmniSearchModal
        isOpen={omniSearchOpen}
        onClose={() => setOmniSearchOpen(false)}
        token={token}
        onOpenResult={(target) => {
          setActiveTab(target.source);
          setOmniFocus(target);
          setOmniSearchOpen(false);
        }}
      />

      {/* G-Pilot AI Assistant */}
      {!needsAuth && token && (
        <GPilotChat token={token} userName={onboardingPrefs?.userName} />
      )}

      {/* Onboarding Wizard */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleCompleteOnboarding}
        onClose={() => {
          try {
            localStorage.setItem('gdeck_onboarding_completed', 'true');
          } catch {}
          setShowOnboarding(false);
        }}
        initialTheme="light"
        onDeleteAccount={() => setShowDeleteAccountModal(true)}
      />

      {/* Settings & Account Management Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSavePreferences={handleCompleteOnboarding}
        onOpenDeleteAccount={() => setShowDeleteAccountModal(true)}
        onSignOut={() => setShowLogoutConfirm(true)}
        userEmail={user?.email}
        currentPreferences={onboardingPrefs}
      />

      {/* Floating Real-time Notification Toast */}
      <ProRenewalReminder />
      <NotificationToast onNavigateTab={(tab) => setActiveTab(tab)} />
    </div>
    </NotificationProvider>
  );
}
