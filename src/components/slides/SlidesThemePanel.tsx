import React from 'react';
import { X, Check } from 'lucide-react';
import { SLIDE_THEMES, SlideTheme } from './slidesData';

interface SlidesThemePanelProps {
  currentThemeId: string;
  onSelectTheme: (theme: SlideTheme) => void;
  onClose: () => void;
}

export const SlidesThemePanel: React.FC<SlidesThemePanelProps> = ({
  currentThemeId,
  onSelectTheme,
  onClose,
}) => {
  return (
    <aside
      aria-label="Themes panel"
      className="w-72 bg-white border-l border-[#dadce0] flex flex-col h-full select-none shadow-lg z-20 shrink-0 animate-in slide-in-from-right-4 duration-200"
    >
      <div className="h-12 px-4 border-b border-[#dadce0] flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1f1f1f]">Themes</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#f0f4f9] rounded-full text-[#5f6368] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {SLIDE_THEMES.map((theme) => {
          const isSelected = theme.id === currentThemeId;

          return (
            <div
              key={theme.id}
              onClick={() => onSelectTheme(theme)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/30 shadow-sm'
                  : 'border-[#dadce0] hover:border-[#bdc1c6] hover:shadow-xs'
              }`}
            >
              {/* Theme Preview Card */}
              <div
                className="aspect-video w-full rounded-lg p-3 flex flex-col justify-center text-center shadow-2xs border border-black/5"
                style={{ backgroundColor: theme.bgColor }}
              >
                <span
                  className="font-bold text-xs truncate"
                  style={{ color: theme.titleColor }}
                >
                  {theme.name}
                </span>
                <span
                  className="text-[9px] mt-0.5"
                  style={{ color: theme.bodyColor }}
                >
                  Click to add subtitle
                </span>
                <div
                  className="w-8 h-1 mx-auto mt-2 rounded-full"
                  style={{ backgroundColor: theme.accentColor }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-xs font-semibold text-[#1f1f1f]">{theme.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#1a73e8]" />}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
