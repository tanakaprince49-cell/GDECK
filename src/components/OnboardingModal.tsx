import React, { useState } from 'react';
import { ArrowRight, User } from 'lucide-react';

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
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  onClose,
}) => {
  const [userName, setUserName] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('gdeck_onboarding_completed', 'true');
    } catch {}

    const prefs: OnboardingPreferences = {
      userName: userName.trim() || 'Workspace User',
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

  return (
    <div
      id="onboarding-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        id="onboarding-modal-container"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#dadce0] p-7 sm:p-8 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e8f0fe] flex items-center justify-center text-[#1a73e8]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1f1f1f]">Welcome to GDECK</h2>
            <p className="text-xs text-[#5f6368]">Let's personalize your workspace</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="onboarding-name-input"
              className="block text-base font-semibold text-[#1f1f1f]"
            >
              What is your name?
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

          <div className="flex items-center justify-end gap-3 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('gdeck_onboarding_completed', 'true');
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
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
