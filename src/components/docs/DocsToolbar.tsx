import React, { useState } from 'react';
import {
  Undo,
  Redo,
  Printer,
  SpellCheck,
  Paintbrush,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  MessageSquarePlus,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  Indent,
  Outdent,
  RemoveFormatting,
  ChevronDown,
  ChevronUp,
  Highlighter,
  Pencil,
  Eye,
  Check,
} from 'lucide-react';
import { GOOGLE_DOCS_FONTS, GOOGLE_COLOR_PALETTE, GOOGLE_HIGHLIGHT_PALETTE } from './docsData';

interface DocsToolbarProps {
  zoom: string;
  onZoomChange: (z: string) => void;
  fontFamily: string;
  onFontFamilyChange: (f: string) => void;
  fontSize: number;
  onFontSizeChange: (s: number) => void;
  textColor: string;
  onTextColorChange: (c: string) => void;
  highlightColor: string;
  onHighlightColorChange: (c: string) => void;
  onFormatCommand: (cmd: string, val?: string) => void;
  isBoldActive: boolean;
  isItalicActive: boolean;
  isUnderlineActive: boolean;
  activeAlign: string;
  mode: 'editing' | 'suggesting' | 'viewing';
  onModeChange: (m: 'editing' | 'suggesting' | 'viewing') => void;
  onOpenLinkModal: () => void;
  onInsertImage: () => void;
  onInsertTable: () => void;
}

