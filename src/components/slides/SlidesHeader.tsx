import React, { useState } from 'react';
import {
  Star,
  Folder,
  Check,
  Lock,
  Unlock,
  ExternalLink,
  ArrowLeft,
  MessageSquare,
  Video,
  Play,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { GoogleSlidesIcon } from '../GoogleIcons';

interface SlidesHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  isStarred: boolean;
  onToggleStar: () => void;
  isSaved: boolean;
  onOpenSlideshow: () => void;
  onShareClick: () => void;
  onBackToOverview?: () => void;
  webViewLink?: string;
  onMenuAction: (action: string) => void;
  accessLevel?: 'restricted' | 'anyone';
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

export const SlidesHeader: React.FC<SlidesHeaderProps> = ({
  title,
  onTitleChange,
  isStarred,
  onToggleStar,
  isSaved,
  onOpenSlideshow,
  onShareClick,
  onBackToOverview,
  webViewLink,
  onMenuAction,
  accessLevel = 'restricted',
  userName,
  userEmail,
  userPhoto,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showStatusPopover, setShowStatusPopover] = useState<boolean>(false);

  const MENUS = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New presentation', shortcut: 'Ctrl+M', action: () => onMenuAction('new_slide') },
        { label: 'Open', shortcut: 'Ctrl+O', action: () => onMenuAction('open_picker') },
        { divider: true },
        { label: 'Make a copy', action: () => onMenuAction('copy') },
        { label: 'Share with others', action: () => onShareClick() },
        { label: 'Download Microsoft PowerPoint (.pptx)', action: () => onMenuAction('download_pptx') },
        { label: 'Download PDF Document (.pdf)', action: () => window.print() },
        { divider: true },
        { label: 'Page setup (16:9 Widescreen)', action: () => onMenuAction('page_setup') },
        { label: 'Print', shortcut: 'Ctrl+P', action: () => window.print() },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: () => onMenuAction('undo') },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: () => onMenuAction('redo') },
        { divider: true },
        { label: 'Cut', shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
        { label: 'Copy', shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
        { label: 'Paste', shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
        { label: 'Select all', shortcut: 'Ctrl+A', action: () => onMenuAction('select_all') },
        { label: 'Duplicate slide', shortcut: 'Ctrl+D', action: () => onMenuAction('duplicate_slide') },
        { label: 'Delete slide', action: () => onMenuAction('delete_slide') },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { label: 'Slideshow', shortcut: 'Ctrl+F5', action: () => onOpenSlideshow() },
        { label: 'Show speaker notes', checked: true, action: () => onMenuAction('toggle_notes') },
        { label: 'Show ruler', checked: true, action: () => {} },
        { divider: true },
        { label: 'Full screen', action: () => onMenuAction('toggle_fullscreen') },
      ],
    },
    {
      id: 'insert',
      label: 'Insert',
      items: [
        { label: 'Text box', action: () => onMenuAction('insert_textbox') },
        { label: 'Image', action: () => onMenuAction('insert_image') },
        { label: 'Shape', action: () => onMenuAction('insert_shape') },
        { label: 'Table (3x3)', action: () => onMenuAction('insert_table') },
        { divider: true },
        { label: 'New slide', shortcut: 'Ctrl+M', action: () => onMenuAction('new_slide') },
      ],
    },
    {
      id: 'format',
      label: 'Format',
      items: [
        { label: 'Bold', shortcut: 'Ctrl+B', action: () => onMenuAction('bold') },
        { label: 'Italic', shortcut: 'Ctrl+I', action: () => onMenuAction('italic') },
        { label: 'Underline', shortcut: 'Ctrl+U', action: () => onMenuAction('underline') },
        { divider: true },
        { label: 'Align & indent > Left', action: () => onMenuAction('align_left') },
        { label: 'Align & indent > Center', action: () => onMenuAction('align_center') },
        { label: 'Align & indent > Right', action: () => onMenuAction('align_right') },
        { divider: true },
        { label: 'Borders & lines', action: () => onMenuAction('borders') },
      ],
    },
    {
      id: 'slide',
      label: 'Slide',
      items: [
        { label: 'New slide', shortcut: 'Ctrl+M', action: () => onMenuAction('new_slide') },
        { label: 'Duplicate slide', shortcut: 'Ctrl+D', action: () => onMenuAction('duplicate_slide') },
        { label: 'Delete slide', action: () => onMenuAction('delete_slide') },
        { divider: true },
        { label: 'Apply layout', action: () => onMenuAction('open_layout') },
        { label: 'Change background', action: () => onMenuAction('open_background') },
        { label: 'Change theme', action: () => onMenuAction('open_theme') },
      ],
    },
    {
      id: 'arrange',
      label: 'Arrange',
      items: [
        { label: 'Order > Bring to front', action: () => {} },
        { label: 'Order > Send to back', action: () => {} },
        { label: 'Center on page > Horizontally', action: () => {} },
        { label: 'Center on page > Vertically', action: () => {} },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        { label: 'Spelling and grammar check', action: () => onMenuAction('spellcheck') },
        { label: 'Voice typing speaker notes', action: () => alert('Microphone speech-to-text active.') },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'Slides Help', action: () => window.open('https://support.google.com/docs', '_blank') },
        { label: 'Keyboard shortcuts', shortcut: 'Ctrl+/', action: () => alert('Google Slides Shortcuts:\nCtrl+M: New Slide\nCtrl+D: Duplicate Slide\nCtrl+F5: Slideshow\nCtrl+B: Bold') },
      ],
    },
  ];

  return (
    <header className="h-14 sm:h-16 px-2 sm:px-4 bg-white border-b border-[#dadce0] flex items-center justify-between gap-2 shrink-0 select-none z-30 font-['Google_Sans',Roboto,sans-serif]">
      {/* Left: Google Slides Icon & Title & Menus */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        {onBackToOverview && (
          <button
            onClick={onBackToOverview}
            className="p-1.5 sm:p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Google Slides Icon */}
        <div
          onClick={() => onMenuAction('open_picker')}
          className="p-1 sm:p-1.5 hover:bg-[#f0f4f9] rounded-xl cursor-pointer transition-colors shrink-0"
          title="Google Slides home & presentations"
        >
          <GoogleSlidesIcon className="w-7 h-7 sm:w-9 sm:h-9" />
        </div>

        {/* Title and Menus */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-[15px] sm:text-[18px] font-normal text-[#1f1f1f] hover:bg-[#f0f4f9] px-1.5 sm:px-2 py-0.5 rounded-sm border border-transparent hover:border-[#dadce0] focus:border-[#1a73e8] focus:bg-white outline-none max-w-[140px] xs:max-w-[200px] sm:max-w-md truncate transition-all leading-snug"
              title="Rename presentation"
            />

            {/* Star Button */}
            <button
              onClick={onToggleStar}
              className="p-1 text-[#5f6368] hover:text-[#fbbc04] hover:bg-[#f0f4f9] rounded-full cursor-pointer transition-colors"
              title={isStarred ? 'Starred' : 'Star presentation'}
            >
              <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isStarred ? 'fill-[#fbbc04] text-[#fbbc04]' : ''}`} />
            </button>

            {/* Move to Folder */}
            <button
              onClick={() => onMenuAction('open_picker')}
              className="p-1 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full cursor-pointer hidden sm:block transition-colors"
              title="Move presentation"
            >
              <Folder className="w-4 h-4" />
            </button>

            {/* Cloud Save Status Indicator */}
            <div className="relative hidden xs:block">
              <button
                onClick={() => setShowStatusPopover(!showStatusPopover)}
                className="p-1 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full cursor-pointer flex items-center transition-colors"
                title="See presentation status"
              >
                <div className="relative">
                  <span className="text-[11px] font-medium text-[#5f6368] hidden md:inline-block px-1">
                    {isSaved ? 'Saved to Drive' : 'Saving...'}
                  </span>
                  <Check className={`w-3.5 h-3.5 inline ml-0.5 ${isSaved ? 'text-[#188038]' : 'text-[#f29900]'}`} />
                </div>
              </button>

              {showStatusPopover && (
                <div className="absolute top-8 left-0 z-50 w-72 bg-white rounded-2xl shadow-xl border border-[#dadce0] p-4 text-xs text-[#1f1f1f] space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#e6f4ea] text-[#137333] flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1f1f1f]">All changes saved to Drive</p>
                      <p className="text-[11px] text-[#5f6368] mt-0.5">
                        Slide edits are automatically synced to Google Drive in real-time.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#f1f3f4] flex items-center justify-between text-[11px] text-[#5f6368]">
                    <span>Offline access: Ready</span>
                    <button
                      onClick={() => setShowStatusPopover(false)}
                      className="text-[#1a73e8] font-semibold hover:underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Menus Row */}
          <div className="flex items-center text-xs text-[#444746] -ml-1 overflow-x-auto scrollbar-none">
            {MENUS.map((menu) => (
              <div key={menu.id} className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
                  onMouseEnter={() => {
                    if (activeMenu !== null) setActiveMenu(menu.id);
                  }}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-xs sm:text-[13px] hover:bg-[#f0f4f9] text-[#1f1f1f] cursor-pointer transition-colors shrink-0 ${
                    activeMenu === menu.id ? 'bg-[#e8f0fe] text-[#1a73e8]' : ''
                  }`}
                >
                  {menu.label}
                </button>

                {activeMenu === menu.id && (
                  <div className="absolute top-6 left-0 z-50 min-w-[220px] sm:min-w-[240px] bg-white rounded-xl shadow-[0_2px_6px_2px_rgba(60,64,67,0.15)] border border-[#dadce0] py-1 text-xs text-[#1f1f1f] animate-in fade-in duration-100">
                    {menu.items.map((item: any, idx: number) => {
                      if (item.divider) {
                        return <div key={idx} className="h-px bg-[#dadce0] my-1" />;
                      }
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            item.action();
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f0f4f9] flex items-center justify-between text-[13px] text-[#1f1f1f] cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            {item.checked !== undefined && (
                              <span className="w-3 text-[#1a73e8] font-bold">
                                {item.checked ? '✓' : ''}
                              </span>
                            )}
                            <span>{item.label}</span>
                          </span>
                          {item.shortcut && (
                            <span className="text-[11px] text-[#5f6368] font-mono ml-4">
                              {item.shortcut}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Slideshow Pill Button, Meet, Share, Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span
          className="text-xs text-[#5f6368] hover:text-[#1f1f1f] hover:underline cursor-pointer hidden xl:inline-block mr-1"
          title="Version history"
          onClick={() => alert('Slide version history is current.')}
        >
          Last edit was seconds ago
        </span>

        {/* The Iconic Slideshow Button */}
        <div className="flex items-center rounded-full bg-[#c2e7ff] hover:bg-[#b3defa] active:bg-[#a0d2f8] transition-all shadow-2xs">
          <button
            onClick={onOpenSlideshow}
            className="h-8 sm:h-10 pl-3 sm:pl-5 pr-2 sm:pr-3 text-[#001d35] rounded-l-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none"
            title="Start slideshow from beginning (Ctrl+F5)"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#001d35] text-[#001d35]" />
            <span className="hidden xs:inline">Slideshow</span>
          </button>
          <button
            onClick={onOpenSlideshow}
            className="h-8 sm:h-10 pr-2 sm:pr-3 pl-1 text-[#001d35] rounded-r-full hover:bg-black/5 cursor-pointer"
            title="Presenter view / From current slide"
          >
            <ChevronDown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#001d35]" />
          </button>
        </div>

        {/* Comment History */}
        <button
          onClick={() => onMenuAction('open_comments')}
          className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer hidden md:flex items-center justify-center"
          title="Open comment history"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Google Meet join call */}
        <button
          onClick={() => alert('Presenting slides to Google Meet call...')}
          className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer hidden lg:flex items-center justify-center"
          title="Join a call or present this tab to a call"
        >
          <Video className="w-5 h-5" />
        </button>

        {/* Share Button with Unlocked Key State */}
        <button
          id="slides-share-button"
          onClick={onShareClick}
          className={`h-8 sm:h-10 px-3 sm:px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer select-none shadow-2xs ${
            accessLevel === 'anyone'
              ? 'bg-[#e6f4ea] hover:bg-[#ceead6] text-[#137333] border border-[#34a853]'
              : 'bg-[#fee9d7] hover:bg-[#fedfc8] text-[#4a2800]'
          }`}
          title={accessLevel === 'anyone' ? 'Public: Anyone with the link can view (Unlocked)' : 'Restricted: Only people with access (Locked)'}
        >
          {accessLevel === 'anyone' ? (
            <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#137333]" />
          ) : (
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4a2800]" />
          )}
          <span>Share</span>
          {accessLevel === 'anyone' && (
            <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-[#188038] animate-pulse" />
          )}
        </button>

        {/* User Account Avatar */}
        {userPhoto ? (
          <img
            src={userPhoto}
            alt={userName || 'Google Account'}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border border-[#dadce0] shadow-xs cursor-pointer select-none"
            title={`Google Account: ${userName || userEmail || 'You'}`}
          />
        ) : (
          <div
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#f29900] text-white font-medium flex items-center justify-center text-xs sm:text-sm shadow-xs cursor-pointer select-none"
            title={`Google Account: ${userName || userEmail || 'You'}`}
          >
            {(userName || userEmail || 'U').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
};
