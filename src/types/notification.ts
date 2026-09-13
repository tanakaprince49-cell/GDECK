export type NotificationCategory = 'gmail' | 'calendar' | 'drive' | 'tasks' | 'meet' | 'gpilot' | 'system';

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
  pollingIntervalSeconds: number;
}
