import React from 'react';
import {
  Lock,
  ArrowRight,
  CheckCircle2,
  Star,
  Trash2,
  ShieldCheck,
  Grid,
} from 'lucide-react';
import {
  GoogleLogo,
} from './GoogleIcons';
import {
  ALL_WORKSPACE_TOOLS,
  ToolDefinition,
} from '../constants/tools';

interface LandingViewProps {
  onSignIn: () => void;
  isLoggingIn: boolean;
  authError: string | null;
}

const REVIEWS = [
  {
    name: 'Sarah Lin',
    role: 'Founder & CEO, TechScale',
    comment: 'GDECK eliminated my chronic 20-tab morning routine. Being able to check emails, see calendar clashes, and search Drive in one unified deck has saved our team hours every week.',
    rating: 5,
  },
  {
    name: 'Marcus Vance',
    role: 'Operations Lead, GlobalVentures',
    comment: 'The Gemini G-Pilot assistant is remarkable. I just ask "what’s on my schedule tomorrow" or "find the client pitch deck" and it pulls up the exact links instantly.',
    rating: 5,
  },
  {
    name: 'Elena Rostova',
    role: 'Product Manager & Consultant',
    comment: 'The email link highlighting and attachment previews in Gmail alone make this 10x better than standard webmail. The liquid-glass interface feels futuristic and ultra-responsive.',
    rating: 5,
  },
];

