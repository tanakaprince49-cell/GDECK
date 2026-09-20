import React, { useState, useEffect } from 'react';
import { ArrowRight, User, Monitor, Smartphone } from 'lucide-react';

export interface OnboardingPreferences {
  userName: string;
  role: string;
  tabCount: string;
  anchorTools: string[];
  defaultView: string;
  theme: 'light';
  highDensity: boolean;
  completed: boolean;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (prefs: OnboardingPreferences) => void;
  onClose?: () => void;
  initialTheme?: string;
  onDeleteAccount?: () => void;
  /** Prefill name from Google profile on first signup. */
  initialName?: string | null;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  onClose,
  onDeleteAccount,
  initialName,
}) => {
  const [userName, setUserName] = useState<string>(() => (initialName || '').trim());

  useEffect(() => {
    if (isOpen && initialName && !userName.trim()) {
      setUserName(initialName.trim());
    }
  }, [isOpen, initialName, userName]);

  if (!isOpen) return null;

  const finish = (name: string) => {
    try {
      localStorage.setItem('gdeck_onboarding_completed', 'true');
      localStorage.setItem('gdeck_desktop_tip_seen', 'true');
    } catch {}

    const prefs: OnboardingPreferences = {
      userName: name.trim() || 'Workspace User',
      role: 'general',
      tabCount: '1-5',
      anchorTools: ['calendar', 'gmail', 'tasks'],
      defaultView: 'overview',
      theme: 'light',
      highDensity: false,
      completed: true,
    };
    onComplete(prefs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    finish(userName);
  };

  return (
    <div
      id="onboarding-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        id="onboarding-modal-container"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#dadce0] p-6 sm:p-8 space-y-5 max-h-[min(92vh,40rem)] overflow-y-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e8f0fe] flex items-center justify-center text-[#1a73e8] shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#1f1f1f]">Welcome to G-Deck</h2>
            <p className="text-xs text-[#5f6368]">Quick setup before you dive in</p>
          </div>
        </div>

        {/* Best-on-desktop tip — shown on first signup */}
        <div
          id="onboarding-desktop-tip"
          className="rounded-2xl border border-[#f0e0b0] bg-[#fffbeb] px-3.5 py-3 space-y-2"
        >
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#f0e0b0] flex items-center justify-center shrink-0 text-[#8a5a00]">
              <Monitor className="w-4 h-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-bold text-[#1f1f1f] leading-snug">
                G-Deck is better on a laptop or desktop
              </p>
              <p className="text-xs text-[#5f6368] leading-relaxed">
                The full Workspace deck (Gmail, Drive, Calendar, Docs, and the rest) is built for a
                larger screen. On a phone it can feel <span className="font-semibold text-[#1f1f1f]">cramped and a bit ugly</span> —
                you can still use it, but the experience is much cleaner on laptop or desktop.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#8a5a00] pl-0.5">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>Mobile works · laptop / desktop is the sweet spot</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="onboarding-name-input"
              className="block text-sm font-semibold text-[#1f1f1f]"
            >
              What should we call you?
            </label>
            <input
              id="onboarding-name-input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Tanaka Prince"
              autoFocus
              className="w-full px-4 py-3 bg-[#f8fafd] border border-[#dadce0] focus:border-[#1a73e8] focus:bg-white rounded-xl text-sm font-medium text-[#1f1f1f] outline-none transition-all shadow-inner placeholder:text-[#9aa0a6]"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {onDeleteAccount ? (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  onDeleteAccount();
                }}
                className="text-xs font-semibold text-[#d93025] hover:underline cursor-pointer"
              >
                Delete Account
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('gdeck_onboarding_completed', 'true');
                      localStorage.setItem('gdeck_desktop_tip_seen', 'true');
                    } catch {}
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#5f6368] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
                >
                  Skip
                </button>
              )}
              <button
                id="onboarding-submit-btn"
                type="submit"
                className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
              >
                <span>Got it — continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
