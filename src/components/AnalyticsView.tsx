import React from 'react';
import {
  ExternalLink,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react';
import { GoogleAnalyticsIcon } from './GoogleIcons';

interface AnalyticsViewProps {
  onBackToOverview?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onBackToOverview }) => {
  return (
    <div id="analytics-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-amber-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-amber-500/10 border border-amber-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleAnalyticsIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Analytics 4</h2>
            <p className="text-sm text-slate-500">Live audience metrics, conversion funnels & traffic attribution</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#fbe618] hover:bg-[#ffe600] text-[#0B0F17] text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            title="Open Google Analytics Web"
          >
            <span>Open Google Analytics</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Truthful Not Connected State */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
          <GoogleAnalyticsIcon className="w-9 h-9" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            No Google Analytics 4 Property Connected
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            You do not currently have an active Google Analytics data stream or property linked to this workspace. Google Analytics requires setting up a GA4 Web or App Data Stream in your Google Account.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>How to access your analytics</span>
          </div>
          <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Open the <strong>Google Analytics Console</strong> using your Google account.</li>
            <li>Create or select an existing <strong>GA4 Property</strong>.</li>
            <li>Install your Measurement Tag (<code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">G-XXXXXXXXXX</code>) on your web properties.</li>
            <li>View realtime visitors, traffic sources, and conversion funnels directly.</li>
          </ol>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://analytics.google.com/analytics/web/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-[#fbe618] hover:bg-[#ffe600] text-[#0B0F17] font-black text-xs rounded-xl shadow-xs transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
          >
            <span>Launch Google Analytics Console</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
