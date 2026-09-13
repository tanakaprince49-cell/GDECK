import React from 'react';
import { ShieldCheck, Lock, EyeOff, Cpu, Trash2, Mail, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack?: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 font-sans text-[#1f1f1f]">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-[#dadce0]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-3 bg-[#e8f0fe] rounded-2xl text-[#1a73e8]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-['Google_Sans',sans-serif] text-[#1f1f1f]">
              Privacy Policy for G-Deck
            </h1>
            <p className="text-xs text-[#5f6368]">Last Updated: September 13, 2026 • gdeck.org</p>
          </div>
        </div>

        <a
          href="mailto:tanakaprince49@gmail.com"
          className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] rounded-full transition-colors"
        >
          <Mail className="w-4 h-4" />
          Contact Security Team
        </a>
      </div>

      {/* Highlights Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0] space-y-2">
          <Lock className="w-5 h-5 text-[#1a73e8]" />
          <h3 className="text-xs font-bold text-[#1f1f1f]">In-Memory Auth Tokens</h3>
          <p className="text-[11px] text-[#5f6368] leading-relaxed">
            Tokens are stored strictly in browser memory and cleared immediately when you close the tab.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0] space-y-2">
          <EyeOff className="w-5 h-5 text-[#34a853]" />
          <h3 className="text-xs font-bold text-[#1f1f1f]">Zero Middleman Storage</h3>
          <p className="text-[11px] text-[#5f6368] leading-relaxed">
            Your emails, files, and calendar events are never stored, indexed, or inspected on external servers.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0] space-y-2">
          <Cpu className="w-5 h-5 text-[#ea4335]" />
          <h3 className="text-xs font-bold text-[#1f1f1f]">Google API Limited Use</h3>
          <p className="text-[11px] text-[#5f6368] leading-relaxed">
            Strictly complies with Google's API Services User Data Policy. No third-party data sharing.
          </p>
        </div>
      </div>

      {/* Main Legal Content */}
      <div className="bg-white rounded-3xl border border-[#dadce0] p-6 sm:p-8 space-y-6 text-xs text-[#444746] leading-relaxed shadow-xs">
        <p className="text-sm font-medium text-[#1f1f1f]">
          At G-Deck (<a href="https://gdeck.org" target="_blank" rel="noreferrer" className="text-[#1a73e8] underline">gdeck.org</a>), accessible from <a href="https://gdeck.org" target="_blank" rel="noreferrer" className="text-[#1a73e8] underline">https://gdeck.org</a>, the privacy and security of your data are our highest priorities. This Privacy Policy outlines the types of information we collect, how it is used, and the strict technical safeguards we implement to protect your personal data and Google Workspace ecosystem.
        </p>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f] flex items-center gap-2">
            1. Data Architecture & Security Principles
          </h2>
          <p>G-Deck is designed as a privacy-first, client-side executive command center.</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5f6368]">
            <li>
              <strong className="text-[#1f1f1f]">In-Memory Token Storage:</strong> Authentication tokens obtained via Google OAuth 2.0 are stored strictly in-memory during your active browser session. G-Deck does not write your access tokens or refresh tokens to persistent database storage.
            </li>
            <li>
              <strong className="text-[#1f1f1f]">No Middleman Data Storage:</strong> G-Deck does not store, index, sell, or inspect the contents of your Google Workspace files, emails, messages, calendar events, or documents on external servers. All operations occur directly between your web browser and official Google APIs.
            </li>
          </ul>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            2. Information We Collect
          </h2>
          <p>When you interact with G-Deck, we collect only the minimum necessary information required to deliver and personalize your workspace experience:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5f6368]">
            <li>
              <strong className="text-[#1f1f1f]">Authentication Data:</strong> Basic Google profile information (such as your name, email address, and profile picture) provided via Google Identity and Firebase Authentication to verify your account and initialize your personal dashboard.
            </li>
            <li>
              <strong className="text-[#1f1f1f]">Workspace Preferences:</strong> Local dashboard customization settings (such as pinned tools, layout configurations, and theme preferences) stored locally on your device via browser LocalStorage.
            </li>
            <li>
              <strong className="text-[#1f1f1f]">Operational Telemetry:</strong> Anonymous, aggregated technical metrics (such as browser type, system language, and performance diagnostics) used solely to ensure application stability and UI performance.
            </li>
          </ul>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            3. Use of Google Workspace APIs & Scope Compliance
          </h2>
          <p>
            G-Deck requests permission to access specific Google APIs (such as Gmail, Google Drive, Google Sheets, Google Calendar, Google Tasks, Google Meet, and Google Keep) exclusively to enable the core productivity features of your dashboard.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5f6368]">
            <li>
              <strong className="text-[#1f1f1f]">Purpose:</strong> Google API data is accessed strictly to display your unified command center feeds and execute user-initiated actions (e.g., viewing calendar events, checking tasks, composing emails, or updating sheets).
            </li>
            <li>
              <strong className="text-[#1f1f1f]">Google API Limits:</strong> G-Deck strictly adheres to the Google API Services User Data Policy, including the Limited Use requirements.
            </li>
            <li>
              <strong className="text-[#1f1f1f]">No Third-Party Sharing:</strong> We do not share, transfer, or sell your Google user data to third parties, advertising networks, or data brokers under any circumstances.
            </li>
          </ul>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            4. Artificial Intelligence & AI Agent Features
          </h2>
          <p>
            G-Deck includes optional AI agent features powered by Google Gemini API integration to assist with cross-app summaries, task automation, and workspace insights.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5f6368]">
            <li>
              <strong className="text-[#1f1f1f]">User-Initiated Processing:</strong> Data sent to the AI agent is processed strictly to fulfill explicit prompt requests or automated workflows configured by you.
            </li>
            <li>
              <strong className="text-[#1f1f1f]">No Model Training:</strong> User data processed through G-Deck's AI integration is never used to train generalized AI models or public datasets without explicit consent.
            </li>
          </ul>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            5. Data Retention & Account Control
          </h2>
          <p>Because G-Deck operates using client-side in-memory token management:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5f6368]">
            <li>Closing your browser tab or signing out immediately clears all active authentication tokens from memory.</li>
            <li>You can revoke G-Deck’s access to your Google Account at any time directly through your Google Account Third-Party Security Settings.</li>
          </ul>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            6. Children's Privacy
          </h2>
          <p>
            G-Deck does not knowingly collect or solicit personal information from children under the age of 13. If you believe a child has provided us with personal information, please contact us immediately so we can remove the data.
          </p>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            7. Changes to This Privacy Policy
          </h2>
          <p>
            We may update our Privacy Policy periodically to reflect technical or legal updates. Any modifications will be posted on this page with an updated "Last Updated" date.
          </p>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            8. Contact Us
          </h2>
          <p>If you have questions, security inquiries, or feedback regarding this Privacy Policy, you can reach out to us directly:</p>
          <p className="font-medium text-[#1a73e8]">
            Email: <a href="mailto:tanakaprince49@gmail.com" className="underline">tanakaprince49@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
};
