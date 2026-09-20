import React from 'react';
import {
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  Layers,
  Globe,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ToolDefinition } from '../constants/tools';

interface WorkspaceAppViewProps {
  tool: ToolDefinition;
  userEmail?: string | null;
  onBackToOverview: () => void;
}

export const WorkspaceAppView: React.FC<WorkspaceAppViewProps> = ({
  tool,
  userEmail,
  onBackToOverview,
}) => {
  const Icon = tool.icon;

  const handleOpenWeb = () => {
    window.open(tool.webUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 h-full min-h-0 overflow-y-auto p-3 sm:p-0">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-[#dadce0] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#f8fafd] border border-[#dadce0] p-2.5 flex items-center justify-center shrink-0 shadow-2xs">
            <Icon className="w-9 h-9 object-contain" alt={tool.name} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-[#1f1f1f]">{tool.name}</h1>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${tool.badgeColor}`}>
                {tool.badge}
              </span>
              <span className="text-[11px] font-medium text-[#5f6368] bg-[#f1f3f4] px-2 py-0.5 rounded-full">
                {tool.category}
              </span>
            </div>
            <p className="text-sm text-[#5f6368] max-w-xl">{tool.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBackToOverview}
            className="px-4 py-2.5 rounded-full border border-[#dadce0] text-[#1f1f1f] hover:bg-[#f1f3f4] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Deck Overview
          </button>
          <button
            type="button"
            onClick={handleOpenWeb}
            className="px-5 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Launch {tool.shortName}
          </button>
        </div>
      </div>

      {/* Main Workspace Frame / Launch Surface */}
      <div className="bg-white rounded-3xl border border-[#dadce0] p-6 sm:p-10 shadow-xs text-center space-y-8">
        <div className="max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#188038]" />
            Official Google Workspace Connected
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1f1f1f]">
            Direct Access to {tool.name}
          </h2>
          <p className="text-xs sm:text-sm text-[#5f6368] leading-relaxed">
            Connected via your Google Account{' '}
            {userEmail && <strong className="text-[#1f1f1f]">({userEmail})</strong>}. You can launch {tool.name} with your signed-in credentials with zero friction.
          </p>
        </div>

        {/* Feature / Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0]">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1a73e8] flex items-center justify-center mb-2">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#1f1f1f] mb-1">Live Cloud Sync</h3>
            <p className="text-[11px] text-[#5f6368] leading-normal">
              Instant synchronization across all Google Workspace desktop & mobile sessions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0]">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#188038] flex items-center justify-center mb-2">
            </div>
            <h3 className="text-xs font-bold text-[#1f1f1f] mb-1">G-Pilot Ready</h3>
            <p className="text-[11px] text-[#5f6368] leading-normal">
              Ask G-Pilot AI in the sidebar anytime for intelligent links, data summaries & shortcuts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#dadce0]">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#b06000] flex items-center justify-center mb-2">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#1f1f1f] mb-1">24-in-1 Unification</h3>
            <p className="text-[11px] text-[#5f6368] leading-normal">
              Switch back to emails, spreadsheets, calendar, or notes with one tap in your G-Deck bar.
            </p>
          </div>
        </div>

        {/* CTA Launch Banner */}
        <div className="p-6 rounded-2xl bg-[#f8fafd] border border-[#d2e3fc] max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-0.5">
            <span className="text-xs font-bold text-[#1f1f1f] block">
              Ready to work in {tool.name}?
            </span>
            <span className="text-[11px] text-[#5f6368] block">
              Opens {tool.webUrl} in a focused workspace tab.
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenWeb}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Launch Web App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
