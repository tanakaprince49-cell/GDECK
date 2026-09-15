import React, { useState } from 'react';
import {
  Plus,
  Undo,
  Redo,
  Printer,
  Paintbrush,
  ZoomIn,
  MousePointer,
  Type,
  Image as ImageIcon,
  Square,
  Minus,
  MessageSquarePlus,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SlideItem } from './slidesData';

interface SlidesToolbarProps {
  onNewSlide: (layout: SlideItem['layout']) => void;
  onFormatText: (cmd: string, val?: string) => void;
  onOpenThemePanel: () => void;
  onOpenLayoutModal: () => void;
  onOpenBackgroundModal: () => void;
  onInsertImage: () => void;
  onInsertTextBox: () => void;
  onInsertShape: () => void;
  zoom: string;
  onZoomChange: (z: string) => void;
}

export const SlidesToolbar: React.FC<SlidesToolbarProps> = ({
  onNewSlide,
  onFormatText,
  onOpenThemePanel,
  onOpenLayoutModal,
  onOpenBackgroundModal,
  onInsertImage,
  onInsertTextBox,
  onInsertShape,
  zoom,
  onZoomChange,
}) => {
  const [showNewSlideDropdown, setShowNewSlideDropdown] = useState(false);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(18);

  const LAYOUT_OPTIONS: { id: SlideItem['layout']; label: string }[] = [
    { id: 'title-slide', label: 'Title slide' },
    { id: 'section-header', label: 'Section header' },
    { id: 'title-body', label: 'Title and body' },
    { id: 'two-columns', label: 'Title and two columns' },
    { id: 'big-number', label: 'Big number' },
    { id: 'blank', label: 'Blank' },
  ];

  return (
    <div className="h-11 px-3 bg-[#edf2fa] border-b border-[#dadce0] flex items-center gap-0.5 overflow-x-auto scrollbar-none select-none shrink-0 text-[#444746] font-['Google_Sans',Roboto,sans-serif]">
      {/* New Slide Button with dropdown */}
      <div className="relative flex items-center bg-white/70 hover:bg-white rounded-md border border-[#dadce0] mr-1">
        <button
          onClick={() => onNewSlide('title-body')}
          className="p-1 hover:bg-[#e1eaf5] text-[#1f1f1f] rounded-l-md cursor-pointer flex items-center"
          title="New slide (Ctrl+M)"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowNewSlideDropdown(!showNewSlideDropdown)}
          className="p-1 hover:bg-[#e1eaf5] text-[#5f6368] rounded-r-md cursor-pointer border-l border-[#dadce0]"
          title="New slide with layout"
        >
          <ChevronDown className="w-3 h-3" />
        </button>

        {showNewSlideDropdown && (
          <div className="absolute top-9 left-0 z-50 w-56 bg-white rounded-xl shadow-xl border border-[#dadce0] py-1 text-xs text-[#1f1f1f] animate-in fade-in">
            {LAYOUT_OPTIONS.map((lo) => (
              <button
                key={lo.id}
                onClick={() => {
                  onNewSlide(lo.id);
                  setShowNewSlideDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#f0f4f9] flex items-center justify-between text-xs"
              >
                <span>{lo.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Undo */}
      <button
        onClick={() => onFormatText('undo')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>

      {/* Redo */}
      <button
        onClick={() => onFormatText('redo')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Redo (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </button>

      {/* Print */}
      <button
        onClick={() => window.print()}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Print (Ctrl+P)"
      >
        <Printer className="w-4 h-4" />
      </button>

      {/* Paint format */}
      <button
        onClick={() => alert('Paint format active')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Paint format"
      >
        <Paintbrush className="w-4 h-4" />
      </button>

      {/* Zoom dropdown */}
      <div className="relative">
        <select
          value={zoom}
          onChange={(e) => onZoomChange(e.target.value)}
          className="bg-transparent hover:bg-[#e1eaf5] px-2 py-1 rounded text-xs text-[#1f1f1f] cursor-pointer outline-none font-medium appearance-none pr-5"
          title="Zoom"
        >
          <option value="50%">50%</option>
          <option value="75%">75%</option>
          <option value="90%">90%</option>
          <option value="100%">100%</option>
          <option value="125%">125%</option>
          <option value="fit">Fit</option>
        </select>
        <ChevronDown className="w-3 h-3 text-[#5f6368] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      <div className="h-5 w-px bg-[#dadce0] mx-1" />

      {/* Select Tool */}
      <button
        className="p-1.5 bg-[#d3e3fd] text-[#0b57d0] rounded cursor-pointer"
        title="Select (Escape)"
      >
        <MousePointer className="w-4 h-4" />
      </button>

      {/* Text box */}
      <button
        onClick={onInsertTextBox}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Text box"
      >
        <Type className="w-4 h-4" />
      </button>

      {/* Insert Image */}
      <button
        onClick={onInsertImage}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Insert image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      {/* Shape */}
      <button
        onClick={onInsertShape}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Shape"
      >
        <Square className="w-4 h-4" />
      </button>

      {/* Line */}
      <button
        onClick={() => alert('Line drawing tool active')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Line"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Add comment */}
      <button
        onClick={() => alert('Comment thread added on slide')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Add comment"
      >
        <MessageSquarePlus className="w-4 h-4" />
      </button>

      <div className="h-5 w-px bg-[#dadce0] mx-1" />

      {/* Signature Google Slides Buttons: Background, Layout, Theme, Transition */}
      <button
        onClick={onOpenBackgroundModal}
        className="px-2.5 py-1 hover:bg-[#e1eaf5] text-xs font-medium text-[#1f1f1f] rounded cursor-pointer transition-colors"
        title="Change slide background"
      >
        Background
      </button>

      <button
        onClick={onOpenLayoutModal}
        className="px-2.5 py-1 hover:bg-[#e1eaf5] text-xs font-medium text-[#1f1f1f] rounded cursor-pointer transition-colors"
        title="Apply layout"
      >
        Layout
      </button>

      <button
        onClick={onOpenThemePanel}
        className="px-2.5 py-1 hover:bg-[#e1eaf5] text-xs font-medium text-[#1f1f1f] rounded cursor-pointer transition-colors"
        title="Open theme panel"
      >
        Theme
      </button>

      <button
        onClick={() => alert('Slide Transition: Fade (0.5s)')}
        className="px-2.5 py-1 hover:bg-[#e1eaf5] text-xs font-medium text-[#1f1f1f] rounded cursor-pointer transition-colors"
        title="Slide transition"
      >
        Transition
      </button>

      <div className="h-5 w-px bg-[#dadce0] mx-1" />

      {/* Text Formatting Controls */}
      <button
        onClick={() => onFormatText('bold')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer font-bold"
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormatText('italic')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer italic"
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormatText('underline')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormatText('justifyLeft')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Align left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormatText('justifyCenter')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Align center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormatText('insertUnorderedList')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Bulleted list"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
};
