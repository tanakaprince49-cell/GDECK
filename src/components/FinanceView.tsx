import React, { useState } from 'react';
import {
  DollarSign,
  Search,
  ExternalLink,
  ArrowLeft,
  ArrowUpRight,
  TrendingUp,
  HelpCircle,
} from 'lucide-react';
import { GoogleFinanceIcon } from './GoogleIcons';

interface FinanceViewProps {
  onBackToOverview?: () => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ onBackToOverview }) => {
  const [tickerQuery, setTickerQuery] = useState<string>('');

  const handleSearchTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerQuery.trim()) return;
    const cleanTicker = encodeURIComponent(tickerQuery.trim().toUpperCase());
    window.open(`https://www.google.com/finance/quote/${cleanTicker}`, '_blank');
  };

  const quickLinks = [
    { ticker: 'GOOGL:NASDAQ', name: 'Alphabet Inc.' },
    { ticker: '.INX:INDEXSP', name: 'S&P 500' },
    { ticker: '.DJI:INDEXDJX', name: 'Dow Jones' },
    { ticker: '.IXIC:INDEXNASDAQ', name: 'Nasdaq Composite' },
  ];

  return (
    <div id="finance-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-emerald-500/10 border border-emerald-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleFinanceIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Finance</h2>
            <p className="text-sm text-slate-500">Real-time stock quotes, global market indexes & portfolio watchlists</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://finance.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            <span>Open Google Finance</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Symbol Search & Truthful State */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <GoogleFinanceIcon className="w-9 h-9" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Search Real-Time Quotes & Markets
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Look up any global stock, index, currency pair, or crypto asset directly on Google Finance to view live charts and financial statements.
          </p>
        </div>

        {/* Real Ticker Search */}
        <form onSubmit={handleSearchTicker} className="max-w-md mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticker (e.g. GOOGL, AAPL, BTC)..."
              value={tickerQuery}
              onChange={(e) => setTickerQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all shrink-0"
          >
            Search Quote
          </button>
        </form>

        {/* Quick Tickers */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto pt-1">
          <span className="text-xs text-slate-400 font-medium">Quick quotes:</span>
          {quickLinks.map((item) => (
            <a
              key={item.ticker}
              href={`https://www.google.com/finance/quote/${item.ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              <span>{item.name}</span>
              <ArrowUpRight className="w-3 h-3 text-slate-500" />
            </a>
          ))}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Syncing your watchlist</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Google Finance watchlists and portfolios are managed directly on <strong>finance.google.com</strong>. Log into your Google Account to create custom watchlists, enable price alert notifications, and track investments.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <a
            href="https://finance.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-105 inline-flex items-center gap-2"
          >
            <span>Launch Google Finance</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