export const LandingView: React.FC<LandingViewProps> = ({
  onSignIn,
  isLoggingIn,
  authError,
}) => {
  const [hoveredTool, setHoveredTool] = React.useState<ToolDefinition | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-16 py-6 sm:py-10 animate-in fade-in duration-300">
      {/* 1. HERO SECTION */}
      <section className="bg-white rounded-3xl border border-[#dadce0] p-6 sm:p-12 shadow-[0_1px_3px_0_rgba(60,64,67,0.12),0_4px_8px_3px_rgba(60,64,67,0.06)] text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-blue-50/60 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8f0fe] border border-[#d2e3fc] text-[#1a73e8] text-xs font-semibold mb-6 shadow-xs">
          <span>The Next-Gen Google Workspace Command Deck</span>
        </div>

        {/* Main Value Proposition Title */}
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#1f1f1f] leading-[1.15] font-['Google_Sans',Roboto,sans-serif]">
            Get Your Workday Back.
          </h1>
          <p className="text-base sm:text-lg text-[#5f6368] leading-relaxed max-w-2xl mx-auto">
            Work across your emails, files, schedules, and tasks in one high-speed command deck guided by an integrated AI agent that executes tasks so you never lose focus.
          </p>
        </div>

        {/* ALL 24 GOOGLE TOOLS HERO GRID */}
        <div className="my-8 max-w-3xl mx-auto space-y-2">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#f8fafd] border border-[#dadce0] shadow-inner">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-[#1f1f1f] flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-[#1a73e8]" /> All 24 Integrated Google Applications
              </span>
              <span className="text-[11px] font-semibold text-[#1a73e8] bg-[#e8f0fe] px-2.5 py-0.5 rounded-full">
                {hoveredTool ? `${hoveredTool.name} — ${hoveredTool.category}` : '24 Tools Connected'}
              </span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 sm:gap-2.5">
              {ALL_WORKSPACE_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isHovered = hoveredTool?.id === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={onSignIn}
                    onMouseEnter={() => setHoveredTool(tool)}
                    onMouseLeave={() => setHoveredTool(null)}
                    title={`${tool.name} (${tool.category}): ${tool.desc}`}
                    className={`aspect-square rounded-2xl bg-white border flex items-center justify-center transition-all duration-200 cursor-pointer relative group ${
                      isHovered
                        ? 'border-[#1a73e8] bg-[#e8f0fe] scale-110 shadow-md z-10'
                        : 'border-[#dadce0] hover:border-[#1a73e8] hover:bg-[#f1f3f4] shadow-xs'
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                  </button>
                );
              })}
            </div>
            
            {/* Active tool preview bar */}
            <div className="mt-3 pt-2.5 border-t border-[#dadce0]/60 flex items-center justify-between text-left text-xs px-1">
              <div className="min-w-0">
                <span className="font-bold text-[#1f1f1f]">
                  {hoveredTool ? hoveredTool.name : 'Hover over any tool'}
                </span>
                <span className="text-[#5f6368] ml-2 truncate inline-block max-w-[280px] sm:max-w-md align-bottom">
                  {hoveredTool ? hoveredTool.desc : 'Click any icon to connect your Google account'}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-[#188038] shrink-0 bg-[#e6f4ea] px-2 py-0.5 rounded-md">
                {hoveredTool ? hoveredTool.badge : 'All-in-One'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {authError && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-[#fce8e6] border border-[#f5c6cb] text-[#d93025] text-xs flex items-center gap-3 text-left">
            <span className="font-semibold">{authError}</span>
          </div>
        )}

        {/* Primary High-Conversion Call To Action */}
        <div className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
          <button
            id="hero-sign-in-btn"
            onClick={onSignIn}
            disabled={isLoggingIn}
            className="w-full py-4 px-8 rounded-full font-bold text-sm sm:text-base text-white bg-[#1a73e8] hover:bg-[#1557b0] shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] hover:shadow-[0_2px_6px_2px_rgba(60,64,67,0.25)] transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <GoogleLogo className="w-5 h-5 bg-white p-0.5 rounded-full" />
            <span>{isLoggingIn ? 'Connecting to Google Workspace...' : 'Connect Google Workspace (Free)'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#5f6368]">
            <span className="flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-[#1a73e8]" /> 100% Client-Side Privacy
            </span>
          </div>
        </div>

        {/* Key Metrics Strip */}
        <div className="mt-12 pt-8 border-t border-[#f1f3f4] grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#1f1f1f]">24 in 1</div>
            <div className="text-xs text-[#5f6368] font-medium mt-0.5">Official Google Apps Unified</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#1a73e8]">2.5 hrs</div>
            <div className="text-xs text-[#5f6368] font-medium mt-0.5">Saved per User Weekly</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#188038]">0 MB</div>
            <div className="text-xs text-[#5f6368] font-medium mt-0.5">Personal Data Stored</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#f9ab00]">4.9 / 5</div>
            <div className="text-xs text-[#5f6368] font-medium mt-0.5">User Satisfaction Rating</div>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM VS THE GDECK SOLUTION */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1f1f1f]">Why Power Users Choose GDECK</h2>
          <p className="text-xs sm:text-sm text-[#5f6368]">
            Compare standard browser tab chaos with the focused clarity of GDECK.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* The Old Way */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#f5c6cb]/60 bg-red-50/20 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-[#d93025] text-xs font-bold">
              <span>✕ The Old Way: Tab Chaos</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-[#5f6368]">
              <li className="flex items-start gap-2.5">
                <span className="text-[#d93025] font-bold">✕</span>
                <span>20+ open browser tabs eating up 4GB+ of computer memory.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#d93025] font-bold">✕</span>
                <span>Constantly clicking back and forth between Gmail, Calendar, and Google Drive.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#d93025] font-bold">✕</span>
                <span>Context switching fatigue causing missed meetings and delayed email responses.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#d93025] font-bold">✕</span>
                <span>Searching for documents across multiple separate windows.</span>
              </li>
            </ul>
          </div>

          {/* The GDECK Way */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ceead6] bg-green-50/20 space-y-4 shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6f4ea] text-[#188038] text-xs font-bold">
              <span>✓ The GDECK Way: Liquid Command Center</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-[#1f1f1f]">
              <li className="flex items-start gap-2.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#188038] shrink-0 mt-0.5" />
                <span>One streamlined window for all 24 Google applications.</span>
              </li>
              <li className="flex items-start gap-2.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#188038] shrink-0 mt-0.5" />
                <span>Instant cross-workspace search and unified notification feed.</span>
              </li>
              <li className="flex items-start gap-2.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#188038] shrink-0 mt-0.5" />
                <span>G-Pilot Gemini AI assistant ready to draft, schedule, and summarize on command.</span>
              </li>
              <li className="flex items-start gap-2.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#188038] shrink-0 mt-0.5" />
                <span>HTML email parsing with highlighted link badges and media attachments.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. PRIVACY & SECURITY GUARANTEES */}
      <section className="bg-white rounded-3xl border border-[#dadce0] p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f1f3f4] pb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1f1f1f]">Your Workspace Data Belongs Strictly to You</h2>
          </div>
          <button
            onClick={onSignIn}
            className="px-5 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shrink-0"
          >
            <GoogleLogo className="w-4 h-4 bg-white p-0.5 rounded-full" /> Connect Securely
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="font-bold text-xs sm:text-sm text-[#1f1f1f] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#1a73e8]" /> Direct Google OAuth 2.0
            </div>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              We authenticate directly with Google’s identity system. Your passwords are never seen, handled, or stored.
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-xs sm:text-sm text-[#1f1f1f] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#188038]" /> Zero Database Storage
            </div>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              Your emails, calendar events, and drive files are queried on the fly and rendered strictly in your browser session.
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-xs sm:text-sm text-[#1f1f1f] flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-[#d93025]" /> Instant One-Click Data Wipe
            </div>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              Use the built-in deletion tool to permanently revoke tokens from Google and clear all browser data instantly.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CUSTOMER SOCIAL PROOF / REVIEWS */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-1 text-[#f9ab00]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1f1f1f]">Loved by Founders & Workspace Power Users</h2>
          <p className="text-xs sm:text-sm text-[#5f6368]">
            Rated 4.9/5 stars for dramatically cutting tab clutter and supercharging productivity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((r, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-[#dadce0] shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-[#f9ab00]">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#1f1f1f] italic leading-relaxed">
                  "{r.comment}"
                </p>
              </div>
              <div className="pt-3 border-t border-[#f1f3f4]">
                <div className="font-bold text-xs text-[#1f1f1f]">{r.name}</div>
                <div className="text-[11px] text-[#5f6368]">{r.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. BOTTOM CONVERSION CTA BANNER */}
      <section className="bg-gradient-to-r from-[#1a73e8] to-[#1557b0] rounded-3xl p-8 sm:p-12 text-center text-white shadow-lg space-y-6 relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight font-['Google_Sans',Roboto,sans-serif]">
            Ready to Reclaim Your Workspace?
          </h2>
          <p className="text-xs sm:text-base text-white/90 leading-relaxed max-w-xl mx-auto">
            Connect your Google account in 30 seconds and experience the all-in-one liquid glass command center for all 24 Google applications.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
          <button
            id="bottom-cta-sign-in-btn"
            onClick={onSignIn}
            disabled={isLoggingIn}
            className="w-full py-4 px-8 rounded-full font-bold text-sm sm:text-base text-[#1a73e8] bg-white hover:bg-white/95 shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-105 active:scale-95"
          >
            <GoogleLogo className="w-5 h-5" />
            <span>{isLoggingIn ? 'Connecting...' : 'Get Started Free with Google'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
