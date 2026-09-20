import React from 'react';

export interface GoogleIconProps {
  className?: string;
  alt?: string;
}

export const GoogleLogo: React.FC<GoogleIconProps> = ({ className = 'w-6 h-6', alt = 'Google' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`inline-block object-contain shrink-0 ${className}`}
    aria-label={alt}
    role="img"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export const GPilotIcon: React.FC<GoogleIconProps> = ({ className = 'w-6 h-6', alt = 'G-Pilot AI' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block object-contain shrink-0 ${className}`}
    aria-label={alt}
    role="img"
  >
    {/* Clean, authentic Google Gemini 4-pointed Star Gradient Sparkle */}
    <defs>
      <linearGradient id="gemini_gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1A73E8" />
        <stop offset="50%" stopColor="#8AB4F8" />
        <stop offset="100%" stopColor="#9334E8" />
      </linearGradient>
    </defs>
    <path
      d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
      fill="url(#gemini_gradient)"
    />
    <path
      d="M19 18C19 19.66 17.66 21 16 21C17.66 21 19 22.34 19 24C19 22.34 20.34 21 22 21C20.34 21 19 19.66 19 18Z"
      fill="#4285F4"
      opacity="0.85"
    />
  </svg>
);

export const GoogleDriveIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Drive',
}) => (
  <img
    src="/logos/drive.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleSheetsIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Sheets',
}) => (
  <img
    src="/logos/sheets.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GmailIcon: React.FC<GoogleIconProps> = ({ className = 'w-6 h-6', alt = 'Gmail' }) => (
  <img
    src="/logos/gmail.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleCalendarIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Calendar',
}) => (
  <img
    src="/logos/calendar.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleTasksIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Tasks',
}) => (
  <img
    src="/logos/tasks.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleChatIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Chat',
}) => (
  <img
    src="/logos/chat.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleContactsIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Contacts',
}) => (
  <img
    src="/logos/contacts.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleMeetIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Meet',
}) => (
  <img
    src="/logos/meet.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleFormsIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Forms',
}) => (
  <img
    src="/logos/forms.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleKeepIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Keep',
}) => (
  <img
    src="/logos/keep.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleMessagesIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Messages',
}) => (
  <img
    src="/logos/messages.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleDocsIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Docs',
}) => (
  <img
    src="/logos/docs.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleSlidesIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Slides',
}) => (
  <img
    src="/logos/slides.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleDrawingsIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Drawings',
}) => (
  <img
    src="/logos/drawings.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleSitesIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Sites',
}) => (
  <img
    src="/logos/sites.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GooglePhotosIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Photos',
}) => (
  <img
    src="/logos/photos.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const YouTubeStudioIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'YouTube Studio',
}) => (
  <img
    src="/logos/youtube.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleAnalyticsIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Analytics',
}) => (
  <img
    src="/logos/analytics.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleSearchConsoleIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Search Console',
}) => (
  <img
    src="/logos/searchconsole.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleTrendsIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Trends',
}) => (
  <img
    src="/logos/trends.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleFinanceIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Finance',
}) => (
  <img
    src="/logos/finance.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleMapsIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Maps',
}) => (
  <img
    src="/logos/maps.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleTranslateIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Translate',
}) => (
  <img
    src="/logos/translate.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const GoogleClassroomIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'Google Classroom',
}) => (
  <img
    src="/logos/classroom.svg"
    alt={alt}
    className={`inline-block object-contain shrink-0 ${className}`}
  />
);

export const AIIcon: React.FC<GoogleIconProps> = ({
  className = 'w-6 h-6',
  alt = 'AI',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    role="img"
    aria-label={alt}
  >
    <defs>
      <linearGradient id="ai_sparkle_grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1A73E8" />
        <stop offset="60%" stopColor="#8AB4F8" />
        <stop offset="100%" stopColor="#9334E8" />
      </linearGradient>
    </defs>
    <path
      d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
      fill="url(#ai_sparkle_grad)"
    />
  </svg>
);

export const GOOGLE_ICONS_MAP: Record<string, React.FC<GoogleIconProps>> = {
  drive: GoogleDriveIcon,
  docs: GoogleDocsIcon,
  sheets: GoogleSheetsIcon,
  slides: GoogleSlidesIcon,
  drawings: GoogleDrawingsIcon,
  sites: GoogleSitesIcon,
  gmail: GmailIcon,
  messages: GoogleMessagesIcon,
  calendar: GoogleCalendarIcon,
  tasks: GoogleTasksIcon,
  chat: GoogleChatIcon,
  contacts: GoogleContactsIcon,
  meet: GoogleMeetIcon,
  forms: GoogleFormsIcon,
  keep: GoogleKeepIcon,
  photos: GooglePhotosIcon,
  youtube: YouTubeStudioIcon,
  analytics: GoogleAnalyticsIcon,
  searchconsole: GoogleSearchConsoleIcon,
  trends: GoogleTrendsIcon,
  finance: GoogleFinanceIcon,
  maps: GoogleMapsIcon,
  translate: GoogleTranslateIcon,
  classroom: GoogleClassroomIcon,
  google: GoogleLogo,
  ai: AIIcon,
};
