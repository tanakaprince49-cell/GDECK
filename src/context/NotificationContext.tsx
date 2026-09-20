import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WorkspaceNotification, NotificationSettings, NotificationCategory } from '../types/notification';

interface NotificationContextType {
  notifications: WorkspaceNotification[];
  unreadCount: number;
  settings: NotificationSettings;
  activeToast: WorkspaceNotification | null;
  addNotification: (notification: Omit<WorkspaceNotification, 'id' | 'timestamp' | 'read'> & { tag?: string }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  dismissToast: () => void;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  requestDesktopPermission: () => Promise<boolean>;
  triggerTestNotification: () => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enableDesktopPush: false,
  enableSound: true,
  notifyGmail: true,
  notifyCalendar: true,
  notifyDrive: true,
  notifyTasks: true,
  notifyGPilot: true,
  notifyBilling: true,
  pollingIntervalSeconds: 30,
};

const INITIAL_NOTIFICATIONS: WorkspaceNotification[] = [
  {
    id: 'notif-1',
    title: 'New Email: Quarterly Strategy Sync',
    message: 'Alex Rivera sent an update regarding Q4 OKRs and team deliverables.',
    category: 'gmail',
    priority: 'high',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    actionTab: 'gmail',
    actionText: 'Open Inbox',
    senderName: 'Alex Rivera',
  },
  {
    id: 'notif-[#2]',
    title: 'Upcoming Meeting in 15 mins',
    message: 'Product Roadmap Review with Engineering & Design leads on Google Meet.',
    category: 'calendar',
    priority: 'urgent',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    read: false,
    actionTab: 'calendar',
    actionText: 'Join Meet',
  },
  {
    id: 'notif-3',
    title: 'File Shared: 2026 Financial Forecast.xlsx',
    message: 'Sarah Jenkins granted you editor access to 2026 Financial Forecast.',
    category: 'drive',
    priority: 'normal',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: true,
    actionTab: 'drive',
    actionText: 'View in Drive',
    senderName: 'Sarah Jenkins',
  },
  {
    id: 'notif-4',
    title: 'Task Due Today: Review Design Prototypes',
    message: 'High priority task assigned by G-Pilot assistant.',
    category: 'tasks',
    priority: 'high',
    timestamp: new Date(Date.now() - 2 * 360 * 1000).toISOString(),
    read: true,
    actionTab: 'tasks',
    actionText: 'View Tasks',
  },
  {
    id: 'notif-5',
    title: 'G-Pilot Assistant Digest',
    message: 'Your schedule today is 80% clear. 3 pending emails require your response.',
    category: 'gpilot',
    priority: 'normal',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    read: true,
    actionTab: 'overview',
    actionText: 'Ask G-Pilot',
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Web Audio API gentle notification chime
const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const now = ctx.currentTime;
    
    // First tone (E5 - 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone (B5 - 987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.1, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch {
    // Audio context prevented or unsupported
  }
};

export const NotificationProvider: React.FC<{ children: ReactNode; token?: string | null }> = ({ children, token }) => {
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>(() => {
    try {
      const saved = localStorage.getItem('gdeck_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem('gdeck_notification_settings');
      if (!saved) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(saved);
      // Backfill keys added after the settings shape shipped.
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [activeToast, setActiveToast] = useState<WorkspaceNotification | null>(null);

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gdeck_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gdeck_notification_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Request browser desktop push permission
  const requestDesktopPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setSettings((prev) => ({ ...prev, enableDesktopPush: granted }));
      return granted;
    } catch {
      return false;
    }
  }, []);

  // Add a new notification
  const addNotification = useCallback(
    (newNotifData: Omit<WorkspaceNotification, 'id' | 'timestamp' | 'read'> & { tag?: string }) => {
      // Honour per-category mute switches.
      if (newNotifData.category === 'gmail' && !settings.notifyGmail) return;
      if (newNotifData.category === 'calendar' && !settings.notifyCalendar) return;
      if (newNotifData.category === 'drive' && !settings.notifyDrive) return;
      if (newNotifData.category === 'tasks' && !settings.notifyTasks) return;
      if (newNotifData.category === 'gpilot' && !settings.notifyGPilot) return;
      if (newNotifData.category === 'billing' && !settings.notifyBilling) return;

      const { tag: desktopTag, ...rest } = newNotifData as typeof newNotifData & { tag?: string };
      const newNotif: WorkspaceNotification = {
        ...rest,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev].slice(0, 100));
      setActiveToast(newNotif);

      // Sound feedback
      if (settings.enableSound) {
        playNotificationChime();
      }

      // Browser Desktop Push Notification (page-level; fires while G-Deck is open)
      if (settings.enableDesktopPush && 'Notification' in window && Notification.permission === 'granted') {
        const logoMap: Record<string, string> = {
          gmail: '/logos/gmail.svg',
          calendar: '/logos/calendar.svg',
          drive: '/logos/drive.svg',
          tasks: '/logos/tasks.svg',
          meet: '/logos/meet.svg',
          docs: '/logos/docs.svg',
          sheets: '/logos/sheets.svg',
          slides: '/logos/slides.svg',
          forms: '/logos/forms.svg',
          chat: '/logos/chat.svg',
          keep: '/logos/keep.svg',
          billing: '/favicon.ico',
          system: '/favicon.ico',
          gpilot: '/favicon.ico',
        };
        try {
          const opts: NotificationOptions & { renotify?: boolean } = {
            body: newNotif.message,
            icon: logoMap[newNotif.category] || '/favicon.ico',
            tag: desktopTag || `gdeck-${newNotif.category}`,
            renotify: newNotif.category === 'billing',
            requireInteraction: newNotif.category === 'billing' || newNotif.priority === 'urgent',
          };
          const n = new Notification(newNotif.title, opts);
          n.onclick = () => {
            try {
              window.focus();
              if (newNotif.actionTab === 'upgrade' || newNotif.category === 'billing') {
                window.dispatchEvent(
                  new CustomEvent('gdeck_open_upgrade', {
                    detail: { isRenewal: true, source: 'desktop-notification' },
                  })
                );
              } else if (newNotif.actionTab) {
                window.dispatchEvent(
                  new CustomEvent('gdeck_navigate_tab', { detail: { tab: newNotif.actionTab } })
                );
              }
            } catch {}
            try { n.close(); } catch {}
          };
        } catch {}
      }
    },
    [settings]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Real Workspace Polling when token is available
  useEffect(() => {
    if (!token) return;

    const checkRealWorkspaceActivity = async () => {
      try {
        // Poll Unread Gmail Messages count
        if (settings.notifyGmail) {
          const res = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=1',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.status === 401) {
            window.dispatchEvent(new CustomEvent('gdeck_auth_expired', { detail: { message: 'Gmail authentication expired.' } }));
            return;
          }
          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              const msgId = data.messages[0].id;
              // Check if already notified
              const savedLastId = localStorage.getItem('gdeck_last_notified_gmail_id');
              if (savedLastId !== msgId) {
                localStorage.setItem('gdeck_last_notified_gmail_id', msgId);
                
                // Get detail
                const detailRes = await fetch(
                  `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                if (detailRes.status === 401) {
                  window.dispatchEvent(new CustomEvent('gdeck_auth_expired', { detail: { message: 'Gmail authentication expired.' } }));
                  return;
                }
                if (detailRes.ok) {
                  const detail = await detailRes.json();
                  const headers = detail.payload?.headers || [];
                  const subjectHeader = headers.find((h: any) => h.name === 'Subject')?.value || 'New Email';
                  const fromHeader = headers.find((h: any) => h.name === 'From')?.value || 'Google Workspace';
                  
                  addNotification({
                    title: `Gmail: ${subjectHeader}`,
                    message: `From: ${fromHeader}. Click to open in Gmail view.`,
                    category: 'gmail',
                    priority: 'high',
                    actionTab: 'gmail',
                    actionText: 'Read Email',
                    senderName: fromHeader,
                  });
                }
              }
            }
          }
        }

        // Poll Upcoming Calendar Events
        if (settings.notifyCalendar) {
          const nowIso = new Date().toISOString();
          const in15MinIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          const calRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
              nowIso
            )}&timeMax=${encodeURIComponent(in15MinIso)}&singleEvents=true`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (calRes.status === 401) {
            window.dispatchEvent(new CustomEvent('gdeck_auth_expired', { detail: { message: 'Calendar authentication expired.' } }));
            return;
          }
          if (calRes.ok) {
            const calData = await calRes.json();
            if (calData.items && calData.items.length > 0) {
              const event = calData.items[0];
              const savedLastCalId = localStorage.getItem('gdeck_last_notified_cal_id');
              if (savedLastCalId !== event.id) {
                localStorage.setItem('gdeck_last_notified_cal_id', event.id);
                addNotification({
                  title: `Calendar Alert: ${event.summary || 'Upcoming Meeting'}`,
                  message: `Starting soon (${event.location || 'Google Meet'}).`,
                  category: 'calendar',
                  priority: 'urgent',
                  actionTab: 'calendar',
                  actionText: 'View Event',
                });
              }
            }
          }
        }
      } catch (err) {
        console.debug('Polling background error:', err);
      }
    };

    // Initial check
    checkRealWorkspaceActivity();
    const interval = setInterval(checkRealWorkspaceActivity, settings.pollingIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [token, settings.pollingIntervalSeconds, settings.notifyGmail, settings.notifyCalendar, addNotification]);

  // Demo Trigger for testing notifications on demand
  const triggerTestNotification = useCallback(() => {
    const samples: (Omit<WorkspaceNotification, 'id' | 'timestamp' | 'read'> & { tag?: string })[] = [
      {
        title: 'New Email: Project Milestone Approved',
        message: 'Marcus Thorne approved the revised Q4 deliverables budget in Gmail.',
        category: 'gmail',
        priority: 'high',
        actionTab: 'gmail',
        actionText: 'Open Email',
        senderName: 'Marcus Thorne',
      },
      {
        title: 'Google Calendar: Team Sync in 10 mins',
        message: 'Weekly Engineering & Product sync is starting on Google Meet.',
        category: 'calendar',
        priority: 'urgent',
        actionTab: 'calendar',
        actionText: 'Join Meeting',
      },
      {
        title: 'Google Drive: New Comment on Doc',
        message: 'Elena Vance commented on "2026 Strategy Presentation.gslides"',
        category: 'drive',
        priority: 'normal',
        actionTab: 'drive',
        actionText: 'View Comments',
        senderName: 'Elena Vance',
      },
      {
        title: 'Google Tasks: Deadline Reminder',
        message: 'Task "Review Security Audit Report" is due in 2 hours.',
        category: 'tasks',
        priority: 'high',
        actionTab: 'tasks',
        actionText: 'Open Tasks',
      },
      {
        title: 'G-Pilot Assistant Recommendation',
        message: 'You have 3 overlapping meetings tomorrow. Would you like me to reschedule?',
        category: 'gpilot',
        priority: 'normal',
        actionTab: 'overview',
        actionText: 'Ask Assistant',
      },
      {
        title: 'Pro renews in 2 days',
        message: 'Your G-Deck Pro period ends soon. Renew now so unlimited AI stays on.',
        category: 'billing',
        priority: 'high',
        actionTab: 'upgrade',
        actionText: 'Renew Pro',
        tag: 'gdeck-pro-renewal',
      },
    ];

    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    addNotification(randomSample);
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        settings,
        activeToast,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        dismissToast,
        updateSettings,
        requestDesktopPermission,
        triggerTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
