import React from 'react';
import { Plus, Trash2, Copy, MoreVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { SlideItem, SLIDE_THEMES } from './slidesData';

interface SlidesFilmstripProps {
  slides: SlideItem[];
  activeIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (from: number, to: number) => void;
}

export const SlidesFilmstrip: React.FC<SlidesFilmstripProps> = ({
  slides,
  activeIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
}) => {
  return (
    <div
      aria-label="Slide thumbnails"
      className="w-20 xs:w-28 sm:w-36 md:w-48 bg-[#f9fbfd] border-r border-[#dadce0] flex flex-col h-full select-none shrink-0"
    >
      {/* Filmstrip Slides List */}
      <div className="flex-1 overflow-y-auto p-1.5 sm:p-3 space-y-2 sm:space-y-3 scrollbar-thin">
        {slides.map((slide, idx) => {
          const isActive = idx === activeIndex;
          const theme = SLIDE_THEMES.find((t) => t.id === slide.themeId) || SLIDE_THEMES[0];
          const bg = slide.backgroundColor || theme.bgColor;

          return (
            <div
              key={slide.id}
              onClick={() => onSelectSlide(idx)}
              className="flex items-start gap-1 sm:gap-2 group cursor-pointer"
            >
              {/* Slide Number */}
              <span
                className={`text-[10px] sm:text-xs font-semibold w-3 sm:w-4 text-right mt-0.5 sm:mt-1 shrink-0 ${
                  isActive ? 'text-[#1a73e8]' : 'text-[#5f6368]'
                }`}
              >
                {idx + 1}
              </span>

              {/* Thumbnail Container (16:9) */}
              <div
                className={`flex-1 aspect-video rounded sm:rounded-md overflow-hidden relative transition-all border ${
                  isActive
                    ? 'border-[#1a73e8] border-2 shadow-sm ring-1 ring-[#1a73e8]/20'
                    : 'border-[#dadce0] hover:border-[#bdc1c6] shadow-2xs'
                }`}
                style={{ backgroundColor: bg }}
              >
                {/* Mini Preview Representation */}
                <div className="p-1 sm:p-2 h-full flex flex-col justify-center pointer-events-none text-[5px] sm:text-[6px] overflow-hidden leading-tight">
                  <div
                    className="font-bold truncate"
                    style={{ color: theme.titleColor }}
                  >
                    {slide.title || 'Untitled'}
                  </div>

                  {slide.layout === 'title-slide' && slide.subtitle && (
                    <div
                      className="text-[4px] sm:text-[4.5px] truncate mt-0.5"
                      style={{ color: theme.bodyColor }}
                    >
                      {slide.subtitle}
                    </div>
                  )}

                  {slide.layout === 'title-body' && slide.bodyText && (
                    <div
                      className="text-[4px] sm:text-[4.5px] line-clamp-2 mt-0.5"
                      style={{ color: theme.bodyColor }}
                    >
                      {slide.bodyText}
                    </div>
                  )}

                  {slide.layout === 'big-number' && slide.bigNumber && (
                    <div
                      className="text-[7px] sm:text-[9px] font-extrabold text-[#1a73e8] leading-none"
                    >
                      {slide.bigNumber}
                    </div>
                  )}
                </div>

                {/* Quick actions overlay on hover */}
                <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-black/60 backdrop-blur-xs rounded px-1 py-0.5 text-white">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSlide(idx);
                    }}
                    className="hover:text-[#c2e7ff] p-0.5 cursor-pointer"
                    title="Duplicate slide"
                  >
                    <Copy className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                  </button>
                  {slides.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(idx);
                      }}
                      className="hover:text-[#f28b82] p-0.5 cursor-pointer"
                      title="Delete slide"
                    >
                      <Trash2 className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Filmstrip Actions */}
      <div className="p-1.5 sm:p-2 border-t border-[#dadce0] flex items-center justify-between text-xs text-[#5f6368]">
        <button
          onClick={onAddSlide}
          className="w-full py-1 sm:py-1.5 px-1.5 sm:px-3 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1a73e8] rounded-md sm:rounded-lg font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors text-[11px] sm:text-xs"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xs:inline">New slide</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>
    </div>
  );
};
