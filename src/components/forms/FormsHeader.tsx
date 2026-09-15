import React from 'react';
import {
  Star,
  Folder,
  Check,
  Palette,
  Eye,
  Undo,
  Redo,
  Send,
  MoreVertical,
  ArrowLeft,
  Lock,
  Unlock,
} from 'lucide-react';
import { GoogleFormsIcon } from '../GoogleIcons';

interface FormsHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  activeTab: 'questions' | 'responses' | 'settings';
  onTabChange: (tab: 'questions' | 'responses' | 'settings') => void;
  responseCount: number;
  isStarred: boolean;
  onToggleStar: () => void;
  isSaved: boolean;
  onOpenThemePanel: () => void;
  onOpenPreview: () => void;
  onOpenSendModal: () => void;
  onBackToOverview?: () => void;
  primaryColor: string;
  onOpenPicker?: () => void;
  accessLevel?: 'restricted' | 'anyone';
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

export const FormsHeader: React.FC<FormsHeaderProps> = ({
  title,
  onTitleChange,
  activeTab,
  onTabChange,
  responseCount,
  isStarred,
  onToggleStar,
  isSaved,
  onOpenThemePanel,
  onOpenPreview,
  onOpenSendModal,
  onBackToOverview,
  primaryColor,
  onOpenPicker,
  accessLevel = 'restricted',
  userName,
  userEmail,
  userPhoto,
}) => {
  return (
    <header className="bg-white border-b border-[#dadce0] flex flex-col shrink-0 select-none z-30 font-['Google_Sans',Roboto,sans-serif]">
      {/* Top Chrome Row */}
      <div className="h-14 sm:h-16 px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: Forms Icon & Title & Star/Folder/Save Status */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="p-1.5 sm:p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
              title="Back to Google Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Google Forms Purple Logo - Clickable to Open Picker */}
          <div
            onClick={onOpenPicker}
            className="p-1 sm:p-1.5 hover:bg-[#f0f4f9] rounded-xl cursor-pointer transition-colors shrink-0"
            title="Google Forms home & forms picker"
          >
            <GoogleFormsIcon className="w-7 h-7 sm:w-9 sm:h-9" />
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-[15px] sm:text-[18px] font-normal text-[#1f1f1f] hover:bg-[#f0f4f9] px-1.5 sm:px-2 py-0.5 rounded-sm border border-transparent hover:border-[#dadce0] focus:border-[#1a73e8] focus:bg-white outline-none max-w-[130px] xs:max-w-[200px] sm:max-w-md truncate transition-all"
              title="Rename form"
            />

            {/* Folder Move / Open */}
            <button
              onClick={onOpenPicker}
              className="p-1 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full cursor-pointer hidden sm:block transition-colors"
              title="Move or open form"
            >
              <Folder className="w-4 h-4" />
            </button>

            {/* Star */}
            <button
              onClick={onToggleStar}
              className="p-1 text-[#5f6368] hover:text-[#fbbc04] hover:bg-[#f0f4f9] rounded-full cursor-pointer transition-colors"
              title={isStarred ? 'Starred' : 'Star form'}
            >
              <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isStarred ? 'fill-[#fbbc04] text-[#fbbc04]' : ''}`} />
            </button>

            {/* Save status */}
            <span className="text-[11px] text-[#5f6368] hidden md:flex items-center gap-1 ml-1">
              <Check className="w-3.5 h-3.5 text-[#188038]" />
              <span>{isSaved ? 'All changes saved in Drive' : 'Saving...'}</span>
            </span>
          </div>
        </div>

        {/* Right Chrome Controls: Palette, Preview, Undo/Redo, Send Button, Avatar */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Customize Theme Button */}
          <button
            onClick={onOpenThemePanel}
            className="p-1.5 sm:p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full cursor-pointer transition-colors"
            title="Customize theme"
          >
            <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Preview Button */}
          <button
            onClick={onOpenPreview}
            className="p-1.5 sm:p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full cursor-pointer transition-colors"
            title="Preview form"
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Undo */}
          <button
            onClick={() => document.execCommand('undo')}
            className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full cursor-pointer transition-colors hidden sm:block"
            title="Undo"
          >
            <Undo className="w-5 h-5" />
          </button>

          {/* Redo */}
          <button
            onClick={() => document.execCommand('redo')}
            className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full cursor-pointer transition-colors hidden sm:block"
            title="Redo"
          >
            <Redo className="w-5 h-5" />
          </button>

          {/* Signature Google Forms Send Button (Solid Purple Pill with Unlock/Lock public indicator) */}
          <button
            id="forms-send-button"
            onClick={onOpenSendModal}
            className="h-8 sm:h-10 px-3 sm:px-6 rounded-full text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-xs transition-all hover:shadow-md active:opacity-90"
            style={{ backgroundColor: primaryColor }}
            title={accessLevel === 'anyone' ? 'Public Form: Anyone can view and respond (Unlocked)' : 'Send and Share form'}
          >
            {accessLevel === 'anyone' ? (
              <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            ) : (
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            )}
            <span>Send</span>
          </button>

          {/* More options */}
          <button
            onClick={() => alert('Form options: Make a copy, Print, Add collaborators, Script editor')}
            className="p-1.5 sm:p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full cursor-pointer hidden xs:block"
            title="More options"
          >
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* User Avatar */}
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={userName || 'Google Account'}
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border border-[#dadce0] shadow-xs cursor-pointer select-none"
              title={`Google Account: ${userName || userEmail || 'You'}`}
            />
          ) : (
            <div
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full text-white font-medium flex items-center justify-center text-xs sm:text-sm shadow-xs cursor-pointer select-none"
              style={{ backgroundColor: primaryColor }}
              title={`Google Account: ${userName || userEmail || 'You'}`}
            >
              {(userName || userEmail || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Row (Questions, Responses, Settings) */}
      <div className="flex justify-center border-t border-[#f1f3f4] bg-white">
        <div className="flex items-center gap-4 sm:gap-8 text-xs sm:text-sm font-semibold">
          {/* Questions Tab */}
          <button
            onClick={() => onTabChange('questions')}
            className={`py-2.5 sm:py-3 px-2 sm:px-3 relative cursor-pointer transition-colors ${
              activeTab === 'questions' ? 'text-[#1f1f1f]' : 'text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            <span>Questions</span>
            {activeTab === 'questions' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-sm"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </button>

          {/* Responses Tab */}
          <button
            onClick={() => onTabChange('responses')}
            className={`py-2.5 sm:py-3 px-2 sm:px-3 relative cursor-pointer flex items-center gap-1.5 sm:gap-2 transition-colors ${
              activeTab === 'responses' ? 'text-[#1f1f1f]' : 'text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            <span>Responses</span>
            <span
              className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full"
              style={{
                backgroundColor: activeTab === 'responses' ? `${primaryColor}20` : '#f1f3f4',
                color: activeTab === 'responses' ? primaryColor : '#5f6368',
              }}
            >
              {responseCount}
            </span>
            {activeTab === 'responses' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-sm"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => onTabChange('settings')}
            className={`py-2.5 sm:py-3 px-2 sm:px-3 relative cursor-pointer transition-colors ${
              activeTab === 'settings' ? 'text-[#1f1f1f]' : 'text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            <span>Settings</span>
            {activeTab === 'settings' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-sm"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
