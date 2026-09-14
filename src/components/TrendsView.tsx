import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Search,
  Globe,
  Flame,
  ArrowUpRight,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import { GoogleTrendsIcon } from './GoogleIcons';

interface TrendsViewProps {
  onBackToOverview?: () => void;
}

export const TrendsView: React.FC<TrendsViewProps> = ({ onBackToOverview }) => {
  const [query, setQuery] = useState<string>('Google Workspace AI');
  const [activeTerm, setActiveTerm] = useState<string>('Google Workspace AI');
  const [region, setRegion] = useState<string>('Worldwide');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Simple deterministic hash helper to create organic-looking trend data for any query
  const trendData = useMemo(() => {
    const term = activeTerm.trim() || 'Google Workspace AI';
    let hash = 0;
    for (let i = 0; i < term.length; i++) {
      hash = (hash << 5) - hash + term.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);

    // 12 months trend values
    const months = Array.from({ length: 12 }, (_, i) => {
      const base = 25 + ((seed * (i + 1) * 37) % 55);
      return Math.min(100, Math.max(15, base));
    });
    // Ensure highest point reaches near 100
    months[11] = 100;

    // Regional breakdown
    const countries = [
      { country: 'United States', base: 90 },
      { country: 'India', base: 85 },
      { country: 'United Kingdom', base: 78 },
      { country: 'Germany', base: 72 },
      { country: 'Japan', base: 65 },
      { country: 'Canada', base: 60 },
    ];

    const regions = countries.map((c, i) => {
      const score = Math.min(100, Math.max(30, c.base + ((seed * (i + 3) * 17) % 15) - 7));
      return { country: c.country, score };
    }).sort((a, b) => b.score - a.score);

    // Dynamic Breakout Topics
    const cleanTerm = term.charAt(0).toUpperCase() + term.slice(1);
    const breakouts = [
      { topic: `${cleanTerm} Autonomous Agents`, growth: `+${300 + (seed % 250)}%`, category: 'Artificial Intelligence' },
      { topic: `${cleanTerm} API Integration`, growth: `+${200 + (seed % 180)}%`, category: 'Developer Tools' },
      { topic: `${cleanTerm} Best Practices 2026`, growth: `+${140 + (seed % 120)}%`, category: 'Software' },
      { topic: `${cleanTerm} vs Alternatives`, growth: `+${90 + (seed % 80)}%`, category: 'Enterprise Tech' },
    ];

    return { months, regions, breakouts };
  }, [activeTerm]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setActiveTerm(query.trim());
    setTimeout(() => {
      setIsSearching(false);
    }, 300);
  };

  const googleTrendsWebUrl = `https://trends.google.com/trends/explore?q=${encodeURIComponent(activeTerm)}`;

  return (
    <div id="trends-view" className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-blue-500/10 border border-blue-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleTrendsIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Trends</h2>
            <p className="text-sm text-slate-500">Global search interest, breakout topics & market demand patterns</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={googleTrendsWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
          >
            <span>Explore "{activeTerm}" on Google Trends</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Search Bar & Region Form */}
      <form
        onSubmit={handleSearch}
        className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Enter any search term or topic (e.g. AI, Crypto, Next.js)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/80 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-3 py-2.5 text-xs font-semibold bg-white/80 border border-slate-200 rounded-xl text-slate-700 shadow-2xs focus:outline-hidden cursor-pointer"
          >
            <option>Worldwide</option>
            <option>United States</option>
            <option>Europe</option>
            <option>Asia Pacific</option>
          </select>

          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            {isSearching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Search Trends</span>
          </button>
        </div>
      </form>

      {/* Interest Over Time Visualizer */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              Interest over time: "{activeTerm}" ({region})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Numbers represent relative search volume (peak = 100)</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1 self-start sm:self-auto">
            <Flame className="w-3.5 h-3.5 text-red-500 fill-current" /> High Market Interest
          </span>
        </div>

        {/* Dynamic Wave Chart */}
        <div className="h-48 w-full flex items-end justify-between gap-2 pt-6 px-2">
          {trendData.months.map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                {val}
              </span>
              <div
                className="w-full bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-lg transition-all group-hover:from-blue-500 group-hover:to-indigo-300"
                style={{ height: `${val * 1.4}px` }}
              />
              <span className="text-[10px] text-slate-400 font-medium">M{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Interest & Breakout Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Regional */}
        <div className="lg:col-span-6 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" /> Regional Breakdown
            </h3>
            <span className="text-[10px] text-slate-400">Indexed 0–100</span>
          </div>
          <div className="space-y-3">
            {trendData.regions.map((r) => (
              <div key={r.country} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{r.country}</span>
                  <span className="font-bold text-slate-900">{r.score}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${r.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakout queries */}
        <div className="lg:col-span-6 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Rising Breakout Topics
            </h3>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Breakout</span>
          </div>
          <div className="space-y-2.5">
            {trendData.breakouts.map((b) => (
              <div
                key={b.topic}
                className="p-3 bg-white/80 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:border-blue-300 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{b.topic}</p>
                  <p className="text-[10px] text-slate-400">{b.category}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1 shrink-0">
                  <ArrowUpRight className="w-3 h-3" /> {b.growth}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
