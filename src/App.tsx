import React, { useState, useEffect, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
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
  Sparkles,
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
} from 'lucide-react';

import { initAuth, googleSignIn, logout } from './services/auth';
import { ConfirmModal } from './components/ConfirmModal';
import { OverviewView } from './components/OverviewView';
import { DriveView } from './components/DriveView';
import { SheetsView } from './components/SheetsView';
import { GmailView } from './components/GmailView';
import { CalendarView } from './components/CalendarView';
import { TasksView } from './components/TasksView';
import { ChatView } from './components/ChatView';
import { ContactsView } from './components/ContactsView';
import { MeetView } from './components/MeetView';
import { FormsView } from './components/FormsView';
import { KeepView } from './components/KeepView';
import { MessagesView } from './components/MessagesView';

// Newly added Google Tools
import { DocsView } from './components/DocsView';
import { SlidesView } from './components/SlidesView';
import { DrawingsView } from './components/DrawingsView';
import { SitesView } from './components/SitesView';
import { PhotosView } from './components/PhotosView';
import { YouTubeStudioView } from './components/YouTubeStudioView';
import { AnalyticsView } from './components/AnalyticsView';
import { SearchConsoleView } from './components/SearchConsoleView';
import { TrendsView } from './components/TrendsView';
import { FinanceView } from './components/FinanceView';
import { MapsView } from './components/MapsView';
import { TranslateView } from './components/TranslateView';
import { ClassroomView } from './components/ClassroomView';

