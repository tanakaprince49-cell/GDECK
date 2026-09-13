import React, { useState, useEffect } from 'react';
import {
  Presentation,
  Plus,
  Search,
  ExternalLink,
  Play,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Sparkles,
  Layout,
  Trash2,
} from 'lucide-react';
import { DriveFile } from '../types/workspace';
import { searchSlides, createDriveFile } from '../services/workspace';
import { GoogleSlidesIcon } from './GoogleIcons';

interface SlidesViewProps {
  token: string;
  onBackToOverview?: () => void;
}

interface SlideItem {
  id: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  layout: 'title' | 'bullet' | 'quote' | 'two-column';
  bgColor: string;
}

const DEFAULT_DECK: SlideItem[] = [
  {
    id: 's1',
    title: 'GDECK Workspace Hub',
    subtitle: 'Unified Command Center for Google Workspace',
    bullets: [],
    layout: 'title',
    bgColor: 'from-amber-500 to-yellow-600',
  },
  {
    id: 's2',
    title: 'Executive Overview',
    subtitle: 'Key Metrics & Product Roadmap',
    bullets: [
      'Centralized 15+ Google services into a single glass dashboard',
      'Real-time bi-directional sync across Sheets, Drive & Gmail',
      'Autonomous AI Assistant (G-Pilot) for hands-free productivity',
      'End-to-end encrypted messaging and collaborative editing',
    ],
    layout: 'bullet',
    bgColor: 'from-blue-600 to-indigo-700',
  },
  {
    id: 's3',
    title: 'Collaborative Impact',
    subtitle: 'Performance Indicators',
    bullets: [
      '40% reduction in cross-application tab switching',
      '99.9% uptime with direct Google Cloud APIs',
      'Zero unauthorized tracking — client-side OAuth security',
    ],
    layout: 'two-column',
    bgColor: 'from-emerald-600 to-teal-700',
  },
];

