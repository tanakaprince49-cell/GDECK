import React, { useEffect } from 'react';
import { X, Mail, Calendar, HardDrive, CheckSquare, Video, Sparkles, Bell, ArrowRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { NotificationCategory } from '../types/notification';

interface NotificationToastProps {
  onNavigateTab?: (tab: string) => void;
}

const getCategoryIcon = (category: NotificationCategory) => {
  switch (category) {
    case 'gmail':
      return <Mail className="w-5 h-5 text-[#ea4335]" />;
    case 'calendar':
      return <Calendar className="w-5 h-5 text-[#4285f4]" />;
    case 'drive':
      return <HardDrive className="w-5 h-5 text-[#fbbc04]" />;
    case 'tasks':
      return <CheckSquare className="w-5 h-5 text-[#34a853]" />;
    case 'meet':
      return <Video className="w-5 h-5 text-[#00832d]" />;
    case 'gpilot':
      return <Sparkles className="w-5 h-5 text-[#1a73e8]" />;
    default:
      return <Bell className="w-5 h-5 text-[#5f6368]" />;
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

  const handleAction = () => {
    markAsRead(activeToast.id);
    if (activeToast.actionTab && onNavigateTab) {
      onNavigateTab(activeToast.actionTab);
    }
    dismissToast();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl border border-[#dadce0] shadow-[0_8px_30px_rgba(60,64,67,0.2)] p-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="p-2.5 rounded-xl bg-[#f8fafd] border border-[#dadce0] shrink-0">
          {getCategoryIcon(activeToast.category)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded-full border border-[#d2e3fc]">
              {activeToast.category}
            </span>
            <span className="text-[10px] text-[#5f6368]">Just now</span>
          </div>

          <h4 className="text-xs font-bold text-[#1f1f1f] mt-1 truncate">
            {activeToast.title}
          </h4>
          <p className="text-xs text-[#5f6368] mt-0.5 line-clamp-2 leading-relaxed">
            {activeToast.message}
          </p>

          {activeToast.actionTab && (
            <button
              onClick={handleAction}
              className="mt-2.5 px-3 py-1.5 text-xs font-semibold text-[#1a73e8] hover:bg-[#e8f0fe] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{activeToast.actionText || 'View Details'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={dismissToast}
          className="p-1 text-[#5f6368] hover:text-[#1f1f1f] rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
