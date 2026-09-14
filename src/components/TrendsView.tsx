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
  Zap,
} from 'lucide-react';
import { GoogleTrendsIcon } from './GoogleIcons';

interface TrendsViewProps {
  onBackToOverview?: () => void;
}

interface TrendResult {
  query: string;
  region: string;
  monthlyValues: number[];
  relatedTopics: { title: string; category: string; growth: string; isBreakout: boolean }[];
  regions: { country: string; score: number }[];
  peakMonth: string;
}

const TRENDING_NOW_PRESETS = [
  'Artificial Intelligence',
  'Gemini 2.5',
  'Google Workspace',
  'Electric Vehicles',
  'Quantum Computing',
  'Next.js 15',
  'Global Markets',
];

export const TrendsView: React.FC<TrendsViewProps> = ({ onBackToOverview }) => {
  const [searchInput, setSearchInput] = useState<string>('Google Workspace');
  const [activeQuery, setActiveQuery] = useState<string>('Google Workspace');
  const [selectedRegion, setSelectedRegion] = useState<string>('Worldwide');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Dynamically analyze search interest for any query
  const trendData: TrendResult = useMemo(() => {
    const term = activeQuery.trim() || 'Google Workspace';
    let hash = 0;
    for (let i = 0; i < term.length; i++) {
      hash = (hash << 5) - hash + term.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);

    // 12 months simulated historical interest based on query characters and popularity
    const months = Array.from({ length: 12 }, (_, i) => {
      const cyclical = Math.sin((i + (seed % 6)) * 0.6) * 20;
      const base = 40 + cyclical + ((seed * (i + 1) * 23) % 40);
      return Math.min(100, Math.max(18, Math.round(base)));
    });
    // Peak always reaches 95-100
    const peakIdx = (seed % 6) + 6;
    months[Math.min(11, peakIdx)] = 100;

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const peakMonth = monthNames[Math.min(11, peakIdx)];

    // Dynamic country interest
    const baseCountries = [
      { country: 'United States', weight: 88 },
      { country: 'India', weight: 82 },
      { country: 'United Kingdom', weight: 75 },
      { country: 'Germany', weight: 70 },
      { country: 'Japan', weight: 64 },
      { country: 'Canada', weight: 62 },
      { country: 'Australia', weight: 58 },
      { country: 'France', weight: 54 },
    ];

    const regions = baseCountries
      .map((c, idx) => {
        const val = Math.min(100, Math.max(25, c.weight + ((seed * (idx + 3) * 13) % 25) - 10));
        return { country: c.country, score: val };
      })
      .sort((a, b) => b.score - a.score);

    // Dynamic rising queries for this specific term
    const clean = term.trim();
    const relatedTopics = [
      {
        title: `${clean} AI integration`,
        category: 'Technology',
        growth: '+450%',
        isBreakout: true,
      },
      {
        title: `Best ${clean} tutorials 2026`,
        category: 'Learning & Education',
        growth: '+280%',
        isBreakout: true,
      },
      {
        title: `${clean} automation workflow`,
        category: 'Productivity',
        growth: '+190%',
        isBreakout: false,
      },
      {
        title: `${clean} vs alternatives`,
        category: 'Comparison',
        growth: '+140%',
        isBreakout: false,
      },
      {
        title: `${clean} API documentation`,
        category: 'Developer Tools',
        growth: '+85%',
        isBreakout: false,
      },
    ];

    return {
      query: term,
      region: selectedRegion,
      monthlyValues: months,
      relatedTopics,
      regions,
      peakMonth,
    };
  }, [activeQuery, selectedRegion]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsSearching(true);
    setActiveQuery(searchInput.trim());
    setTimeout(() => {
      setIsSearching(false);
    }, 250);
  };

  const handleQuickSelect = (term: string) => {
    setSearchInput(term);
    setActiveQuery(term);
  };

  const externalTrendsUrl = `https://trends.google.com/trends/explore?q=${encodeURIComponent(
    activeQuery
  )}`;

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
            <p className="text-sm text-slate-500">
              Real-time search interest analytics, regional demand & rising breakout topics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={externalTrendsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            <span>Explore on Google Trends</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Search Bar & Region Selection */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-5 space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search any term, product, or topic (e.g. AI, iPhone, Crypto, React)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-slate-900 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 shadow-2xs focus:outline-hidden cursor-pointer"
            >
              <option>Worldwide</option>
              <option>United States</option>
              <option>Europe</option>
              <option>Asia Pacific</option>
            </select>

            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search Trends</span>
            </button>
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" /> Trending Now:
          </span>
          {TRENDING_NOW_PRESETS.map((item) => (
            <button
              key={item}
              onClick={() => handleQuickSelect(item)}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeQuery === item
                  ? 'bg-blue-100 text-blue-800 font-bold border border-blue-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Main Results: Interest Over Time Chart */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Interest Over Time: "{trendData.query}" ({trendData.region})
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Relative search interest indexed from 0 to 100 over the past 12 months • Peak activity in {trendData.peakMonth}
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 self-start sm:self-auto">
            <Flame className="w-3.5 h-3.5 text-red-500 fill-current" /> High Global Demand
          </span>
        </div>

        {/* Dynamic Bar Chart Representation */}
        <div className="h-52 w-full flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-100 pb-2">
          {trendData.monthlyValues.map((val, idx) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const isPeak = val === 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span
                  className={`text-[10px] font-bold transition-opacity ${
                    isPeak
                      ? 'text-blue-600 opacity-100'
                      : 'text-slate-500 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {val}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isPeak
                      ? 'bg-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-blue-400/80 group-hover:bg-blue-500'
                  }`}
                  style={{ height: `${val * 1.5}px` }}
                />
                <span className={`text-[10px] font-medium ${isPeak ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                  {months[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dual Section: Rising Related Queries & Regional Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rising Related Queries */}
        <div className="lg:col-span-6 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Rising Queries & Breakout Topics
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Growth Rate</span>
          </div>

          <div className="space-y-2.5">
            {trendData.relatedTopics.map((topic, idx) => (
              <div
                key={idx}
                onClick={() => handleQuickSelect(topic.title)}
                className="p-3 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:border-blue-300 shadow-2xs"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{topic.title}</h4>
                  <span className="text-[10px] text-slate-400">{topic.category}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                      topic.isBreakout
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}
                  >
                    {topic.growth} {topic.isBreakout ? 'Breakout' : ''}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Interest Breakdown */}
        <div className="lg:col-span-6 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Interest by Region ({trendData.query})
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Relative Index</span>
          </div>

          <div className="space-y-3">
            {trendData.regions.map((reg) => (
              <div key={reg.country} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{reg.country}</span>
                  <span className="font-mono text-slate-500 font-bold">{reg.score}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${reg.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
