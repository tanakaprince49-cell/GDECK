import React, { useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { NotificationCategory } from '../types/notification';
import {
  GmailIcon,
  GoogleCalendarIcon,
  GoogleDriveIcon,
  GoogleTasksIcon,
  GoogleMeetIcon,
  GoogleDocsIcon,
  GoogleSheetsIcon,
  GoogleSlidesIcon,
  GoogleFormsIcon,
  GoogleKeepIcon,
  GoogleChatIcon,
  GoogleLogo,
  GPilotIcon,
} from './GoogleIcons';

interface NotificationToastProps {
  onNavigateTab?: (tab: string) => void;
}

interface ToolStyleConfig {
  name: string;
  IconComponent: React.FC<{ className?: string; alt?: string }>;
  chipBg: string;
  chipText: string;
  chipBorder: string;
  actionClass: string;
  containerBg: string;
}

const getToolConfig = (category: NotificationCategory | string): ToolStyleConfig => {
  switch (category) {
    case 'gmail':
      return {
        name: 'Gmail',
        IconComponent: GmailIcon,
        chipBg: 'bg-[#fce8e6]',
        chipText: 'text-[#d93025]',
        chipBorder: 'border-[#f5c2c7]',
        actionClass: 'text-[#d93025] hover:bg-[#fce8e6]',
        containerBg: 'bg-white',
      };
    case 'calendar':
      return {
        name: 'Google Calendar',
        IconComponent: GoogleCalendarIcon,
        chipBg: 'bg-[#e8f0fe]',
        chipText: 'text-[#1a73e8]',
        chipBorder: 'border-[#d2e3fc]',
        actionClass: 'text-[#1a73e8] hover:bg-[#e8f0fe]',
        containerBg: 'bg-white',
      };
    case 'drive':
      return {
        name: 'Google Drive',
        IconComponent: GoogleDriveIcon,
        chipBg: 'bg-[#fef7e0]',
        chipText: 'text-[#b06000]',
        chipBorder: 'border-[#fce8b2]',
        actionClass: 'text-[#b06000] hover:bg-[#fef7e0]',
        containerBg: 'bg-white',
      };
    case 'tasks':
      return {
        name: 'Google Tasks',
        IconComponent: GoogleTasksIcon,
        chipBg: 'bg-[#e6f4ea]',
        chipText: 'text-[#137333]',
        chipBorder: 'border-[#ceead6]',
        actionClass: 'text-[#137333] hover:bg-[#e6f4ea]',
        containerBg: 'bg-white',
      };
    case 'meet':
      return {
        name: 'Google Meet',
        IconComponent: GoogleMeetIcon,
        chipBg: 'bg-[#e6f4ea]',
        chipText: 'text-[#00832d]',
        chipBorder: 'border-[#ceead6]',
        actionClass: 'text-[#00832d] hover:bg-[#e6f4ea]',
        containerBg: 'bg-white',
      };
    case 'docs':
      return {
        name: 'Google Docs',
        IconComponent: GoogleDocsIcon,
        chipBg: 'bg-[#e8f0fe]',
        chipText: 'text-[#1a73e8]',
        chipBorder: 'border-[#d2e3fc]',
        actionClass: 'text-[#1a73e8] hover:bg-[#e8f0fe]',
        containerBg: 'bg-white',
      };
    case 'sheets':
      return {
        name: 'Google Sheets',
        IconComponent: GoogleSheetsIcon,
        chipBg: 'bg-[#e6f4ea]',
        chipText: 'text-[#0f9d58]',
        chipBorder: 'border-[#b7e1cd]',
        actionClass: 'text-[#0f9d58] hover:bg-[#e6f4ea]',
        containerBg: 'bg-white',
      };
    case 'slides':
      return {
        name: 'Google Slides',
        IconComponent: GoogleSlidesIcon,
        chipBg: 'bg-[#fef7e0]',
        chipText: 'text-[#f4b400]',
        chipBorder: 'border-[#fce8b2]',
        actionClass: 'text-[#e37400] hover:bg-[#fef7e0]',
        containerBg: 'bg-white',
      };
    case 'forms':
      return {
        name: 'Google Forms',
        IconComponent: GoogleFormsIcon,
        chipBg: 'bg-[#f3e8fd]',
        chipText: 'text-[#7248b9]',
        chipBorder: 'border-[#e1c5f8]',
        actionClass: 'text-[#7248b9] hover:bg-[#f3e8fd]',
        containerBg: 'bg-white',
      };
    case 'keep':
      return {
        name: 'Google Keep',
        IconComponent: GoogleKeepIcon,
        chipBg: 'bg-[#fef7e0]',
        chipText: 'text-[#f29900]',
        chipBorder: 'border-[#fce8b2]',
        actionClass: 'text-[#e37400] hover:bg-[#fef7e0]',
        containerBg: 'bg-white',
      };
    case 'chat':
      return {
        name: 'Google Chat',
        IconComponent: GoogleChatIcon,
        chipBg: 'bg-[#e6f4ea]',
        chipText: 'text-[#00832d]',
        chipBorder: 'border-[#ceead6]',
        actionClass: 'text-[#00832d] hover:bg-[#e6f4ea]',
        containerBg: 'bg-white',
      };
    case 'gpilot':
      return {
        name: 'G-Pilot AI',
        IconComponent: GPilotIcon,
        chipBg: 'bg-[#0b0f17]',
        chipText: 'text-[#fbe618]',
        chipBorder: 'border-[#222]',
        actionClass: 'text-[#1a73e8] hover:bg-[#e8f0fe]',
        containerBg: 'bg-[#0b0f17]',
      };
    case 'billing':
      return {
        name: 'G-Deck Pro',
        IconComponent: GoogleLogo,
        chipBg: 'bg-[#faf5ff]',
        chipText: 'text-[#7e22ce]',
        chipBorder: 'border-[#e9d5ff]',
        actionClass: 'text-[#7e22ce] hover:bg-[#faf5ff]',
        containerBg: 'bg-white',
      };
    default:
      return {
        name: 'Google Workspace',
        IconComponent: GoogleLogo,
        chipBg: 'bg-[#f1f3f4]',
        chipText: 'text-[#444746]',
        chipBorder: 'border-[#dadce0]',
        actionClass: 'text-[#1a73e8] hover:bg-[#e8f0fe]',
        containerBg: 'bg-white',
      };
  }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({ onNavigateTab }) => {
  const { activeToast, dismissToast, markAsRead } = useNotifications();

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const tool = getToolConfig(activeToast.category);
  const ToolLogo = tool.IconComponent;

  const handleAction = () => {
    markAsRead(activeToast.id);
    if (activeToast.actionTab === 'upgrade' || activeToast.category === 'billing') {
      window.dispatchEvent(
        new CustomEvent('gdeck_open_upgrade', {
          detail: { isRenewal: true, source: 'notification-toast' },
        })
      );
    } else if (activeToast.actionTab && onNavigateTab) {
      onNavigateTab(activeToast.actionTab);
    }
    dismissToast();
  };

  return (
    <div
      id={`notification-toast-${activeToast.id}`}
      role="alert"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-[100] sm:max-w-sm w-auto sm:w-full bg-white/98 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-[#dadce0]/80 shadow-[0_12px_40px_rgba(30,31,33,0.18)] p-3.5 sm:p-4 animate-in fade-in slide-in-from-bottom-6 duration-300 select-none"
    >
      {/* Mobile Swipe / Dismiss Pull Bar */}
      <div className="w-8 h-1 bg-[#dadce0] rounded-full mx-auto -mt-1 mb-2.5 sm:hidden opacity-75" />

      <div className="flex items-start justify-between gap-3">
        {/* Official Google Tool Logo Container */}
        <div
          id="notification-toast-tool-logo"
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${tool.containerBg} border border-[#dadce0]/70 flex items-center justify-center shrink-0 p-2 shadow-2xs transition-transform hover:scale-105`}
          title={tool.name}
        >
          <ToolLogo className="w-7 h-7 sm:w-8 sm:h-8 object-contain" alt={tool.name} />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[10px] sm:text-[11px] font-bold tracking-wide ${tool.chipText} ${tool.chipBg} px-2.5 py-0.5 rounded-full border ${tool.chipBorder} inline-flex items-center gap-1`}
            >
              {tool.name}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-[#5f6368]">Just now</span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-[#1f1f1f] mt-1 truncate leading-snug">
            {activeToast.title}
          </h4>
          <p className="text-xs text-[#5f6368] mt-0.5 line-clamp-2 leading-relaxed">
            {activeToast.message}
          </p>

          {activeToast.actionTab && (
            <button
              onClick={handleAction}
              className={`mt-2 px-3.5 py-1.5 min-h-[32px] text-xs font-bold ${tool.actionClass} rounded-full transition-all flex items-center gap-1.5 cursor-pointer active:scale-95`}
            >
              <span>{activeToast.actionText || 'Open'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={dismissToast}
          className="p-2 text-[#5f6368] hover:text-[#1f1f1f] rounded-full hover:bg-[#f1f3f4] active:bg-[#e1e3e1] transition-colors cursor-pointer shrink-0 -mt-1 -mr-1"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
