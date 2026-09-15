import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { SlideItem, SLIDE_THEMES } from './slidesData';

interface SlidesStageProps {
  slide: SlideItem;
  onUpdateSlide: (updated: Partial<SlideItem>) => void;
  showNotes: boolean;
  onToggleNotes: () => void;
  zoom: string;
}

export const SlidesStage: React.FC<SlidesStageProps> = ({
  slide,
  onUpdateSlide,
  showNotes,
  onToggleNotes,
  zoom,
}) => {
  const [activeElement, setActiveElement] = useState<string | null>('title');

  const theme = SLIDE_THEMES.find((t) => t.id === slide.themeId) || SLIDE_THEMES[0];
  const bg = slide.backgroundColor || theme.bgColor;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f9fbfd] overflow-hidden select-none">
      {/* 16:9 Presentation Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-2 xs:p-4 sm:p-8 md:p-10 overflow-auto">
        <div
          className="relative aspect-video w-full max-w-[860px] rounded-xs shadow-[0_2px_8px_rgba(60,64,67,0.15),0_1px_3px_rgba(60,64,67,0.3)] transition-transform flex flex-col overflow-hidden"
          style={{
            backgroundColor: bg,
            fontFamily: theme.fontFamily,
            transform:
              zoom === '50%'
                ? 'scale(0.5)'
                : zoom === '75%'
                ? 'scale(0.75)'
                : zoom === '125%'
                ? 'scale(1.25)'
                : 'none',
          }}
          onClick={() => setActiveElement(null)}
        >
          {/* Slide Body Layouts */}
          <div className="flex-1 p-3 xs:p-6 sm:p-10 md:p-14 flex flex-col justify-center relative">
            {/* Title Slide Layout */}
            {slide.layout === 'title-slide' && (
              <div className="space-y-2 xs:space-y-4 my-auto text-center">
                {/* Title Box with Active Bounding Box Handles */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveElement('title');
                  }}
                  className={`p-1.5 xs:p-3 rounded-xs relative group cursor-text transition-all ${
                    activeElement === 'title'
                      ? 'border border-[#1a73e8] ring-1 ring-[#1a73e8]'
                      : 'border border-transparent hover:border-[#dadce0]'
                  }`}
                >
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => onUpdateSlide({ title: e.target.value })}
                    placeholder="Click to add title"
                    className="w-full text-center text-lg xs:text-2xl sm:text-3xl md:text-4xl font-bold bg-transparent outline-none"
                    style={{ color: theme.titleColor }}
                  />
                  {activeElement === 'title' && (
                    <>
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-[#1a73e8]" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-[#1a73e8]" />
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-[#1a73e8]" />
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-[#1a73e8]" />
                    </>
                  )}
                </div>

                {/* Subtitle Box */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveElement('subtitle');
                  }}
                  className={`p-1.5 xs:p-3 rounded-xs relative group cursor-text transition-all ${
                    activeElement === 'subtitle'
                      ? 'border border-[#1a73e8] ring-1 ring-[#1a73e8]'
                      : 'border border-transparent hover:border-[#dadce0]'
                  }`}
                >
                  <textarea
                    value={slide.subtitle || ''}
                    onChange={(e) => onUpdateSlide({ subtitle: e.target.value })}
                    placeholder="Click to add subtitle"
                    rows={2}
                    className="w-full text-center text-xs xs:text-sm sm:text-base md:text-lg bg-transparent outline-none resize-none"
                    style={{ color: theme.bodyColor }}
                  />
                  {activeElement === 'subtitle' && (
                    <>
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-[#1a73e8]" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-[#1a73e8]" />
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-[#1a73e8]" />
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-[#1a73e8]" />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Title and Body Layout */}
            {slide.layout === 'title-body' && (
              <div className="space-y-2 xs:space-y-4 h-full flex flex-col">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveElement('title');
                  }}
                  className={`p-1 xs:p-2 rounded-xs relative ${
                    activeElement === 'title' ? 'border border-[#1a73e8]' : 'border border-transparent'
                  }`}
                >
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => onUpdateSlide({ title: e.target.value })}
                    placeholder="Click to add title"
                    className="w-full text-base xs:text-xl sm:text-2xl md:text-3xl font-bold bg-transparent outline-none"
                    style={{ color: theme.titleColor }}
                  />
                </div>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveElement('body');
                  }}
                  className={`flex-1 p-1.5 xs:p-3 rounded-xs relative ${
                    activeElement === 'body' ? 'border border-[#1a73e8]' : 'border border-transparent'
                  }`}
                >
                  <textarea
                    value={slide.bodyText || ''}
                    onChange={(e) => onUpdateSlide({ bodyText: e.target.value })}
                    placeholder="Click to add text (use • for bullets)"
                    className="w-full h-full text-xs xs:text-sm sm:text-base leading-relaxed bg-transparent outline-none resize-none font-normal"
                    style={{ color: theme.bodyColor }}
                  />
                </div>
              </div>
            )}

            {/* Two Columns Layout */}
            {slide.layout === 'two-columns' && (
              <div className="space-y-2 xs:space-y-4 h-full flex flex-col">
                <div className="p-1 xs:p-2">
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => onUpdateSlide({ title: e.target.value })}
                    placeholder="Click to add title"
                    className="w-full text-base xs:text-xl sm:text-2xl md:text-3xl font-bold bg-transparent outline-none"
                    style={{ color: theme.titleColor }}
                  />
                </div>

                <div className="flex-1 grid grid-cols-2 gap-2 xs:gap-4 sm:gap-6">
                  <div className="p-1.5 xs:p-3 border border-transparent hover:border-[#dadce0] rounded">
                    <textarea
                      value={slide.bodyText || ''}
                      onChange={(e) => onUpdateSlide({ bodyText: e.target.value })}
                      placeholder="Column 1 content..."
                      className="w-full h-full text-[10px] xs:text-xs sm:text-sm leading-relaxed bg-transparent outline-none resize-none"
                      style={{ color: theme.bodyColor }}
                    />
                  </div>
                  <div className="p-1.5 xs:p-3 border border-transparent hover:border-[#dadce0] rounded">
                    <textarea
                      value={slide.col2Text || ''}
                      onChange={(e) => onUpdateSlide({ col2Text: e.target.value })}
                      placeholder="Column 2 content..."
                      className="w-full h-full text-[10px] xs:text-xs sm:text-sm leading-relaxed bg-transparent outline-none resize-none"
                      style={{ color: theme.bodyColor }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Big Number Layout */}
            {slide.layout === 'big-number' && (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-1 xs:space-y-3">
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => onUpdateSlide({ title: e.target.value })}
                  placeholder="Section / Metric Title"
                  className="w-full text-center text-xs xs:text-base sm:text-xl font-bold bg-transparent outline-none"
                  style={{ color: theme.titleColor }}
                />
                <input
                  type="text"
                  value={slide.bigNumber || '100%'}
                  onChange={(e) => onUpdateSlide({ bigNumber: e.target.value })}
                  className="w-full text-center text-3xl xs:text-5xl sm:text-6xl md:text-7xl font-extrabold bg-transparent outline-none tracking-tight"
                  style={{ color: theme.accentColor }}
                />
                <textarea
                  value={slide.bigNumberLabel || ''}
                  onChange={(e) => onUpdateSlide({ bigNumberLabel: e.target.value })}
                  placeholder="Metric description..."
                  rows={2}
                  className="w-full max-w-md text-center text-[10px] xs:text-xs sm:text-sm bg-transparent outline-none resize-none"
                  style={{ color: theme.bodyColor }}
                />
              </div>
            )}

            {/* Blank Layout */}
            {slide.layout === 'blank' && (
              <div className="h-full flex items-center justify-center text-[10px] xs:text-xs text-[#80868b] border border-dashed border-[#dadce0] rounded p-2 text-center">
                Click Text box or Image in the toolbar above to add content to this blank slide.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Speaker Notes Drawer */}
      {showNotes && (
        <div className="border-t border-[#dadce0] bg-white h-32 flex flex-col shrink-0">
          <div className="px-4 py-1.5 border-b border-[#f1f3f4] flex items-center justify-between text-xs text-[#5f6368]">
            <span className="font-semibold text-[#444746]">Speaker notes</span>
            <button
              onClick={onToggleNotes}
              className="p-1 hover:bg-[#f0f4f9] rounded-full cursor-pointer"
              title="Hide notes"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            value={slide.speakerNotes || ''}
            onChange={(e) => onUpdateSlide({ speakerNotes: e.target.value })}
            placeholder="Click to add speaker notes"
            className="flex-1 p-3 text-xs text-[#1f1f1f] bg-transparent outline-none resize-none placeholder-[#80868b] leading-relaxed"
          />
        </div>
      )}
    </div>
  );
};
