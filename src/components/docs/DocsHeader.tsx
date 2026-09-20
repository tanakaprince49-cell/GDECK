import React, { useState } from 'react';
import {
  Star,
  Folder,
  CloudCheck,
  Check,
  Lock,
  Unlock,
  ArrowLeft,
  MessageSquare,
  Video,
  Printer,
  FileText,
  Clock,
  ChevronDown,
  Info,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { GoogleDocsIcon } from '../GoogleIcons';

interface DocsHeaderProps {
  docTitle: string;
  onTitleChange: (newTitle: string) => void;
  isStarred: boolean;
  onToggleStar: () => void;
  isSaved: boolean;
  onOpenDocPicker: () => void;
  onShareClick: () => void;
  onBackToOverview?: () => void;
  webViewLink?: string;
  onMenuAction: (action: string) => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  showOutline: boolean;
  onToggleOutline: () => void;
  accessLevel?: 'restricted' | 'anyone';
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

export const DocsHeader: React.FC<DocsHeaderProps> = ({
  docTitle,
  onTitleChange,
  isStarred,
  onToggleStar,
  isSaved,
  onOpenDocPicker,
  onShareClick,
  onBackToOverview,
  webViewLink,
  onMenuAction,
  showRuler,
  onToggleRuler,
  showOutline,
  onToggleOutline,
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
        { label: 'New document', shortcut: 'Ctrl+N', action: () => onMenuAction('new_blank') },
        { label: 'From template gallery', action: () => onMenuAction('open_templates') },
        { label: 'Open', shortcut: 'Ctrl+O', action: () => onOpenDocPicker() },
        { divider: true },
        { label: 'Make a copy', action: () => onMenuAction('copy_doc') },
        { label: 'Share with others', action: () => onShareClick() },
        { label: 'Download Microsoft Word (.docx)', action: () => onMenuAction('download_docx') },
        { label: 'Download PDF (.pdf)', action: () => onMenuAction('download_pdf') },
        { label: 'Download Plain Text (.txt)', action: () => onMenuAction('download_txt') },
        { divider: true },
        { label: 'Page setup', action: () => onMenuAction('page_setup') },
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
        { label: 'Paste', shortcut: 'Ctrl+V', action: () => onMenuAction('paste') },
        { divider: true },
        { label: 'Select all', shortcut: 'Ctrl+A', action: () => document.execCommand('selectAll') },
        { label: 'Find and replace', shortcut: 'Ctrl+H', action: () => onMenuAction('find_replace') },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { label: 'Print layout', checked: true, action: () => {} },
        { label: 'Show ruler', checked: showRuler, action: () => onToggleRuler() },
        { label: 'Show document outline', checked: showOutline, action: () => onToggleOutline() },
        { divider: true },
        { label: 'Full screen', shortcut: 'F11', action: () => onMenuAction('toggle_fullscreen') },
      ],
    },
    {
      id: 'insert',
      label: 'Insert',
      items: [
        { label: 'Image', action: () => onMenuAction('insert_image') },
        { label: 'Table (3x3 grid)', action: () => onMenuAction('insert_table') },
        { label: 'Horizontal line', action: () => onMenuAction('insert_hr') },
        { divider: true },
        { label: 'Emoji & Smart Chip', action: () => onMenuAction('insert_chip') },
        { label: 'Link', shortcut: 'Ctrl+K', action: () => onMenuAction('insert_link') },
        { label: 'Comment', shortcut: 'Ctrl+Alt+M', action: () => onMenuAction('insert_comment') },
        { divider: true },
        { label: 'Page break', shortcut: 'Ctrl+Enter', action: () => onMenuAction('insert_page_break') },
      ],
    },
    {
      id: 'format',
      label: 'Format',
      items: [
        { label: 'Bold', shortcut: 'Ctrl+B', action: () => onMenuAction('bold') },
        { label: 'Italic', shortcut: 'Ctrl+I', action: () => onMenuAction('italic') },
        { label: 'Underline', shortcut: 'Ctrl+U', action: () => onMenuAction('underline') },
        { label: 'Strikethrough', action: () => onMenuAction('strikethrough') },
        { divider: true },
        { label: 'Heading 1', shortcut: 'Ctrl+Alt+1', action: () => onMenuAction('format_h1') },
        { label: 'Heading 2', shortcut: 'Ctrl+Alt+2', action: () => onMenuAction('format_h2') },
        { label: 'Heading 3', shortcut: 'Ctrl+Alt+3', action: () => onMenuAction('format_h3') },
        { label: 'Normal text', shortcut: 'Ctrl+Alt+0', action: () => onMenuAction('format_normal') },
        { divider: true },
        { label: 'Clear formatting', shortcut: 'Ctrl+\\', action: () => onMenuAction('clear_formatting') },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        { label: 'Spelling and grammar check', action: () => onMenuAction('spellcheck') },
        { label: 'Word count', shortcut: 'Ctrl+Shift+C', action: () => onMenuAction('word_count') },
        { label: 'Review suggested edits', action: () => alert('No pending suggested edits in this document.') },
        { divider: true },
        { label: 'Preferences', action: () => onMenuAction('page_setup') },
      ],
    },
    {
      id: 'extensions',
      label: 'Extensions',
      items: [
        { label: 'Add-ons > Get add-ons', action: () => alert('Google Workspace Marketplace integration enabled.') },
        { label: 'Apps Script', action: () => alert('Apps Script environment active for automated triggers.') },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'Docs Help', action: () => window.open('https://support.google.com/docs', '_blank') },
        { label: 'Keyboard shortcuts', shortcut: 'Ctrl+/', action: () => onMenuAction('shortcuts') },
      ],
    },
  ];

  return (
    <header className="h-16 px-4 bg-white border-b border-[#dadce0] flex items-center justify-between gap-2 shrink-0 select-none z-30">
      {/* Left: Google Docs Logo & Title & Menus */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onBackToOverview && (
          <button
            onClick={onBackToOverview}
            className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Google Docs Icon */}
        <div
          onClick={onOpenDocPicker}
          className="p-1.5 hover:bg-[#f0f4f9] rounded-xl cursor-pointer transition-colors shrink-0"
          title="Google Docs home & Drive picker"
        >
          <GoogleDocsIcon className="w-9 h-9" />
        </div>

        {/* Title and Menus Stack */}
        <div className="flex flex-col justify-center min-w-0">
          {/* Top Line: Title + Star + Folder + Cloud Save Status */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={docTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-[18px] font-normal text-[#1f1f1f] hover:bg-[#f0f4f9] px-2 py-0.5 rounded-sm border border-transparent hover:border-[#dadce0] focus:border-[#1a73e8] focus:bg-white outline-none max-w-[240px] sm:max-w-md truncate transition-all leading-snug"
              title="Rename document"
            />

            {/* Star Icon Button */}
            <button
              onClick={onToggleStar}
              className="p-1 text-[#5f6368] hover:text-[#fbbc04] hover:bg-[#f0f4f9] rounded-full cursor-pointer transition-colors"
              title={isStarred ? 'Starred' : 'Star document'}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-[#fbbc04] text-[#fbbc04]' : ''}`} />
            </button>

            {/* Move to Folder Button */}
            <button
              onClick={onOpenDocPicker}
              className="p-1 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full cursor-pointer hidden sm:block transition-colors"
              title="Move document"
            >
              <Folder className="w-4 h-4" />
            </button>

            {/* Document Status Cloud Icon (With Popover) */}
            <div className="relative">
              <button
                onClick={() => setShowStatusPopover(!showStatusPopover)}
                className="p-1 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full cursor-pointer flex items-center transition-colors"
                title="Document status: All changes saved to Drive"
              >
                <div className="relative">
                  <span className="text-[11px] font-medium text-[#5f6368] hidden md:inline-block px-1">
                    {isSaved ? 'Saved to Drive' : 'Saving...'}
                  </span>
                  <Check className={`w-3.5 h-3.5 inline ml-0.5 ${isSaved ? 'text-[#188038]' : 'text-[#f29900]'}`} />
                </div>
              </button>

              {/* Authentic Google Docs Document Status Popover */}
              {showStatusPopover && (
                <div className="absolute top-8 left-0 z-50 w-72 bg-white rounded-2xl shadow-xl border border-[#dadce0] p-4 text-xs text-[#1f1f1f] space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#e6f4ea] text-[#137333] flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1f1f1f]">All changes saved to Drive</p>
                      <p className="text-[11px] text-[#5f6368] mt-0.5">
                        Every edit is automatically saved in Google Drive and synced securely.
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

          {/* Bottom Line: The Authentic Menu Bar */}
          <div className="flex items-center text-xs text-[#444746] -ml-1">
            {MENUS.map((menu) => (
              <div key={menu.id} className="relative" onMouseLeave={() => {}}>
                <button
                  onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
                  onMouseEnter={() => {
                    if (activeMenu !== null) setActiveMenu(menu.id);
                  }}
                  className={`px-2 py-0.5 rounded text-[13px] hover:bg-[#f0f4f9] text-[#1f1f1f] cursor-pointer transition-colors ${
                    activeMenu === menu.id ? 'bg-[#e8f0fe] text-[#1a73e8]' : ''
                  }`}
                >
                  {menu.label}
                </button>

                {/* Dropdown Menu */}
                {activeMenu === menu.id && (
                  <div className="absolute top-6 left-0 z-50 min-w-[240px] bg-white rounded-xl shadow-[0_2px_6px_2px_rgba(60,64,67,0.15)] border border-[#dadce0] py-1 text-xs text-[#1f1f1f] animate-in fade-in duration-100">
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

      {/* Right: Last Edit, Comment History, Meet, and Iconic Share Button */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-xs text-[#5f6368] hover:text-[#1f1f1f] hover:underline cursor-pointer hidden xl:inline-block mr-1"
          title="Version history"
          onClick={() => alert('Document version history is up to date.')}
        >
          Last edit was seconds ago
        </span>

        {/* Comment History Icon */}
        <button
          onClick={() => onMenuAction('open_comments')}
          className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer hidden md:flex items-center justify-center"
          title="Open comment history (Ctrl+Alt+Shift+A)"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Join a call / Meet button */}
        <button
          onClick={() => alert('Starting Google Meet session for collaborative document review...')}
          className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer hidden lg:flex items-center justify-center"
          title="Join a call or present this tab to a call"
        >
          <Video className="w-5 h-5" />
        </button>

        {/* External Drive Link */}
        

        {/* Iconic Google Docs Share Button (Light blue pill when restricted, soft emerald/unlocked when public) */}
        <button
          id="docs-share-button"
          onClick={onShareClick}
          className={`h-9 sm:h-10 px-4 sm:px-6 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer select-none shadow-2xs ${
            accessLevel === 'anyone'
              ? 'bg-[#e6f4ea] hover:bg-[#ceead6] active:bg-[#b7e1cd] text-[#137333] border border-[#34a853]'
              : 'bg-[#c2e7ff] hover:bg-[#b3defa] hover:shadow-xs active:bg-[#a0d2f8] text-[#001d35]'
          }`}
          title={accessLevel === 'anyone' ? 'Public: Anyone with the link can view (Unlocked)' : 'Restricted: Only people with access (Locked)'}
        >
          {accessLevel === 'anyone' ? (
            <Unlock className="w-4 h-4 text-[#137333]" />
          ) : (
            <Lock className="w-4 h-4 text-[#001d35]" />
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
            className="w-9 h-9 rounded-full object-cover border border-[#dadce0] shadow-xs cursor-pointer select-none"
            title={`Google Account: ${userName || userEmail || 'You'}`}
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full bg-[#1a73e8] text-white font-medium flex items-center justify-center text-sm shadow-xs cursor-pointer select-none"
            title={`Google Account: ${userName || userEmail || 'You'}`}
          >
            {(userName || userEmail || 'U').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
};