import GPilotChat from './components/GPilotChat';
import { OnboardingModal, OnboardingPreferences } from './components/OnboardingModal';
import { GDeckLogo } from './components/GDeckLogo';
import { GoogleLogo } from './components/GoogleIcons';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationCenter } from './components/NotificationCenter';
import { NotificationToast } from './components/NotificationToast';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { TermsOfServiceView } from './components/TermsOfServiceView';
import {
  ALL_WORKSPACE_TOOLS,
  CATEGORIES,
  DEFAULT_PINNED_TOOL_IDS,
  ToolDefinition,
} from './constants/tools';

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
      if (path.includes('privacy') || search.includes('privacy')) return 'privacy';
      if (path.includes('terms') || search.includes('terms')) return 'terms';
    }
    return 'overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Category Dropdown State for Desktop Nav
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<string | null>(null);
  const [showWaffleMenu, setShowWaffleMenu] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

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
    const unsubscribe = initAuth((currentUser, currentToken) => {
      setUser(currentUser);
      setToken(currentToken);
      setNeedsAuth(!currentUser || !currentToken);

      if (currentUser && currentToken) {
        const completed = localStorage.getItem('gdeck_onboarding_completed');
        if (!completed) {
          setShowOnboarding(true);
        }
      }
    });

    const handleAuthExpired = (e: any) => {
      setToken('');
      setNeedsAuth(true);
      setAuthError(
        e.detail?.message ||
          'Your Google Workspace access credentials expired or are invalid. Please reconnect below.'
      );
    };

    window.addEventListener('gdeck_auth_expired', handleAuthExpired);

    return () => {
      unsubscribe();
      window.removeEventListener('gdeck_auth_expired', handleAuthExpired);
    };
  }, []);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        const completed = localStorage.getItem('gdeck_onboarding_completed');
        if (!completed) {
          setShowOnboarding(true);
        }
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign in popup was closed before completing authorization.');
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
      <div className="min-h-screen bg-[#F8FAFD] flex flex-col font-sans antialiased text-[#1F1F1F] selection:bg-[#c2e7ff] selection:text-[#001d35] relative">
      {/* Google Workspace Top App Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#dadce0] shadow-[0_1px_2px_0_rgba(60,64,67,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Identity - Google Workspace Deck */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#f1f3f4] transition-colors cursor-pointer group"
              title="Google Workspace Deck Dashboard"
            >
              <GDeckLogo size="sm" />
              <div className="flex flex-col text-left">
                <span className="text-lg font-bold tracking-tight text-[#1f1f1f] font-['Google_Sans',Roboto,sans-serif]">
                  GDECK
                </span>
              </div>
            </button>
          </div>

          {/* Center: Google Search Pill */}
          {!needsAuth && token && (
            <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl mx-auto relative">
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
                  className="w-full pl-11 pr-10 py-2.5 bg-[#f0f4f9] hover:bg-[#e9eef6] focus:bg-white text-sm text-[#1f1f1f] placeholder-[#5f6368] rounded-full border border-transparent focus:border-[#1a73e8] focus:shadow-[0_1px_3px_1px_rgba(60,64,67,0.15)] transition-all outline-none"
                />
                {globalSearchQuery && (
                  <button
                    onClick={() => setGlobalSearchQuery('')}
                    className="absolute right-3.5 p-1 text-[#5f6368] hover:text-[#1f1f1f] rounded-full hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
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
          <div className="flex items-center gap-2">
            {!needsAuth && token && (
              <NotificationCenter onNavigateTab={(tab) => setActiveTab(tab)} />
            )}
            {user ? (
              <div className="flex items-center gap-2">
                {/* Direct Desktop Sign Out button */}
                <button
                  id="direct-header-signout-btn"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] bg-[#f0f4f9] rounded-full border border-[#dadce0] transition-colors cursor-pointer"
                  title="Sign out of Google Workspace"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>

                {/* 9-dot Google App Launcher (Waffle Menu) */}
                <div ref={waffleRef} className="relative">
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
                    className="p-1 rounded-full hover:ring-4 hover:ring-[#e8f0fe] transition-all cursor-pointer flex items-center gap-2"
                    title="Google Account"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Google Account'}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-[#dadce0]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-bold">
                        {user.displayName ? user.displayName[0].toUpperCase() : 'G'}
                      </div>
                    )}
                  </button>

                  {/* Profile Details Dropdown */}
                  {showProfileMenu && (
                    <div className="fixed sm:absolute top-16 sm:top-auto left-4 right-4 sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-72 max-w-sm ml-auto rounded-3xl bg-white border border-[#dadce0] shadow-[0_4px_24px_rgba(60,64,67,0.2)] p-4 z-50 animate-in fade-in slide-in-from-top-2">
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

                      <div className="pt-3 space-y-1.5">
                        <button
                          onClick={() => {
                            setShowOnboarding(true);
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-xl text-left flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#5f6368]" />
                          <span>Customize Preferences</span>
                        </button>
                        <button
                          id="profile-dropdown-signout-btn"
                          onClick={() => {
                            setShowLogoutConfirm(true);
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold text-[#d93025] hover:bg-[#fce8e6] rounded-xl text-left flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
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
                className="px-5 py-2 text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] flex items-center gap-2 cursor-pointer transition-all hover:shadow-[0_2px_6px_2px_rgba(60,64,67,0.15)]"
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
                className="lg:hidden p-2 text-[#5f6368] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-[#1f1f1f]" /> : <Menu className="w-6 h-6 text-[#1f1f1f]" />}
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
                <span>All 24+ Google Tools</span>
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

                <button
                  id="mobile-sign-out-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="px-3 py-1.5 bg-[#fce8e6] hover:bg-[#fad2cf] text-[#d93025] rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer border border-[#f5c6cb]"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
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

            {/* Customize preferences link */}
            <div className="pt-2 border-t border-[#dadce0] flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowOnboarding(true);
                }}
                className="text-xs text-[#1a73e8] hover:underline font-semibold flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" /> Customize Preferences
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {needsAuth || !token ? (
          /* Google Workspace Hero Sign-In Screen */
          <div className="max-w-4xl mx-auto my-8">
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#dadce0] shadow-[0_1px_3px_0_rgba(60,64,67,0.12),0_4px_8px_3px_rgba(60,64,67,0.06)] text-center space-y-6">
              {/* Google Workspace Visual Mark */}
              <div className="flex flex-col items-center justify-center">
                <div className="p-4 rounded-3xl bg-[#f8fafd] border border-[#dadce0] shadow-sm flex items-center justify-center hover:scale-105 transition-transform duration-200">
                  <GDeckLogo size="lg" />
                </div>
              </div>

              {/* 24+ Google App Logos Grid */}
              <div className="pt-2 pb-1">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-2xl mx-auto p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0]">
                  {ALL_WORKSPACE_TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <div
                        key={tool.id}
                        title={tool.name}
                        onClick={handleSignIn}
                        className="w-10 h-10 rounded-xl bg-white border border-[#dadce0] hover:border-[#1a73e8] hover:bg-[#e8f0fe] shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
                      >
                        <Icon className="w-5 h-5 object-contain" />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5 max-w-2xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1f1f1f] leading-tight font-['Google_Sans',Roboto,sans-serif]">
                  One Unified Deck for Your Google Workspace
                </h1>
                <p className="text-sm sm:text-base text-[#5f6368] leading-relaxed">
                  Directly interact with Gmail, Drive, Sheets, Docs, Tasks, Meet, and Calendar in a single interface powered by your personal Google AI assistant.
                </p>
              </div>

              {authError && (
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#fce8e6] border border-[#f5c6cb] text-[#d93025] text-xs flex items-center gap-3 text-left">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{authError}</p>
                </div>
              )}

              <div className="pt-2 flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
                <button
                  id="sign-in-action-btn"
                  onClick={handleSignIn}
                  disabled={isLoggingIn}
                  className="w-full py-3.5 px-6 rounded-full font-semibold text-sm text-white bg-[#1a73e8] hover:bg-[#1557b0] shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] hover:shadow-[0_2px_6px_2px_rgba(60,64,67,0.25)] transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.01]"
                >
                  <GoogleLogo className="w-5 h-5" />
                  <span>{isLoggingIn ? 'Connecting to Google Workspace...' : 'Sign in with Google'}</span>
                </button>
                <p className="text-xs text-[#5f6368] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#188038]" /> Safe Google Identity OAuth 2.0 connection
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Views */
          <div>
            {/* Breadcrumb Bar */}
            {activeTab !== 'overview' && (
              <div className="mb-5 flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-[#dadce0] shadow-xs">
                <nav
                  aria-label="Breadcrumb"
                  className="text-xs text-[#5f6368] flex items-center gap-2 font-medium"
                >
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="hover:text-[#1a73e8] transition-colors cursor-pointer flex items-center gap-1.5 font-semibold text-[#1f1f1f]"
                  >
                    Google Workspace
                  </button>
                  <span>/</span>
                  <span className="capitalize text-[#1a73e8] font-semibold px-2.5 py-0.5 rounded-full bg-[#e8f0fe] border border-[#d2e3fc]">
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
              />
            )}
            {activeTab === 'drive' && (
              <DriveView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'docs' && (
              <DocsView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'sheets' && (
              <SheetsView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'slides' && (
              <SlidesView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'drawings' && (
              <DrawingsView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'sites' && (
              <SitesView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'gmail' && (
              <GmailView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'messages' && (
              <MessagesView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'calendar' && (
              <CalendarView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'tasks' && (
              <TasksView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'classroom' && (
              <ClassroomView onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'chat' && (
              <ChatView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'contacts' && (
              <ContactsView
                token={token}
                onComposeEmail={(email) => {
                  setActiveTab('gmail');
                }}
                onBackToOverview={() => setActiveTab('overview')}
              />
            )}
            {activeTab === 'meet' && (
              <MeetView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'forms' && (
              <FormsView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'keep' && (
              <KeepView onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'photos' && (
              <PhotosView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'youtube' && (
              <YouTubeStudioView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'maps' && (
              <MapsView onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'translate' && (
              <TranslateView onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'searchconsole' && (
              <SearchConsoleView token={token} onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'trends' && (
              <TrendsView onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'finance' && (
              <FinanceView onBackToOverview={() => setActiveTab('overview')} />
            )}
            {activeTab === 'privacy' && (
              <PrivacyPolicyView onBack={() => setActiveTab('overview')} />
            )}
            {activeTab === 'terms' && (
              <TermsOfServiceView onBack={() => setActiveTab('overview')} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
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
          </div>
        </div>
      </footer>

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

      {/* G-Pilot AI Assistant */}
      {!needsAuth && token && (
        <GPilotChat token={token} userName={onboardingPrefs?.userName} />
      )}

      {/* Onboarding Wizard */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleCompleteOnboarding}
        onClose={() => setShowOnboarding(false)}
        initialTheme="light"
      />

      {/* Floating Real-time Notification Toast */}
      <NotificationToast onNavigateTab={(tab) => setActiveTab(tab)} />
      <Analytics />
    </div>
    </NotificationProvider>
  );
}
