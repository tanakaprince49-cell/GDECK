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
          <h3 className="text-xs font-bold text-[#1f1f1f]">Zero AI Model Training</h3>
          <p className="text-[11px] text-[#5f6368] leading-relaxed">
            Google Workspace API user data is never used to develop, train, or tune AI/ML foundation models.
          </p>
        </div>
      </div>

      {/* Main Legal Content */}
      <div className="bg-white rounded-3xl border border-[#dadce0] p-6 sm:p-8 space-y-6 text-xs text-[#444746] leading-relaxed shadow-xs">
        <p className="text-sm font-medium text-[#1f1f1f]">
          At G-Deck (<a href="https://gdeck.org" target="_blank" rel="noreferrer" className="text-[#1a73e8] underline">gdeck.org</a>), accessible from <a href="https://gdeck.org" target="_blank" rel="noreferrer" className="text-[#1a73e8] underline">https://gdeck.org</a>, the privacy and security of your data are our highest priorities. This Privacy Policy outlines the types of information we collect, how it is used, and the strict technical safeguards and data protection mechanisms we implement to protect your personal data and Google Workspace ecosystem.
        </p>

        {/* Compliance Highlights */}
        <div className="p-4 rounded-2xl bg-[#e8f0fe] border-l-4 border-[#1a73e8] space-y-1.5 text-[#174ea6]">
          <h3 className="text-xs font-bold">Google API Services User Data Policy Compliance</h3>
          <p className="text-[11px] leading-relaxed">
            G-Deck&apos;s use and transfer to any other app of information received from Google APIs adheres to the{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="underline font-semibold">
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#e6f4ea] border-l-4 border-[#137333] space-y-1.5 text-[#0d652d]">
          <h3 className="text-xs font-bold">App Defense Alliance (ADA) CASA Standards Compliance</h3>
          <p className="text-[11px] leading-relaxed">
            G-Deck is engineered and audited in accordance with App Defense Alliance (ADA) Cloud Application Security Assessment (CASA AL1 / Tier 2) requirements. We enforce strict technical and organizational controls to protect sensitive and restricted user data.
          </p>
        </div>

        <section className="space-y-3 border-t border-[#f1f3f4] pt-5">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            1. Data Protection Mechanisms for Sensitive & Restricted Data
          </h2>
          <p>
            In accordance with Google OAuth Verification requirements and CASA data protection standards, G-Deck maintains comprehensive technical, administrative, and physical safeguards:
          </p>
          <div className="space-y-3 pl-2">
            <div>
              <h3 className="text-xs font-bold text-[#1f1f1f]">A. Cryptographic Protection & Encryption in Transit</h3>
              <p className="text-[#5f6368] mt-1">
                All communications between your browser, G-Deck, and Google API servers are strictly encrypted in transit using <strong>Transport Layer Security (TLS 1.2 and TLS 1.3)</strong> with strong cipher suites (ECDHE-RSA-AES128-GCM-SHA256, ECDHE-ECDSA-AES256-GCM-SHA384). We enforce HTTP Strict Transport Security (HSTS) to prevent protocol downgrade and man-in-the-middle attacks. API requests for sensitive workspace data travel directly from the client browser to Google endpoints (<code className="text-[#1a73e8] bg-[#eef1f5] px-1 py-0.5 rounded">googleapis.com</code>).
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#1f1f1f]">B. Zero-Persistence Architecture & Protection at Rest</h3>
              <p className="text-[#5f6368] mt-1">
                G-Deck operates on a strict <strong>Zero-Persistence Architecture</strong> for user data. We do <strong>NOT</strong> operate intermediate databases, shadow caches, or persistent file stores that capture, mirror, index, or retain your emails, file contents, contacts, calendar agendas, or task lists. Sensitive data is held solely in volatile client memory (RAM) for the instantaneous duration required to render the view and is wiped immediately upon navigating away, signing out, or closing the browser.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#1f1f1f]">C. OAuth 2.0 Token Protection & Storage Controls</h3>
              <p className="text-[#5f6368] mt-1">
                G-Deck uses Google Identity Services (GIS) OAuth 2.0 token flows with short-lived bearer tokens (typically 1 hour lifetime). Tokens are isolated in browser session memory and are never written to external database logs or shared with third-party tracking scripts. Signing out immediately flushes all active tokens.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#1f1f1f]">D. Access Control, Least Privilege & Human-in-the-Loop Approvals</h3>
              <p className="text-[#5f6368] mt-1">
                We adhere to the principle of least privilege, requesting only granular scopes necessary for user-initiated tasks. Any action that sends an email, schedules a meeting, or modifies a task via AI requires explicit user review and confirmation before execution. No human at G-Deck inspects or reads your Google Workspace data under any circumstances.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#1f1f1f]">E. Vulnerability Management & ADA CASA Security Verification</h3>
              <p className="text-[#5f6368] mt-1">
                G-Deck completes annual Cloud Application Security Assessments (CASA AL1 / Tier 2) with ADA-authorized testing laboratories to validate adherence to OWASP ASVS and CASA standards. Dependencies are continuously scanned for known CVE vulnerabilities.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t border-[#f1f3f4] pt-5">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            2. AI / ML Model Training Privacy Policy Disclosure (Workspace APIs)
          </h2>
          <div className="p-3.5 rounded-xl bg-[#fff8e1] border border-[#ffe082] text-[#b78103]">
            <p className="font-semibold text-xs text-[#5d4037]">
              Affirmative Disclosure on AI/ML Model Training:
            </p>
            <p className="text-[11px] text-[#5d4037] mt-1 leading-relaxed">
              Google Workspace API user data accessed by G-Deck (including emails, calendar events, documents, contacts, and tasks) is <strong>NOT</strong> used to develop, train, fine-tune, or improve generalized Artificial Intelligence (AI) and/or Machine Learning (ML) models, including large language models (LLMs) and foundation models.
            </p>
          </div>
          <p className="text-[#5f6368]">
            AI features (G-Pilot) powered by Google&apos;s enterprise Gemini API process prompts statelessly in real-time. Prompt inputs and workspace snippets are never retained or added to public training corpora.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#f1f3f4] pt-5">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            3. Google Workspace Scopes & Purpose Specification
          </h2>
          <p className="text-[#5f6368]">
            G-Deck requests access to the following Google API scopes for the explicit purposes described:
          </p>
          <div className="overflow-x-auto border border-[#dadce0] rounded-xl">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#f8fafd] border-b border-[#dadce0] font-semibold text-[#1f1f1f]">
                <tr>
                  <th className="p-2.5">Scope</th>
                  <th className="p-2.5">Classification</th>
                  <th className="p-2.5">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dadce0] text-[#444746]">
                <tr>
                  <td className="p-2.5 font-mono text-[#1a73e8]">mail.google.com / gmail.readonly / gmail.send</td>
                  <td className="p-2.5 font-semibold text-[#d93025]">Restricted</td>
                  <td className="p-2.5">Read, search, and send emails directly inside the unified G-Deck dashboard.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono text-[#1a73e8]">drive / drive.readonly / drive.file</td>
                  <td className="p-2.5 font-semibold text-[#d93025]">Restricted</td>
                  <td className="p-2.5">Browse, search, and preview documents, spreadsheets, and files in Google Drive.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono text-[#1a73e8]">calendar / calendar.events</td>
                  <td className="p-2.5 font-semibold text-[#f29900]">Sensitive</td>
                  <td className="p-2.5">View agendas, check availability, and schedule meetings.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono text-[#1a73e8]">contacts.readonly / contacts</td>
                  <td className="p-2.5 font-semibold text-[#f29900]">Sensitive</td>
                  <td className="p-2.5">Autocompletion of recipient contacts when emailing or inviting attendees.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono text-[#1a73e8]">tasks</td>
                  <td className="p-2.5 font-semibold text-[#f29900]">Sensitive</td>
                  <td className="p-2.5">Synchronize and manage to-do items and completion statuses with Google Tasks.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono text-[#1a73e8]">meetings.space.created</td>
                  <td className="p-2.5 font-semibold text-[#f29900]">Sensitive</td>
                  <td className="p-2.5">Instant generation of Google Meet video call links.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-5">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            4. Limited Use & Prohibition on Third-Party Sharing
          </h2>
          <p className="text-[#5f6368]">
            We strictly enforce the following boundaries:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5f6368]">
            <li><strong>No Commercial Selling:</strong> We never sell, lease, or monetize your Google Workspace user data.</li>
            <li><strong>No Targeted Advertising:</strong> Your Google Workspace data is never used or transferred for advertising.</li>
            <li><strong>No Data Transfers:</strong> We do not transfer your data to third parties, data brokers, or external entities.</li>
            <li><strong>No Human Viewing:</strong> No human reads or inspects your personal Google data.</li>
          </ul>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-5">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            5. Data Retention, Deletion & Revocation Controls
          </h2>
          <p className="text-[#5f6368]">
            Because G-Deck does not store sensitive workspace content on remote servers:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5f6368]">
            <li>Signing out or clicking &quot;Delete Account &amp; Wipe Data&quot; in the Security Center immediately destroys all active session tokens and cached state.</li>
            <li>
              You can permanently revoke G-Deck&apos;s access permissions at any time via your Google Account Security Dashboard at:{' '}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-[#1a73e8] underline font-semibold">
                https://myaccount.google.com/permissions
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-5">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            6. Security Incident Response Protocol
          </h2>
          <p className="text-[#5f6368]">
            In the event of a suspected or confirmed security incident involving user tokens, G-Deck maintains a rapid incident response protocol to contain the incident within 4 hours, and will notify affected users and Google Trust &amp; Safety within 72 hours.
          </p>
        </section>

        <section className="space-y-2 border-t border-[#f1f3f4] pt-5">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            7. Contact & Security Point of Contact
          </h2>
          <p className="text-[#5f6368]">
            For privacy inquiries, security questions, or CASA audit requests:
          </p>
          <div className="space-y-1 text-xs">
            <p><strong>Security Lead:</strong> Tanaka Prince</p>
            <p><strong>Primary Email:</strong> <a href="mailto:tanakaprince49@gmail.com" className="text-[#1a73e8] underline">tanakaprince49@gmail.com</a></p>
            <p><strong>Compliance Email:</strong> <a href="mailto:support@gdeck.org" className="text-[#1a73e8] underline">support@gdeck.org</a></p>
            <p><strong>Direct Privacy Policy Link:</strong> <a href="https://gdeck.org/privacy.html" target="_blank" rel="noreferrer" className="text-[#1a73e8] underline">https://gdeck.org/privacy.html</a></p>
          </div>
        </section>
      </div>
    </div>
  );
};
