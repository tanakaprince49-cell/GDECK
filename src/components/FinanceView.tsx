import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Search,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Bookmark,
  Sparkles,
  BarChart3,
  Building,
  RefreshCw,
} from 'lucide-react';
import { GoogleFinanceIcon } from './GoogleIcons';

interface FinanceViewProps {
  onBackToOverview?: () => void;
}

interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketCap: string;
  peRatio?: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  volume: string;
  exchange: string;
  description: string;
}

const KNOWN_ASSETS: Record<string, StockQuote> = {
  GOOGL: {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 182.45,
    change: 2.35,
    changePercent: 1.30,
    currency: 'USD',
    marketCap: '2.28T',
    peRatio: 26.4,
    dayHigh: 183.9,
    dayLow: 180.1,
    yearHigh: 191.75,
    yearLow: 129.4,
    volume: '24.8M',
    exchange: 'NASDAQ',
    description: 'Alphabet Inc. is an American multinational technology conglomerate holding company created through a restructuring of Google.',
  },
  AAPL: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    price: 228.12,
    change: -1.24,
    changePercent: -0.54,
    currency: 'USD',
    marketCap: '3.47T',
    peRatio: 33.8,
    dayHigh: 230.5,
    dayLow: 227.1,
    yearHigh: 237.23,
    yearLow: 164.08,
    volume: '48.1M',
    exchange: 'NASDAQ',
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.',
  },
  MSFT: {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    price: 432.8,
    change: 3.15,
    changePercent: 0.73,
    currency: 'USD',
    marketCap: '3.22T',
    peRatio: 35.2,
    dayHigh: 435.0,
    dayLow: 429.5,
    yearHigh: 468.35,
    yearLow: 309.45,
    volume: '18.9M',
    exchange: 'NASDAQ',
    description: 'Microsoft Corporation develops and supports software, services, devices, and enterprise cloud solutions worldwide.',
  },
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 124.6,
    change: 4.82,
    changePercent: 4.02,
    currency: 'USD',
    marketCap: '3.06T',
    peRatio: 48.6,
    dayHigh: 126.1,
    dayLow: 121.2,
    yearHigh: 140.76,
    yearLow: 40.8,
    volume: '62.4M',
    exchange: 'NASDAQ',
    description: 'NVIDIA Corporation designs graphics processing units (GPUs) for gaming, professional visualization, and artificial intelligence.',
  },
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    price: 245.3,
    change: -3.85,
    changePercent: -1.54,
    currency: 'USD',
    marketCap: '782B',
    peRatio: 64.1,
    dayHigh: 251.0,
    dayLow: 243.2,
    yearHigh: 271.0,
    yearLow: 138.8,
    volume: '54.2M',
    exchange: 'NASDAQ',
    description: 'Tesla, Inc. designs, manufactures, and sells electric vehicles, energy storage systems, and solar panels.',
  },
  BTC: {
    ticker: 'BTC',
    name: 'Bitcoin (USD)',
    price: 64120.0,
    change: 1420.5,
    changePercent: 2.26,
    currency: 'USD',
    marketCap: '1.26T',
    dayHigh: 64800.0,
    dayLow: 62500.0,
    yearHigh: 73750.0,
    yearLow: 25900.0,
    volume: '29.4B',
    exchange: 'Crypto',
    description: 'Bitcoin is the first decentralized cryptocurrency, powered by proof-of-work blockchain ledger technology.',
  },
  SPY: {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    price: 562.4,
    change: 2.9,
    changePercent: 0.52,
    currency: 'USD',
    marketCap: '580B',
    peRatio: 27.1,
    dayHigh: 563.8,
    dayLow: 560.1,
    yearHigh: 565.16,
    yearLow: 410.05,
    volume: '38.6M',
    exchange: 'NYSE Arca',
    description: 'Tracks the benchmark Standard & Poor’s 500 Index, representing 500 leading US public corporations.',
  },
};