export const SlidesView: React.FC<SlidesViewProps> = ({ token, onBackToOverview }) => {
  const [slides, setSlides] = useState<SlideItem[]>(() => {
    try {
      const saved = localStorage.getItem('gdeck_slides_deck');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_DECK;
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [driveSlides, setDriveSlides] = useState<DriveFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('gdeck_slides_deck', JSON.stringify(slides));
    } catch {
      // ignore
    }
  }, [slides]);

  useEffect(() => {
    const fetchDriveSlides = async () => {
      setLoadingDrive(true);
      try {
        const files = await searchSlides(token);
        setDriveSlides(files);
      } catch (err) {
        console.error('Failed to list Google Slides:', err);
      } finally {
        setLoadingDrive(false);
      }
    };
    if (token) {
      fetchDriveSlides();
    }
  }, [token]);

  const currentSlide = slides[activeSlideIndex] || slides[0];

  const handleAddSlide = () => {
    const newSlide: SlideItem = {
      id: `s-${Date.now()}`,
      title: 'New Slide Title',
      subtitle: 'Slide Subtitle or Caption',
      bullets: ['Key point 1', 'Key point 2', 'Key point 3'],
      layout: 'bullet',
      bgColor: 'from-purple-600 to-pink-600',
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const next = slides.filter((_, i) => i !== index);
    setSlides(next);
    setActiveSlideIndex(Math.max(0, index - 1));
  };

  const handleUpdateCurrentSlide = (patch: Partial<SlideItem>) => {
    setSlides((prev) =>
      prev.map((s, idx) => (idx === activeSlideIndex ? { ...s, ...patch } : s))
    );
  };

  return (
    <div id="slides-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="slides-back-to-overview-btn"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-amber-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-amber-500/10 border border-amber-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleSlidesIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Slides</h2>
            <p className="text-sm text-slate-500">Presentation slide builder, speaker decks & Drive slides</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="add-slide-btn"
            onClick={handleAddSlide}
            className="px-4 py-2.5 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-[0_4px_14px_rgba(245,158,11,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-amber-400/40 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Add Slide
          </button>
          <button
            onClick={() => setIsFullscreen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Present
          </button>
          <a
            href="https://slides.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-slate-600 hover:text-amber-600 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Open Google Slides Web"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Slide Deck Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[540px]">
        {/* Left: Slide Thumbnails Strip */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Slides ({slides.length})</span>
            <button
              onClick={handleAddSlide}
              className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-0.5 text-[11px] cursor-pointer"
            >
              <Plus className="w-3 h-3" /> New
            </button>
          </div>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {slides.map((s, idx) => {
              const isSelected = idx === activeSlideIndex;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                      : 'border-slate-200/80 bg-white/75 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400">Slide {idx + 1}</span>
                    {slides.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlide(idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 transition-opacity"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className={`h-16 rounded-xl bg-gradient-to-r ${s.bgColor} p-2 text-white flex flex-col justify-center`}>
                    <p className="text-[11px] font-bold truncate">{s.title || 'Untitled'}</p>
                    <p className="text-[9px] opacity-80 truncate">{s.subtitle || 'No subtitle'}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Synced Drive Slides */}
          {driveSlides.length > 0 && (
            <div className="bg-white/75 backdrop-blur-2xl rounded-2xl border border-white/90 p-3 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Google Drive Presentations
              </span>
              <div className="space-y-1 max-h-[140px] overflow-y-auto">
                {driveSlides.map((df) => (
                  <a
                    key={df.id}
                    href={df.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-xs text-slate-700 hover:text-amber-600 rounded-lg hover:bg-amber-50 flex items-center gap-2 truncate"
                  >
                    <GoogleSlidesIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{df.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Slide Editor Stage */}
        <div className="lg:col-span-9 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-6 flex flex-col justify-between">
          {/* Active Slide Stage */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                Editing Slide {activeSlideIndex + 1} of {slides.length}
              </span>

              {/* Slide Controls */}
              <div className="flex items-center gap-2">
                <button
                  disabled={activeSlideIndex === 0}
                  onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-700" />
                </button>
                <button
                  disabled={activeSlideIndex === slides.length - 1}
                  onClick={() => setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-slate-700" />
                </button>
              </div>
            </div>

            {/* Slide Canvas */}
            <div
              className={`w-full aspect-16/9 rounded-2xl bg-gradient-to-tr ${currentSlide.bgColor} p-8 sm:p-12 text-white shadow-xl flex flex-col justify-center transition-all`}
            >
              {currentSlide.layout === 'title' ? (
                <div className="text-center space-y-4">
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => handleUpdateCurrentSlide({ title: e.target.value })}
                    placeholder="Slide Title"
                    className="w-full text-2xl sm:text-4xl font-extrabold text-center bg-transparent focus:outline-hidden border-b border-white/20 focus:border-white text-white placeholder-white/60"
                  />
                  <input
                    type="text"
                    value={currentSlide.subtitle || ''}
                    onChange={(e) => handleUpdateCurrentSlide({ subtitle: e.target.value })}
                    placeholder="Slide Subtitle / Author"
                    className="w-full text-sm sm:text-lg text-center bg-transparent focus:outline-hidden border-b border-white/20 focus:border-white text-white/90 placeholder-white/50"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => handleUpdateCurrentSlide({ title: e.target.value })}
                    placeholder="Slide Title"
                    className="w-full text-xl sm:text-3xl font-bold bg-transparent focus:outline-hidden border-b border-white/20 focus:border-white text-white placeholder-white/60"
                  />
                  <div className="space-y-2 pt-2">
                    {currentSlide.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => {
                            const next = [...currentSlide.bullets];
                            next[bIdx] = e.target.value;
                            handleUpdateCurrentSlide({ bullets: next });
                          }}
                          className="w-full text-xs sm:text-sm bg-transparent focus:outline-hidden border-b border-white/10 focus:border-white text-white"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        handleUpdateCurrentSlide({
                          bullets: [...currentSlide.bullets, 'New bullet point'],
                        });
                      }}
                      className="text-xs text-white/80 hover:text-white underline font-semibold cursor-pointer"
                    >
                      + Add bullet point
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Color Palette Switcher */}
          <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Theme Color:</span>
              {[
                { name: 'Amber', val: 'from-amber-500 to-yellow-600', dot: 'bg-amber-500' },
                { name: 'Blue', val: 'from-blue-600 to-indigo-700', dot: 'bg-blue-600' },
                { name: 'Emerald', val: 'from-emerald-600 to-teal-700', dot: 'bg-emerald-600' },
                { name: 'Purple', val: 'from-purple-600 to-pink-600', dot: 'bg-purple-600' },
                { name: 'Slate', val: 'from-slate-800 to-slate-950', dot: 'bg-slate-800' },
              ].map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleUpdateCurrentSlide({ bgColor: c.val })}
                  className={`w-6 h-6 rounded-full ${c.dot} border-2 ${
                    currentSlide.bgColor === c.val ? 'border-amber-400 scale-110' : 'border-transparent'
                  } transition-all cursor-pointer`}
                  title={c.name}
                />
              ))}
            </div>

            <button
              onClick={() => setIsFullscreen(true)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-amber-600 flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Fullscreen Present
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Presenter Mode */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-8 text-white animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold opacity-75">
              Slide {activeSlideIndex + 1} / {slides.length}
            </span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" /> Exit Fullscreen (Esc)
            </button>
          </div>

          {/* Main Slide Display */}
          <div
            className={`max-w-5xl mx-auto w-full aspect-16/9 rounded-3xl bg-gradient-to-tr ${currentSlide.bgColor} p-12 sm:p-20 flex flex-col justify-center shadow-2xl`}
          >
            {currentSlide.layout === 'title' ? (
              <div className="text-center space-y-6">
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight">{currentSlide.title}</h1>
                <p className="text-xl sm:text-2xl opacity-90">{currentSlide.subtitle}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-5xl font-extrabold">{currentSlide.title}</h2>
                <ul className="space-y-4 pt-4 text-base sm:text-2xl">
                  {currentSlide.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-white shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Bottom navigation controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              disabled={activeSlideIndex === 0}
              onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
              className="px-6 py-2.5 bg-white/20 hover:bg-white/30 disabled:opacity-30 rounded-2xl font-bold cursor-pointer flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" /> Previous
            </button>
            <button
              disabled={activeSlideIndex === slides.length - 1}
              onClick={() => setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-30 rounded-2xl cursor-pointer flex items-center gap-2"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
