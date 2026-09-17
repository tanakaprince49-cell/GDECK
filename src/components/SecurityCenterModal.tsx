import React from 'react';
import { ShieldCheck, Lock, EyeOff, KeyRound, CheckCircle2, X, ExternalLink } from 'lucide-react';

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  onOpenPrivacyPolicy?: () => void;
  onOpenDeleteAccount?: () => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onOpenPrivacyPolicy,
  onOpenDeleteAccount,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="security-center-modal-backdrop"
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="security-center-modal-container"
        className="w-full max-w-xl bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-[#dadce0] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#f1f3f4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#1f1f1f] font-['Google_Sans',Roboto,sans-serif]">
                  Security & Privacy Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                  Active & Protected
                </span>
              </div>
              <p className="text-xs text-[#5f6368]">
                How G-Deck safeguards your Google Workspace account and data
              </p>
            </div>
          </div>
          <button
            id="security-center-close-btn"
            onClick={onClose}
            className="p-1.5 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
            aria-label="Close Security Center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto text-sm text-[#3c4043]">
          {userEmail && (
            <div className="p-3 bg-[#f8fafd] rounded-2xl border border-[#dadce0] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <KeyRound className="w-4 h-4 text-[#1a73e8] shrink-0" />
                <span className="text-xs font-semibold text-[#5f6368]">Protected Account:</span>
                <span className="text-xs font-bold text-[#1f1f1f] truncate">{userEmail}</span>
              </div>
              <span className="text-[10px] font-bold text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded-md shrink-0">
                OAuth 2.0 Direct
              </span>
            </div>
          )}

          <div className="grid gap-3">
            <div className="p-3.5 rounded-2xl bg-[#f8fafd] border border-[#e8eaed] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#e8f0fe] text-[#1a73e8] shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1f1f1f]">Direct-to-Google OAuth Communication</h4>
                <p className="text-[11px] text-[#5f6368] mt-0.5 leading-relaxed">
                  Workspace queries for Gmail, Calendar, Drive, and Tasks travel directly from your browser to Google’s authenticated APIs via TLS 1.3 encryption. Your files, emails, and contacts are never proxied or held on intermediate servers.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8fafd] border border-[#e8eaed] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#e6f4ea] text-[#137333] shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1f1f1f]">Strict Human-in-the-Loop AI Approvals</h4>
                <p className="text-[11px] text-[#5f6368] mt-0.5 leading-relaxed">
                  G-Pilot cannot send emails, book calendar events, or create task items without your explicit review and one-click confirmation inside the chat window. You can edit any parameter prior to sending.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8fafd] border border-[#e8eaed] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#fef7e0] text-[#b06000] shrink-0 mt-0.5">
                <EyeOff className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1f1f1f]">Zero Training on Personal Data</h4>
                <p className="text-[11px] text-[#5f6368] mt-0.5 leading-relaxed">
                  Under Google Cloud Enterprise terms, your workspace data processed through the Gemini API is never used to train foundation models, nor shared with third-party advertisers.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8fafd] border border-[#e8eaed] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#fce8e6] text-[#c5221f] shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1f1f1f]">Instant Token Revocation & Data Wipe</h4>
                <p className="text-[11px] text-[#5f6368] mt-0.5 leading-relaxed">
                  You can revoke OAuth access with Google's authorization servers at any moment, or use the "Delete Account & Wipe Data" option to purge local storage and tokens immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-[#f1f3f4]">
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1a73e8] hover:bg-[#e8f0fe] rounded-xl transition-colors"
            >
              <span>Manage in Google Account</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center gap-2">
              {onOpenPrivacyPolicy && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPrivacyPolicy();
                  }}
                  className="px-3 py-2 text-xs font-semibold text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f1f3f4] rounded-xl transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              )}
              {onOpenDeleteAccount && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenDeleteAccount();
                  }}
                  className="px-3 py-2 text-xs font-semibold text-[#d93025] hover:bg-[#fce8e6] bg-[#fdf2f2] rounded-xl transition-colors cursor-pointer border border-[#f5c6cb]"
                >
                  Delete Account & Wipe
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