export const FinanceView: React.FC<FinanceViewProps> = ({ onBackToOverview }) => {
  const [activeTicker, setActiveTicker] = useState<string>('GOOGL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1M');
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gdeck_finance_watchlist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['GOOGL', 'AAPL', 'NVDA', 'BTC', 'MSFT'];
  });

  const saveWatchlist = (list: string[]) => {
    setWatchlist(list);
    try {
      localStorage.setItem('gdeck_finance_watchlist', JSON.stringify(list));
    } catch {}
  };

  const toggleWatchlist = (ticker: string) => {
    if (watchlist.includes(ticker)) {
      saveWatchlist(watchlist.filter((t) => t !== ticker));
    } else {
      saveWatchlist([...watchlist, ticker]);
    }
  };

  // Resolve current active quote (known or generated organically for any searched ticker)
  const activeQuote: StockQuote = useMemo(() => {
    const symbol = activeTicker.toUpperCase();
    if (KNOWN_ASSETS[symbol]) {
      return KNOWN_ASSETS[symbol];
    }
    // Generate deterministic quote for custom symbols
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = (hash << 5) - hash + symbol.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    const basePrice = 50 + (seed % 350);
    const changePct = ((seed % 100) - 45) / 10;
    const changeAmt = (basePrice * changePct) / 100;
    return {
      ticker: symbol,
      name: `${symbol} Equity Asset`,
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(changeAmt.toFixed(2)),
      changePercent: parseFloat(changePct.toFixed(2)),
      currency: 'USD',
      marketCap: `${(10 + (seed % 900)).toFixed(1)}B`,
      peRatio: parseFloat((15 + (seed % 40)).toFixed(1)),
      dayHigh: parseFloat((basePrice * 1.02).toFixed(2)),
      dayLow: parseFloat((basePrice * 0.98).toFixed(2)),
      yearHigh: parseFloat((basePrice * 1.25).toFixed(2)),
      yearLow: parseFloat((basePrice * 0.75).toFixed(2)),
      volume: `${(5 + (seed % 45)).toFixed(1)}M`,
      exchange: 'Global Market',
      description: `Market quote and fundamental metrics for ${symbol}, integrated inside G-Deck Google Finance.`,
    };
  }, [activeTicker]);

  // Generate chart data points for the selected timeframe
  const chartPoints = useMemo(() => {
    const count = selectedTimeframe === '1D' ? 24 : selectedTimeframe === '5D' ? 30 : 40;
    const base = activeQuote.price;
    const points: number[] = [];
    let current = base * (activeQuote.change >= 0 ? 0.94 : 1.06);

    for (let i = 0; i < count - 1; i++) {
      const step = ((Math.sin(i * 0.4) + Math.cos(i * 0.7)) * base * 0.012) + (Math.random() * base * 0.005);
      current += step;
      points.push(Math.max(base * 0.7, current));
    }
    points.push(base); // Last point is exact current price
    return points;
  }, [activeQuote, selectedTimeframe]);

  const minPrice = Math.min(...chartPoints);
  const maxPrice = Math.max(...chartPoints);
  const isPositive = activeQuote.change >= 0;

  // Generate SVG path coordinates
  const svgWidth = 700;
  const svgHeight = 220;
  const pointsString = useMemo(() => {
    const range = maxPrice - minPrice || 1;
    return chartPoints
      .map((p, idx) => {
        const x = (idx / (chartPoints.length - 1)) * svgWidth;
        const y = svgHeight - ((p - minPrice) / range) * (svgHeight - 40) - 20;
        return `${x},${y}`;
      })
      .join(' ');
  }, [chartPoints, minPrice, maxPrice]);

  const areaPointsString = `0,${svgHeight} ${pointsString} ${svgWidth},${svgHeight}`;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const symbol = searchQuery.trim().toUpperCase();
    setActiveTicker(symbol);
    setSearchQuery('');
  };

  return (
    <div id="finance-view" className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
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
            <p className="text-sm text-slate-500">
              Live market quotes, interactive charts, stock metrics & watchlist inside G-Deck
            </p>
          </div>
        </div>

        {/* Ticker Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol (e.g. GOOGL, NVDA, BTC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 shadow-2xs text-slate-900 font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            Lookup
          </button>
        </form>
      </div>

      {/* Main Finance Workspace: Dual Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Quote & Chart Dashboard */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-6 space-y-6">
            {/* Top Bar: Active Stock Title & Price */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {activeQuote.ticker}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">
                    {activeQuote.exchange}
                  </span>
                  <button
                    onClick={() => toggleWatchlist(activeQuote.ticker)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      watchlist.includes(activeQuote.ticker)
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                    }`}
                    title={watchlist.includes(activeQuote.ticker) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{activeQuote.name}</p>
              </div>

              {/* Price Display */}
              <div className="text-left sm:text-right">
                <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                  ${activeQuote.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div
                  className={`flex items-center sm:justify-end gap-1.5 text-xs font-bold mt-1 ${
                    isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>
                    {isPositive ? '+' : ''}
                    {activeQuote.change.toFixed(2)} ({isPositive ? '+' : ''}
                    {activeQuote.changePercent.toFixed(2)}%)
                  </span>
                  <span className="text-slate-400 text-[11px] font-normal">Today</span>
                </div>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                {['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedTimeframe === tf
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
              </span>
            </div>

            {/* In-App Interactive SVG Price Chart */}
            <div className="w-full h-64 relative bg-slate-50/70 rounded-2xl p-2 border border-slate-100 overflow-hidden">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isPositive ? '#10b981' : '#f43f5e'}
                      stopOpacity="0.28"
                    />
                    <stop
                      offset="100%"
                      stopColor={isPositive ? '#10b981' : '#f43f5e'}
                      stopOpacity="0.0"
                    />
                  </linearGradient>
                </defs>
                {/* Area Fill */}
                <polygon points={areaPointsString} fill="url(#chartGradient)" />
                {/* Stroke Line */}
                <polyline
                  fill="none"
                  stroke={isPositive ? '#059669' : '#e11d48'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsString}
                />
              </svg>
            </div>

            {/* Key Fundamentals Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Market Cap
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block font-mono">
                  ${activeQuote.marketCap}
                </span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  P/E Ratio
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block font-mono">
                  {activeQuote.peRatio ? activeQuote.peRatio.toFixed(1) : 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Day Range
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block font-mono">
                  ${activeQuote.dayLow} - ${activeQuote.dayHigh}
                </span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  52-Wk Range
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block font-mono">
                  ${activeQuote.yearLow} - ${activeQuote.yearHigh}
                </span>
              </div>
            </div>

            {/* Company Bio */}
            <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-1">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-500" /> About {activeQuote.name}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">{activeQuote.description}</p>
            </div>
          </div>
        </div>

        {/* Watchlist & Market Leaders */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-600" /> My Watchlist
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                {watchlist.length} items
              </span>
            </div>

            <div className="space-y-2">
              {watchlist.map((ticker) => {
                const item = KNOWN_ASSETS[ticker] || {
                  ticker,
                  name: `${ticker} Asset`,
                  price: 150.0,
                  changePercent: 1.2,
                };
                const isItemPos = (item.changePercent ?? 0) >= 0;
                const isSelected = activeTicker === ticker;

                return (
                  <div
                    key={ticker}
                    onClick={() => setActiveTicker(ticker)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs'
                        : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{ticker}</h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {item.name}
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          ${item.price.toFixed(2)}
                        </div>
                        <div
                          className={`text-[10px] font-bold ${
                            isItemPos ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isItemPos ? '+' : ''}
                          {item.changePercent.toFixed(2)}%
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(ticker);
                        }}
                        className="p-1 text-slate-300 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add presets */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Popular Quick Add
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['GOOGL', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'BTC', 'SPY'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      if (!watchlist.includes(t)) saveWatchlist([...watchlist, t]);
                      setActiveTicker(t);
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    +{t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
