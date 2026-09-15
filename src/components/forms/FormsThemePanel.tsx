import React from 'react';
import { X, Check } from 'lucide-react';
import { FORM_COLOR_PALETTES } from './formsData';

interface FormsThemePanelProps {
  currentColor: string;
  onColorChange: (primary: string, bg: string) => void;
  fontFamily: string;
  onFontChange: (font: string) => void;
  onClose: () => void;
}

export const FormsThemePanel: React.FC<FormsThemePanelProps> = ({
  currentColor,
  onColorChange,
  fontFamily,
  onFontChange,
  onClose,
}) => {
  return (
    <aside
      aria-label="Theme options"
      className="w-72 bg-white border-l border-[#dadce0] flex flex-col h-full select-none shadow-xl z-30 shrink-0 animate-in slide-in-from-right-4 duration-200"
    >
      <div className="h-14 px-4 border-b border-[#dadce0] flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1f1f1f]">Theme options</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#f0f4f9] rounded-full text-[#5f6368] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs text-[#1f1f1f]">
        {/* Text Style Fonts */}
        <div className="space-y-3">
          <span className="text-[11px] font-bold text-[#5f6368] uppercase tracking-wider">
            Text style
          </span>

          <div className="space-y-2">
            <label className="text-[#5f6368] block">Font family</label>
            <select
              value={fontFamily}
              onChange={(e) => onFontChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8fafd] border border-[#dadce0] rounded-xl outline-none font-medium cursor-pointer"
            >
              <option value="'Google Sans', Roboto, sans-serif">Google Sans (Default)</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Roboto Mono', monospace">Roboto Mono</option>
              <option value="'Comic Sans MS', cursive">Playful</option>
            </select>
          </div>
        </div>

        <div className="h-px bg-[#dadce0]" />

        {/* Color Palette */}
        <div className="space-y-3">
          <span className="text-[11px] font-bold text-[#5f6368] uppercase tracking-wider">
            Color
          </span>

          <div className="grid grid-cols-4 gap-3">
            {FORM_COLOR_PALETTES.map((pal) => {
              const isSelected = currentColor.toLowerCase() === pal.primary.toLowerCase();
              return (
                <button
                  key={pal.name}
                  onClick={() => onColorChange(pal.primary, pal.bg)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                  title={pal.name}
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs"
                    style={{
                      backgroundColor: pal.primary,
                      borderColor: isSelected ? '#1f1f1f' : 'transparent',
                    }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-[10px] text-[#5f6368] truncate max-w-[56px] text-center">
                    {pal.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-[#dadce0]" />

        {/* Header decoration image info */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#5f6368] uppercase tracking-wider">
            Header
          </span>
          <button
            onClick={() => alert('Choose header banner image from Google Drive')}
            className="w-full py-2 px-3 border border-[#dadce0] rounded-xl text-center font-semibold hover:bg-[#f8fafd] text-[#1a73e8] cursor-pointer"
          >
            Choose image
          </button>
        </div>
      </div>
    </aside>
  );
};
