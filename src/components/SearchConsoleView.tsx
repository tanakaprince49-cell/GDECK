import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  ArrowLeft,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { GoogleSearchConsoleIcon } from './GoogleIcons';

interface SearchConsoleViewProps {
  onBackToOverview?: () => void;
}

export const SearchConsoleView: React.FC<SearchConsoleViewProps> = ({ onBackToOverview }) => {
  const [inspectUrl, setInspectUrl] = useState<string>('');

  const handleInspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectUrl) return;
    const url = encodeURIComponent(inspectUrl.startsWith('http') ? inspectUrl : `https://${inspectUrl}`);
    window.open(`https://search.google.com/search-console/inspect?resource_id=${url}`, '_blank');
  };

  return (
    <div id="search-console-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-blue-500/10 border border-blue-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleSearchConsoleIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Search Console</h2>
            <p className="text-sm text-slate-500">Organic Google Search performance, clicks, ranking queries & indexing</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            <span>Open Search Console Web</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Truthful Not Connected State */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
          <GoogleSearchConsoleIcon className="w-9 h-9" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            No Verified Search Console Properties Found
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            You do not currently have verified domain or URL-prefix properties associated with this Google Account. Search Console requires verifying site ownership to track organic clicks, impressions, and index status.
          </p>
        </div>

        {/* Quick URL Inspection */}
        <form onSubmit={handleInspect} className="max-w-md mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Inspect any website URL..."
              value={inspectUrl}
              onChange={(e) => setInspectUrl(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all shrink-0"
          >
            Inspect
          </button>
        </form>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>How to add a website property</span>
          </div>
          <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Open <strong>Google Search Console</strong>.</li>
            <li>Click <strong>Add Property</strong> and choose <em>Domain</em> or <em>URL prefix</em>.</li>
            <li>Verify ownership via DNS TXT record or HTML file/tag.</li>
            <li>Submit your sitemap (e.g. <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">/sitemap.xml</code>) to begin indexing.</li>
          </ol>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://search.google.com/search-console/welcome"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
          >
            <span>Verify Property on Search Console</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
