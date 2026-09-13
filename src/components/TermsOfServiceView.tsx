import React from 'react';
import { FileText, Shield, Scale, AlertTriangle, ArrowLeft, Mail } from 'lucide-react';

interface TermsOfServiceViewProps {
  onBack?: () => void;
}

export const TermsOfServiceView: React.FC<TermsOfServiceViewProps> = ({ onBack }) => {
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
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-['Google_Sans',sans-serif] text-[#1f1f1f]">
              Terms of Service for G-Deck
            </h1>
            <p className="text-xs text-[#5f6368]">Effective Date: September 13, 2026 • gdeck.org</p>
          </div>
        </div>

        <a
          href="mailto:support@gdeck.org"
          className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] rounded-full transition-colors"
        >
          <Mail className="w-4 h-4" />
          Contact Support
        </a>
      </div>

      {/* Highlights Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0] space-y-2">
          <Shield className="w-5 h-5 text-[#1a73e8]" />
          <h3 className="text-xs font-bold text-[#1f1f1f]">Official Google OAuth 2.0</h3>
          <p className="text-[11px] text-[#5f6368] leading-relaxed">
            Authenticated directly with Google OAuth 2.0. You maintain 100% control over access permissions.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0] space-y-2">
          <Scale className="w-5 h-5 text-[#34a853]" />
          <h3 className="text-xs font-bold text-[#1f1f1f]">Client-Side Integration</h3>
          <p className="text-[11px] text-[#5f6368] leading-relaxed">
            Integrates directly with official Google Workspace APIs to render your unified command center.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0] space-y-2">
          <AlertTriangle className="w-5 h-5 text-[#fbbc04]" />
          <h3 className="text-xs font-bold text-[#1f1f1f]">Acceptable Use</h3>
          <p className="text-[11px] text-[#5f6368] leading-relaxed">
            Fair use policy adhering to Google API guidelines, rate limits, and client security standards.
          </p>
        </div>
      </div>

      {/* Main Legal Content */}
      <div className="bg-white rounded-3xl border border-[#dadce0] p-6 sm:p-8 space-y-6 text-xs text-[#444746] leading-relaxed shadow-xs">
        <p className="text-sm font-medium text-[#1f1f1f]">
          Welcome to G-Deck (<a href="https://gdeck.org" target="_blank" rel="noreferrer" className="text-[#1a73e8] underline">gdeck.org</a>). Please review our Terms of Service below carefully.
        </p>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">1. Acceptance of Terms</h2>
          <p>
            By accessing or using G-Deck (accessible via <a href="https://gdeck.org" target="_blank" rel="noreferrer" className="text-[#1a73e8] underline">https://gdeck.org</a>), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the application.
          </p>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">2. Description of Service</h2>
          <p>
            G-Deck provides a client-side command center and workspace aggregator interface designed to integrate with official Google Workspace APIs (including Gmail, Google Drive, Google Sheets, Google Calendar, Google Tasks, Google Meet, Google Keep, and other supported tools). G-Deck enables users to view, manage, and execute actions across their Google services within a unified dashboard.
          </p>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">3. Account Access & Authorization</h2>
          <p>
            To use G-Deck, you must authenticate using your official Google Account via Google OAuth 2.0. By signing in, you grant G-Deck permission to interact with the specified Google APIs on your behalf, subject to the permissions (scopes) you approve during authentication.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5f6368]">
            <li>You are responsible for maintaining the security of your Google Account and authentication credentials.</li>
            <li>You are solely responsible for all activities that occur under your session.</li>
            <li>You may revoke G-Deck's access to your Google Account at any time via your Google Account Security Settings.</li>
          </ul>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">4. Acceptable Use Policy</h2>
          <p>You agree not to misuse G-Deck or assist any third party in doing so. You agree that you will not:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5f6368]">
            <li>Use G-Deck for any unlawful, illegal, or unauthorized purpose.</li>
            <li>Attempt to reverse engineer, decompile, or extract source code from the service except as permitted by law.</li>
            <li>Interfere with or disrupt the performance, integrity, or security of G-Deck or its underlying services.</li>
            <li>Bypass or attempt to bypass any rate limits, security measures, or access controls established by G-Deck or Google APIs.</li>
          </ul>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">5. Intellectual Property Rights</h2>
          <p>
            All rights, title, and interest in and to G-Deck (excluding user content and third-party APIs), including the G-Deck trademark, logo, design system, UI/UX architecture, and software code, are and will remain the exclusive property of G-Deck. Third-party trademarks and logos (such as Google Workspace logos) belong to their respective owners.
          </p>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">6. Google API & Third-Party Service Dependencies</h2>
          <p>
            G-Deck operates by interacting directly with official Google APIs and services. G-Deck is independent of, and not directly affiliated with, Google LLC. Availability of features within G-Deck is subject to the operational status, rate limits, and service terms of Google APIs. G-Deck is not responsible for any downtime, API modifications, or data loss caused by third-party services.
          </p>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">7. Disclaimer of Warranties</h2>
          <p>
            G-Deck is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance. G-Deck does not warrant that the service will be uninterrupted, error-free, secure, or completely free of bugs.
          </p>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, in no event shall G-Deck, its developers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use G-Deck; (ii) any third-party conduct or content on the service; or (iii) unauthorized access, use, or alteration of your transmissions or content.
          </p>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">9. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to G-Deck at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">10. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. Any changes will be posted on this page with an updated effective date. Your continued use of G-Deck after any modifications constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-4">
          <h2 className="text-sm font-bold text-[#1f1f1f]">11. Contact Information</h2>
          <p>For questions or inquiries regarding these Terms of Service, please contact us at:</p>
          <p className="font-medium text-[#1a73e8]">
            Email: <a href="mailto:support@gdeck.org" className="underline">support@gdeck.org</a>
          </p>
          <p className="font-medium text-[#1a73e8]">
            Website: <a href="https://gdeck.org" target="_blank" rel="noreferrer" className="underline">https://gdeck.org</a>
          </p>
        </section>
      </div>
    </div>
  );
};
