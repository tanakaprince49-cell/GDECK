import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  Trash2,
  Settings,
  ArrowRight,
  Filter,
  CheckCheck,
  Zap,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { NotificationCategory, WorkspaceNotification } from '../types/notification';
import { NotificationSettingsModal } from './NotificationSettingsModal';
import {
  GmailIcon,
  GoogleCalendarIcon,
  GoogleDriveIcon,
  GoogleTasksIcon,
  GoogleMeetIcon,
  GoogleLogo,
  GPilotIcon
} from './GoogleIcons';

interface NotificationCenterProps {
  onNavigateTab?: (tab: string) => void;
}

const getCategoryBadge = (category: NotificationCategory) => {
  switch (category) {
    case 'gmail':
      return { icon: GmailIcon, label: 'Gmail', bg: 'bg-white', text: 'text-[#d93025]', border: 'border-[#dadce0]' };
    case 'calendar':
      return { icon: GoogleCalendarIcon, label: 'Calendar', bg: 'bg-white', text: 'text-[#1a73e8]', border: 'border-[#dadce0]' };
    case 'drive':
      return { icon: GoogleDriveIcon, label: 'Drive', bg: 'bg-white', text: 'text-[#b06000]', border: 'border-[#dadce0]' };
    case 'tasks':
      return { icon: GoogleTasksIcon, label: 'Tasks', bg: 'bg-white', text: 'text-[#137333]', border: 'border-[#dadce0]' };
    case 'meet':
      return { icon: GoogleMeetIcon, label: 'Meet', bg: 'bg-white', text: 'text-[#00832d]', border: 'border-[#dadce0]' };
    case 'gpilot':
      return { icon: GPilotIcon, label: 'G-Pilot', bg: 'bg-white', text: 'text-[#1a73e8]', border: 'border-[#dadce0]' };
    default:
      return { icon: GoogleLogo, label: 'System', bg: 'bg-white', text: 'text-[#5f6368]', border: 'border-[#dadce0]' };
  }
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigateTab }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    triggerTestNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('all');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.category === filter;
  });

  const handleNotificationClick = (n: WorkspaceNotification) => {
    markAsRead(n.id);
    if (n.actionTab && onNavigateTab) {
      onNavigateTab(n.actionTab);
      setIsOpen(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Bell Button Icon */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f1f3f4] rounded-full transition-all relative cursor-pointer"
        title="Workspace Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#d93025] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-auto left-4 right-4 sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-[400px] rounded-[24px] bg-white border border-[#dadce0] shadow-[0_8px_32px_rgba(60,64,67,0.15)] z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-5 py-4 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-[#1f1f1f] font-['Google_Sans',sans-serif]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#d93025] text-white text-xs font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-2 text-[#5f6368] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-5 h-5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-2 text-[#5f6368] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => {
                  setShowSettingsModal(true);
                  setIsOpen(false);
                }}
                className="p-2 text-[#5f6368] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
                title="Notification Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-5 pb-3 bg-white border-b border-[#f1f3f4] flex flex-wrap items-center gap-2">
            {['all', 'unread', 'gmail', 'calendar', 'drive', 'tasks', 'gpilot'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  filter === cat
                    ? 'bg-[#e8f0fe] text-[#001d35]'
                    : 'bg-transparent text-[#5f6368] hover:bg-[#f1f3f4]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {filteredNotifications.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#f8fafd] flex items-center justify-center mx-auto text-[#5f6368]">
                  <Bell className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-sm font-medium text-[#1f1f1f]">No notifications</p>
                <p className="text-xs text-[#5f6368]">
                  {filter === 'unread' ? 'You are all caught up!' : 'Nothing to show in this filter.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const badge = getCategoryBadge(n.category);
                const CategoryIcon = badge.icon;
                const timeAgo = formatTimeAgo(n.timestamp);

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`px-5 py-4 transition-colors cursor-pointer flex items-start gap-4 group hover:bg-[#f8fafd] border-b border-[#f1f3f4] last:border-0 ${
                      !n.read ? 'bg-[#f4f8ff]/40' : 'bg-white'
                    }`}
                  >
                    {/* Category Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${badge.bg} border ${badge.border}`}>
                      <CategoryIcon className={`w-6 h-6 ${badge.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-xs font-medium ${badge.text} truncate`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-[#5f6368] shrink-0">{timeAgo}</span>
                      </div>

                      <h4
                        className={`text-sm truncate ${
                          !n.read ? 'font-medium text-[#1f1f1f]' : 'text-[#444746]'
                        }`}
                      >
                        {n.title}
                      </h4>
                      <p className="text-sm text-[#5f6368] line-clamp-2 mt-0.5 leading-snug">
                        {n.message}
                      </p>

                      {n.actionTab && (
                        <div className="mt-3 flex items-center justify-between">
                          <button className="px-4 py-1.5 rounded-full border border-[#dadce0] text-sm font-medium text-[#1a73e8] hover:bg-[#f8fafd] transition-colors">
                            {n.actionText || 'View'}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(n.id);
                            }}
                            className="text-[#5f6368] hover:bg-[#f1f3f4] p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            title="Remove notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {!n.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8] shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-white border-t border-[#f1f3f4] flex items-center justify-between rounded-b-[24px]">
            <button
              onClick={triggerTestNotification}
              className="text-sm font-medium text-[#1a73e8] hover:bg-[#f8fafd] px-3 py-1.5 rounded-md flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Zap className="w-4 h-4" /> Simulate Alert
            </button>
            
            <button
              onClick={() => {
                setShowSettingsModal(true);
                setIsOpen(false);
              }}
              className="text-sm text-[#5f6368] hover:bg-[#f1f3f4] px-3 py-1.5 rounded-md flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <NotificationSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};

function formatTimeAgo(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