export const DocsToolbar: React.FC<DocsToolbarProps> = ({
  zoom,
  onZoomChange,
  fontFamily,
  onFontFamilyChange,
  fontSize,
  onFontSizeChange,
  textColor,
  onTextColorChange,
  highlightColor,
  onHighlightColorChange,
  onFormatCommand,
  isBoldActive,
  isItalicActive,
  isUnderlineActive,
  activeAlign,
  mode,
  onModeChange,
  onOpenLinkModal,
  onInsertImage,
  onInsertTable,
}) => {
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState<boolean>(false);
  const [showStylesMenu, setShowStylesMenu] = useState<boolean>(false);
  const [showLineSpacingMenu, setShowLineSpacingMenu] = useState<boolean>(false);
  const [showModeMenu, setShowModeMenu] = useState<boolean>(false);

  return (
    <div
      className="h-11 px-3 bg-[#edf2fa] border-b border-[#dadce0] flex items-center gap-0.5 overflow-x-auto scrollbar-none select-none shrink-0 text-[#444746]"
      onClick={() => {}}
    >
      {/* Undo */}
      <button
        onClick={() => onFormatCommand('undo')}
        className="p-1.5 hover:bg-[#e1eaf5] active:bg-[#d3e3fd] rounded-sm cursor-pointer transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>

      {/* Redo */}
      <button
        onClick={() => onFormatCommand('redo')}
        className="p-1.5 hover:bg-[#e1eaf5] active:bg-[#d3e3fd] rounded-sm cursor-pointer transition-colors"
        title="Redo (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </button>

      {/* Print */}
      <button
        onClick={() => window.print()}
        className="p-1.5 hover:bg-[#e1eaf5] active:bg-[#d3e3fd] rounded-sm cursor-pointer transition-colors"
        title="Print (Ctrl+P)"
      >
        <Printer className="w-4 h-4" />
      </button>

      {/* Spell Check */}
      <button
        onClick={() => onFormatCommand('spellcheck')}
        className="p-1.5 hover:bg-[#e1eaf5] active:bg-[#d3e3fd] rounded-sm cursor-pointer transition-colors"
        title="Spelling and grammar check (Ctrl+Alt+X)"
      >
        <SpellCheck className="w-4 h-4 text-[#1a73e8]" />
      </button>

      {/* Paint format */}
      <button
        onClick={() => alert('Paint format active: select text to apply style')}
        className="p-1.5 hover:bg-[#e1eaf5] active:bg-[#d3e3fd] rounded-sm cursor-pointer transition-colors"
        title="Paint format"
      >
        <Paintbrush className="w-4 h-4" />
      </button>

      {/* Zoom Dropdown */}
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
          <option value="150%">150%</option>
          <option value="200%">200%</option>
        </select>
        <ChevronDown className="w-3 h-3 text-[#5f6368] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      <div className="h-5 w-px bg-[#dadce0] mx-1" />

      {/* Styles Dropdown (Normal text, Title, Subtitle, Headings) */}
      <div className="relative">
        <button
          onClick={() => setShowStylesMenu(!showStylesMenu)}
          className="hover:bg-[#e1eaf5] px-2 py-1 rounded text-xs text-[#1f1f1f] cursor-pointer flex items-center gap-1 font-medium min-w-[96px] justify-between"
          title="Styles"
        >
          <span>Normal text</span>
          <ChevronDown className="w-3 h-3 text-[#5f6368]" />
        </button>

        {showStylesMenu && (
          <div className="absolute top-8 left-0 z-50 w-56 bg-white rounded-xl shadow-xl border border-[#dadce0] py-1 text-xs text-[#1f1f1f] animate-in fade-in">
            <button
              onClick={() => {
                onFormatCommand('formatBlock', '<p>');
                setShowStylesMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-[#f0f4f9] text-xs font-normal"
            >
              Normal text
            </button>
            <button
              onClick={() => {
                onFormatCommand('formatBlock', '<h1>');
                setShowStylesMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-[#f0f4f9] text-xl font-bold"
            >
              Title
            </button>
            <button
              onClick={() => {
                onFormatCommand('formatBlock', '<h2>');
                setShowStylesMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-[#f0f4f9] text-base font-semibold text-[#5f6368]"
            >
              Subtitle
            </button>
            <div className="h-px bg-[#dadce0] my-1" />
            <button
              onClick={() => {
                onFormatCommand('formatBlock', '<h1>');
                setShowStylesMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-[#f0f4f9] text-lg font-bold"
            >
              Heading 1
            </button>
            <button
              onClick={() => {
                onFormatCommand('formatBlock', '<h2>');
                setShowStylesMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-[#f0f4f9] text-sm font-bold"
            >
              Heading 2
            </button>
            <button
              onClick={() => {
                onFormatCommand('formatBlock', '<h3>');
                setShowStylesMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-[#f0f4f9] text-xs font-bold"
            >
              Heading 3
            </button>
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-[#dadce0] mx-1" />

      {/* Font Family Dropdown */}
      <div className="relative">
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className="bg-transparent hover:bg-[#e1eaf5] px-2 py-1 rounded text-xs text-[#1f1f1f] cursor-pointer outline-none font-medium max-w-[110px] truncate appearance-none pr-5"
          title="Font"
        >
          {GOOGLE_DOCS_FONTS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-[#5f6368] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      <div className="h-5 w-px bg-[#dadce0] mx-1" />

      {/* Font Size Stepper */}
      <div className="flex items-center">
        <button
          onClick={() => onFontSizeChange(Math.max(8, fontSize - 1))}
          className="w-6 h-6 hover:bg-[#e1eaf5] active:bg-[#d3e3fd] rounded flex items-center justify-center text-xs font-bold text-[#1f1f1f] cursor-pointer"
          title="Decrease font size"
        >
          -
        </button>
        <span className="w-6 text-center text-xs font-medium text-[#1f1f1f]">
          {fontSize}
        </span>
        <button
          onClick={() => onFontSizeChange(Math.min(72, fontSize + 1))}
          className="w-6 h-6 hover:bg-[#e1eaf5] active:bg-[#d3e3fd] rounded flex items-center justify-center text-xs font-bold text-[#1f1f1f] cursor-pointer"
          title="Increase font size"
        >
          +
        </button>
      </div>

      <div className="h-5 w-px bg-[#dadce0] mx-1" />

      {/* Bold (B) */}
      <button
        onClick={() => onFormatCommand('bold')}
        className={`p-1.5 rounded cursor-pointer transition-colors font-bold text-xs ${
          isBoldActive ? 'bg-[#d3e3fd] text-[#0b57d0]' : 'hover:bg-[#e1eaf5]'
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>

      {/* Italic (I) */}
      <button
        onClick={() => onFormatCommand('italic')}
        className={`p-1.5 rounded cursor-pointer transition-colors italic text-xs ${
          isItalicActive ? 'bg-[#d3e3fd] text-[#0b57d0]' : 'hover:bg-[#e1eaf5]'
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      {/* Underline (U) */}
      <button
        onClick={() => onFormatCommand('underline')}
        className={`p-1.5 rounded cursor-pointer transition-colors text-xs ${
          isUnderlineActive ? 'bg-[#d3e3fd] text-[#0b57d0]' : 'hover:bg-[#e1eaf5]'
        }`}
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-4 h-4" />
      </button>

      {/* Text Color Button with Palette */}
      <div className="relative">
        <button
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowHighlightPicker(false);
          }}
          className="p-1 hover:bg-[#e1eaf5] rounded cursor-pointer flex flex-col items-center justify-center"
          title="Text color"
        >
          <span className="text-xs font-bold text-[#1f1f1f] leading-none">A</span>
          <div className="w-3.5 h-1 mt-0.5 rounded-full" style={{ backgroundColor: textColor }} />
        </button>

        {showColorPicker && (
          <div className="absolute top-8 left-0 z-50 p-3 bg-white rounded-2xl shadow-xl border border-[#dadce0] grid grid-cols-10 gap-1 w-64 animate-in fade-in">
            {GOOGLE_COLOR_PALETTE.map((c, i) => (
              <div
                key={i}
                onClick={() => {
                  onTextColorChange(c);
                  setShowColorPicker(false);
                }}
                className="w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition-transform border border-black/10"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        )}
      </div>

      {/* Highlight Color Button with Palette */}
      <div className="relative">
        <button
          onClick={() => {
            setShowHighlightPicker(!showHighlightPicker);
            setShowColorPicker(false);
          }}
          className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer flex flex-col items-center justify-center"
          title="Highlight color"
        >
          <Highlighter className="w-4 h-4" />
          <div
            className="w-3.5 h-1 mt-0.5 rounded-full"
            style={{ backgroundColor: highlightColor === 'transparent' ? '#dadce0' : highlightColor }}
          />
        </button>

        {showHighlightPicker && (
          <div className="absolute top-8 left-0 z-50 p-3 bg-white rounded-2xl shadow-xl border border-[#dadce0] grid grid-cols-7 gap-1.5 w-52 animate-in fade-in">
            <button
              onClick={() => {
                onHighlightColorChange('transparent');
                setShowHighlightPicker(false);
              }}
              className="col-span-7 py-1 text-center text-xs font-medium text-[#1f1f1f] hover:bg-[#f0f4f9] rounded"
            >
              None
            </button>
            {GOOGLE_HIGHLIGHT_PALETTE.filter((c) => c !== 'transparent').map((c, i) => (
              <div
                key={i}
                onClick={() => {
                  onHighlightColorChange(c);
                  setShowHighlightPicker(false);
                }}
                className="w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition-transform border border-black/10"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-[#dadce0] mx-1" />

      {/* Insert Link (Ctrl+K) */}
      <button
        onClick={onOpenLinkModal}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Insert link (Ctrl+K)"
      >
        <Link className="w-4 h-4" />
      </button>

      {/* Add Comment */}
      <button
        onClick={() => onFormatCommand('comment')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Add comment (Ctrl+Alt+M)"
      >
        <MessageSquarePlus className="w-4 h-4" />
      </button>

      {/* Insert Image */}
      <button
        onClick={onInsertImage}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Insert image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      <div className="h-5 w-px bg-[#dadce0] mx-1" />

      {/* Alignment Buttons */}
      <button
        onClick={() => onFormatCommand('justifyLeft')}
        className={`p-1.5 rounded cursor-pointer ${
          activeAlign === 'left' ? 'bg-[#d3e3fd] text-[#0b57d0]' : 'hover:bg-[#e1eaf5]'
        }`}
        title="Left align (Ctrl+Shift+L)"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => onFormatCommand('justifyCenter')}
        className={`p-1.5 rounded cursor-pointer ${
          activeAlign === 'center' ? 'bg-[#d3e3fd] text-[#0b57d0]' : 'hover:bg-[#e1eaf5]'
        }`}
        title="Center align (Ctrl+Shift+E)"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        onClick={() => onFormatCommand('justifyRight')}
        className={`p-1.5 rounded cursor-pointer ${
          activeAlign === 'right' ? 'bg-[#d3e3fd] text-[#0b57d0]' : 'hover:bg-[#e1eaf5]'
        }`}
        title="Right align (Ctrl+Shift+R)"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <button
        onClick={() => onFormatCommand('justifyFull')}
        className={`p-1.5 rounded cursor-pointer ${
          activeAlign === 'justify' ? 'bg-[#d3e3fd] text-[#0b57d0]' : 'hover:bg-[#e1eaf5]'
        }`}
        title="Justify (Ctrl+Shift+J)"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      {/* Line Spacing */}
      <div className="relative">
        <button
          onClick={() => setShowLineSpacingMenu(!showLineSpacingMenu)}
          className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer flex items-center"
          title="Line & paragraph spacing"
        >
          <span className="text-xs font-bold leading-none">↕</span>
        </button>

        {showLineSpacingMenu && (
          <div className="absolute top-8 left-0 z-50 w-48 bg-white rounded-xl shadow-xl border border-[#dadce0] py-1 text-xs text-[#1f1f1f] animate-in fade-in">
            <button
              onClick={() => {
                onFormatCommand('lineSpacing', '1');
                setShowLineSpacingMenu(false);
              }}
              className="w-full text-left px-4 py-1.5 hover:bg-[#f0f4f9]"
            >
              Single
            </button>
            <button
              onClick={() => {
                onFormatCommand('lineSpacing', '1.15');
                setShowLineSpacingMenu(false);
              }}
              className="w-full text-left px-4 py-1.5 hover:bg-[#f0f4f9]"
            >
              1.15
            </button>
            <button
              onClick={() => {
                onFormatCommand('lineSpacing', '1.5');
                setShowLineSpacingMenu(false);
              }}
              className="w-full text-left px-4 py-1.5 hover:bg-[#f0f4f9]"
            >
              1.5
            </button>
            <button
              onClick={() => {
                onFormatCommand('lineSpacing', '2');
                setShowLineSpacingMenu(false);
              }}
              className="w-full text-left px-4 py-1.5 hover:bg-[#f0f4f9]"
            >
              Double
            </button>
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-[#dadce0] mx-1" />

      {/* Checklist */}
      <button
        onClick={() => onFormatCommand('insertChecklist')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Checklist (Ctrl+Shift+9)"
      >
        <ListChecks className="w-4 h-4" />
      </button>

      {/* Bulleted List */}
      <button
        onClick={() => onFormatCommand('insertUnorderedList')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Bulleted list (Ctrl+Shift+8)"
      >
        <List className="w-4 h-4" />
      </button>

      {/* Numbered List */}
      <button
        onClick={() => onFormatCommand('insertOrderedList')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Numbered list (Ctrl+Shift+7)"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      {/* Indents */}
      <button
        onClick={() => onFormatCommand('outdent')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Decrease indent (Ctrl+[)"
      >
        <Outdent className="w-4 h-4" />
      </button>
      <button
        onClick={() => onFormatCommand('indent')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Increase indent (Ctrl+])"
      >
        <Indent className="w-4 h-4" />
      </button>

      {/* Clear Formatting */}
      <button
        onClick={() => onFormatCommand('removeFormat')}
        className="p-1.5 hover:bg-[#e1eaf5] rounded cursor-pointer"
        title="Clear formatting (Ctrl+\)"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>

      {/* Table insert */}
      <button
        onClick={onInsertTable}
        className="px-2 py-1 hover:bg-[#e1eaf5] rounded text-xs font-medium text-[#1f1f1f] cursor-pointer"
        title="Insert 3x3 Table"
      >
        Table
      </button>

      <div className="flex-1" />

      {/* Far Right: Mode Switcher (Editing, Suggesting, Viewing) */}
      <div className="relative shrink-0">
        <button
          onClick={() => setShowModeMenu(!showModeMenu)}
          className="hover:bg-[#e1eaf5] px-2.5 py-1 rounded text-xs text-[#1f1f1f] cursor-pointer flex items-center gap-1.5 font-medium"
          title="Editing mode"
        >
          {mode === 'editing' && <Pencil className="w-3.5 h-3.5 text-[#1a73e8]" />}
          {mode === 'viewing' && <Eye className="w-3.5 h-3.5 text-[#5f6368]" />}
          <span className="capitalize">{mode}</span>
          <ChevronDown className="w-3 h-3 text-[#5f6368]" />
        </button>

        {showModeMenu && (
          <div className="absolute top-8 right-0 z-50 w-52 bg-white rounded-xl shadow-xl border border-[#dadce0] py-1 text-xs text-[#1f1f1f] animate-in fade-in">
            <button
              onClick={() => {
                onModeChange('editing');
                setShowModeMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-[#f0f4f9] flex items-center gap-2"
            >
              <Pencil className="w-4 h-4 text-[#1a73e8]" />
              <div>
                <p className="font-semibold">Editing</p>
                <p className="text-[11px] text-[#5f6368]">Edit document directly</p>
              </div>
            </button>
            <button
              onClick={() => {
                onModeChange('suggesting');
                setShowModeMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-[#f0f4f9] flex items-center gap-2"
            >
              <Paintbrush className="w-4 h-4 text-[#188038]" />
              <div>
                <p className="font-semibold">Suggesting</p>
                <p className="text-[11px] text-[#5f6368]">Edits become suggestions</p>
              </div>
            </button>
            <button
              onClick={() => {
                onModeChange('viewing');
                setShowModeMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-[#f0f4f9] flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-[#5f6368]" />
              <div>
                <p className="font-semibold">Viewing</p>
                <p className="text-[11px] text-[#5f6368]">Read or print final doc</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
