import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  Trash2,
  Mail,
  Calendar,
  HardDrive,
  CheckSquare,
  Video,
  Sparkles,
  Settings,
  ArrowRight,
  Filter,
  CheckCheck,
  Zap,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { NotificationCategory, WorkspaceNotification } from '../types/notification';
import { NotificationSettingsModal } from './NotificationSettingsModal';

interface NotificationCenterProps {
  onNavigateTab?: (tab: string) => void;
}

const getCategoryBadge = (category: NotificationCategory) => {
  switch (category) {
    case 'gmail':
      return { icon: Mail, label: 'Gmail', bg: 'bg-[#fce8e6]', text: 'text-[#d93025]', border: 'border-[#f5c6cb]' };
    case 'calendar':
      return { icon: Calendar, label: 'Calendar', bg: 'bg-[#e8f0fe]', text: 'text-[#1a73e8]', border: 'border-[#d2e3fc]' };
    case 'drive':
      return { icon: HardDrive, label: 'Drive', bg: 'bg-[#fef7e0]', text: 'text-[#b06000]', border: 'border-[#feefc3]' };
    case 'tasks':
      return { icon: CheckSquare, label: 'Tasks', bg: 'bg-[#e6f4ea]', text: 'text-[#137333]', border: 'border-[#ceead6]' };
    case 'meet':
      return { icon: Video, label: 'Meet', bg: 'bg-[#e6f4ea]', text: 'text-[#00832d]', border: 'border-[#ceead6]' };
    case 'gpilot':
      return { icon: Sparkles, label: 'G-Pilot', bg: 'bg-[#f3e8ff]', text: 'text-[#7e22ce]', border: 'border-[#e9d5ff]' };
    default:
      return { icon: Bell, label: 'System', bg: 'bg-slate-100', text: 'text-[#5f6368]', border: 'border-slate-200' };
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
        <div className="fixed sm:absolute top-16 sm:top-auto left-4 right-4 sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-96 rounded-3xl bg-white border border-[#dadce0] shadow-[0_8px_32px_rgba(60,64,67,0.22)] z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-4 bg-white border-b border-[#f1f3f4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1f1f1f] font-['Google_Sans',sans-serif]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#d93025]/10 text-[#d93025] text-xs font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  setShowSettingsModal(true);
                  setIsOpen(false);
                }}
                className="p-1.5 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
                title="Notification Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-3 py-2 bg-[#f8fafd] border-b border-[#f1f3f4] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['all', 'unread', 'gmail', 'calendar', 'drive', 'tasks', 'gpilot'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  filter === cat
                    ? 'bg-[#1a73e8] text-white shadow-xs'
                    : 'bg-white text-[#5f6368] hover:bg-[#e8f0fe] border border-[#dadce0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f1f3f4] max-h-96">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#f8fafd] border border-[#dadce0] flex items-center justify-center mx-auto text-[#5f6368]">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-[#1f1f1f]">No notifications</p>
                <p className="text-[11px] text-[#5f6368]">
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
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 group hover:bg-[#f0f4f9] ${
                      !n.read ? 'bg-[#f4f8ff]/70 font-medium' : 'bg-white'
                    }`}
                  >
                    {/* Category Icon */}
                    <div className={`p-2 rounded-xl shrink-0 ${badge.bg} border ${badge.border}`}>
                      <CategoryIcon className={`w-4 h-4 ${badge.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold ${badge.text} truncate`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-[#5f6368] shrink-0">{timeAgo}</span>
                      </div>

                      <h4
                        className={`text-xs mt-0.5 truncate ${
                          !n.read ? 'font-bold text-[#1f1f1f]' : 'text-[#444746]'
                        }`}
                      >
                        {n.title}
                      </h4>
                      <p className="text-[11px] text-[#5f6368] line-clamp-2 mt-0.5 leading-snug">
                        {n.message}
                      </p>

                      {n.actionTab && (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#1a73e8] group-hover:underline flex items-center gap-1">
                            {n.actionText || 'View'} <ArrowRight className="w-3 h-3" />
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(n.id);
                            }}
                            className="text-[#5f6368] hover:text-[#d93025] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[#1a73e8] shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 bg-[#f8fafd] border-t border-[#f1f3f4] flex items-center justify-between">
            <button
              onClick={triggerTestNotification}
              className="text-xs font-semibold text-[#1a73e8] hover:text-[#1557b0] flex items-center gap-1.5 cursor-pointer hover:underline"
            >
              <Zap className="w-3.5 h-3.5" /> Simulate Incoming Alert
            </button>
            
            <button
              onClick={() => {
                setShowSettingsModal(true);
                setIsOpen(false);
              }}
              className="text-xs text-[#5f6368] hover:text-[#1f1f1f] flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" /> Settings
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
