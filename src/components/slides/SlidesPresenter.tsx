import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  X,
  Maximize2,
  FileText,
  Radio,
} from 'lucide-react';
import { SlideItem, SLIDE_THEMES } from './slidesData';

interface SlidesPresenterProps {
  slides: SlideItem[];
  initialIndex?: number;
  onExit: () => void;
}

export const SlidesPresenter: React.FC<SlidesPresenterProps> = ({
  slides,
  initialIndex = 0,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [laserActive, setLaserActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const currentSlide = slides[currentIndex] || slides[0];
  const theme = SLIDE_THEMES.find((t) => t.id === currentSlide.themeId) || SLIDE_THEMES[0];
  const bg = currentSlide.backgroundColor || theme.bgColor;

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev < slides.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#121212] flex flex-col items-center justify-center select-none overflow-hidden"
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* 16:9 Screen */}
      <div
        className="w-full max-w-5xl aspect-video rounded-xs shadow-2xl p-16 flex flex-col justify-center relative overflow-hidden transition-all duration-300"
        style={{
          backgroundColor: bg,
          fontFamily: theme.fontFamily,
        }}
      >
        {currentSlide.layout === 'title-slide' && (
          <div className="space-y-6 text-center my-auto">
            <h1
              className="text-5xl sm:text-6xl font-extrabold tracking-tight"
              style={{ color: theme.titleColor }}
            >
              {currentSlide.title}
            </h1>
            {currentSlide.subtitle && (
              <p
                className="text-xl sm:text-2xl whitespace-pre-line"
                style={{ color: theme.bodyColor }}
              >
                {currentSlide.subtitle}
              </p>
            )}
          </div>
        )}

        {currentSlide.layout === 'title-body' && (
          <div className="space-y-6 h-full flex flex-col justify-center">
            <h2
              className="text-4xl sm:text-5xl font-bold"
              style={{ color: theme.titleColor }}
            >
              {currentSlide.title}
            </h2>
            <div
              className="text-xl sm:text-2xl leading-relaxed whitespace-pre-line"
              style={{ color: theme.bodyColor }}
            >
              {currentSlide.bodyText}
            </div>
          </div>
        )}

        {currentSlide.layout === 'two-columns' && (
          <div className="space-y-6 h-full flex flex-col justify-center">
            <h2
              className="text-4xl sm:text-5xl font-bold"
              style={{ color: theme.titleColor }}
            >
              {currentSlide.title}
            </h2>
            <div className="grid grid-cols-2 gap-10">
              <div
                className="text-lg sm:text-xl leading-relaxed whitespace-pre-line"
                style={{ color: theme.bodyColor }}
              >
                {currentSlide.bodyText}
              </div>
              <div
                className="text-lg sm:text-xl leading-relaxed whitespace-pre-line"
                style={{ color: theme.bodyColor }}
              >
                {currentSlide.col2Text}
              </div>
            </div>
          </div>
        )}

        {currentSlide.layout === 'big-number' && (
          <div className="text-center space-y-4 my-auto">
            <h3
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: theme.titleColor }}
            >
              {currentSlide.title}
            </h3>
            <div
              className="text-8xl sm:text-9xl font-black tracking-tight"
              style={{ color: theme.accentColor }}
            >
              {currentSlide.bigNumber}
            </div>
            <p
              className="text-lg sm:text-xl max-w-xl mx-auto"
              style={{ color: theme.bodyColor }}
            >
              {currentSlide.bigNumberLabel}
            </p>
          </div>
        )}

        {/* Laser pointer circle */}
        {laserActive && (
          <div
            className="fixed w-4 h-4 rounded-full bg-red-500 shadow-[0_0_12px_#ff0000] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
            style={{ left: mousePos.x, top: mousePos.y }}
          />
        )}
      </div>

      {/* Floating Presenter Controls Bar */}
      <div className="fixed bottom-6 bg-black/80 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white flex items-center gap-3 shadow-2xl z-50">
        <button
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="p-1.5 hover:bg-white/20 rounded-full disabled:opacity-30 cursor-pointer"
          title="Previous slide (Left arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-mono px-2">
          {currentIndex + 1} / {slides.length}
        </span>

        <button
          onClick={nextSlide}
          disabled={currentIndex === slides.length - 1}
          className="p-1.5 hover:bg-white/20 rounded-full disabled:opacity-30 cursor-pointer"
          title="Next slide (Right arrow / Space)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="w-px h-4 bg-white/20 mx-1" />

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 hover:bg-white/20 rounded-full cursor-pointer"
          title={isPlaying ? 'Pause slideshow' : 'Auto-play slideshow'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setLaserActive(!laserActive)}
          className={`p-1.5 rounded-full cursor-pointer ${
            laserActive ? 'bg-red-600 text-white' : 'hover:bg-white/20'
          }`}
          title="Toggle laser pointer"
        >
          <Radio className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`p-1.5 rounded-full cursor-pointer ${
            showNotes ? 'bg-blue-600 text-white' : 'hover:bg-white/20'
          }`}
          title="Toggle speaker notes"
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          onClick={onExit}
          className="p-1.5 hover:bg-white/20 rounded-full cursor-pointer"
          title="Exit slideshow (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Speaker Notes Overlay */}
      {showNotes && currentSlide.speakerNotes && (
        <div className="fixed top-6 right-6 w-80 bg-black/85 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white text-xs space-y-1 shadow-2xl">
          <p className="font-bold text-gray-300">Speaker Notes (Slide {currentIndex + 1})</p>
          <p className="text-gray-100 whitespace-pre-wrap leading-relaxed">{currentSlide.speakerNotes}</p>
        </div>
      )}
    </div>
  );
};
