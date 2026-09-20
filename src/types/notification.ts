export type NotificationCategory =
  | 'gmail'
  | 'calendar'
  | 'drive'
  | 'tasks'
  | 'meet'
  | 'docs'
  | 'sheets'
  | 'slides'
  | 'forms'
  | 'chat'
  | 'keep'
  | 'gpilot'
  | 'system'
  | 'billing';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface WorkspaceNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: Date | string;
  read: boolean;
  actionTab?: string;
  actionText?: string;
  avatarUrl?: string;
  senderName?: string;
}

export interface NotificationSettings {
  enableDesktopPush: boolean;
  enableSound: boolean;
  notifyGmail: boolean;
  notifyCalendar: boolean;
  notifyDrive: boolean;
  notifyTasks: boolean;
  notifyGPilot: boolean;
  /** Daily Pro renewal reminders in the last 3 days of a paid period. */
  notifyBilling: boolean;
  pollingIntervalSeconds: number;
}
