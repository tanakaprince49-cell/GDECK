import React, { useState } from 'react';
import { Settings, User, Trash2, X, Shield, Lock, Bell, Check, LogOut, ArrowRight } from 'lucide-react';
import { OnboardingPreferences } from './OnboardingModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePreferences: (prefs: OnboardingPreferences) => void;
  onOpenDeleteAccount: () => void;
  onSignOut?: () => void;
  userEmail?: string | null;
  currentPreferences?: OnboardingPreferences | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSavePreferences,
  onOpenDeleteAccount,
  onSignOut,
  userEmail,
  currentPreferences,
}) => {
  const [userName, setUserName] = useState<string>(
    currentPreferences?.userName || ''
  );
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'security' | 'danger'>('profile');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const prefs: OnboardingPreferences = {
      userName: userName.trim() || 'Workspace User',
      role: currentPreferences?.role || 'general',
      tabCount: currentPreferences?.tabCount || '1-5',
      anchorTools: currentPreferences?.anchorTools || ['calendar', 'gmail', 'tasks'],
      defaultView: currentPreferences?.defaultView || 'overview',
      theme: 'light',
      highDensity: currentPreferences?.highDensity || false,
      completed: true,
    };
    onSavePreferences(prefs);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        id="settings-modal-container"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#dadce0] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#dadce0] flex items-center justify-between bg-[#f8fafd]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1f1f1f]">Settings & Preferences</h2>
              <p className="text-[11px] text-[#5f6368]">Manage your G-Deck workspace configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-[#dadce0] bg-white">
          <button
            onClick={() => setActiveSettingsTab('profile')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              activeSettingsTab === 'profile'
                ? 'border-[#1a73e8] text-[#1a73e8]'
                : 'border-transparent text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            General & Profile
          </button>
          <button
            onClick={() => setActiveSettingsTab('security')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              activeSettingsTab === 'security'
                ? 'border-[#1a73e8] text-[#1a73e8]'
                : 'border-transparent text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            Privacy & Permissions
          </button>
          <button
            onClick={() => setActiveSettingsTab('danger')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              activeSettingsTab === 'danger'
                ? 'border-[#d93025] text-[#d93025]'
                : 'border-transparent text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            Account & Session
          </button>
        </div>

        {/* Modal content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeSettingsTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="settings-name-input"
                  className="block text-xs font-bold text-[#1f1f1f] uppercase tracking-wider"
                >
                  Display Name
                </label>
                <input
                  id="settings-name-input"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 bg-[#f8fafd] border border-[#dadce0] focus:border-[#1a73e8] focus:bg-white rounded-xl text-sm font-medium text-[#1f1f1f] outline-none transition-all"
                />
                <p className="text-[11px] text-[#5f6368]">
                  Used in your G-Deck greeting banner and AI assistant conversations.
                </p>
              </div>

              {userEmail && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1f1f1f] uppercase tracking-wider">
                    Connected Google Account
                  </label>
                  <div className="p-3 rounded-xl bg-[#f0f4f9] border border-[#dadce0] text-xs font-semibold text-[#1f1f1f] flex items-center justify-between">
                    <span>{userEmail}</span>
                    <span className="text-[10px] font-bold text-[#188038] bg-[#e6f4ea] px-2 py-0.5 rounded-full">
                      OAuth Active
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#5f6368] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeSettingsTab === 'security' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#e6f4ea] border border-[#ceead6] flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#137333] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#137333]">Zero-Retention Security Architecture</p>
                  <p className="text-[11px] text-[#137333]/90 leading-relaxed">
                    G-Deck connects directly to Google Workspace APIs using client-side tokens. Your emails, calendar events, and drive files are never stored on external databases.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-[#1f1f1f]">Authorized Workspace Scopes</p>
                <ul className="text-xs text-[#5f6368] space-y-1.5">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#188038]" /> Gmail (Read & Draft Compose)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#188038]" /> Google Calendar (Events & Schedules)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#188038]" /> Google Drive (Recent Files & Pickers)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#188038]" /> Google Tasks (Task Lists & Checklists)
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeSettingsTab === 'danger' && (
            <div className="space-y-5">
              {/* Sign Out Action */}
              <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#1f1f1f]">Active Session</p>
                    <p className="text-[11px] text-[#5f6368]">
                      Sign out of your active Google Workspace session on this device.
                    </p>
                  </div>
                  {onSignOut && (
                    <button
                      id="settings-signout-btn"
                      type="button"
                      onClick={() => {
                        onClose();
                        onSignOut();
                      }}
                      className="px-3.5 py-1.5 bg-[#f0f4f9] hover:bg-[#e8eaed] text-[#1f1f1f] text-xs font-semibold rounded-full border border-[#dadce0] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5 text-[#5f6368]" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Permanent Account Deletion Action */}
              <div className="p-4 rounded-2xl bg-[#fdf2f2] border border-[#f5c6cb] space-y-3">
                <div className="flex items-center gap-2 text-[#d93025]">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Delete Account & Wipe Data</span>
                </div>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Permanently revokes all Google OAuth tokens, deletes your local cached preferences, and removes all workspace session state from this device.
                </p>

                <button
                  id="settings-delete-account-btn"
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDeleteAccount();
                  }}
                  className="px-4 py-2 bg-[#d93025] hover:bg-[#b3261e] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account Permanently</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
