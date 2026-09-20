export interface WorkspaceUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  starred?: boolean;
  trashed?: boolean;
  shared?: boolean;
  owners?: { displayName?: string; emailAddress?: string; photoLink?: string; me?: boolean }[];
  parents?: string[];
}

export interface DriveStorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
  user?: { displayName?: string; emailAddress?: string; photoLink?: string };
}

export interface GmailAttachment {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
  data?: string;
}

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet?: string;
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  body?: string;
  bodyText?: string;
  htmlBody?: string;
  isStarred?: boolean;
  isUnread?: boolean;
  labelIds?: string[];
  attachments?: GmailAttachment[];
  hasAttachments?: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  htmlLink?: string;
  status?: string;
  colorId?: string;
  hangoutLink?: string;
  conferenceData?: any;
  attendees?: { email?: string; displayName?: string; responseStatus?: string }[];
}

export interface TaskList {
  id: string;
  title: string;
  updated?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated?: string;
}

export interface ChatSpace {
  name: string; // "spaces/{spaceId}"
  displayName?: string;
  type?: string;
  spaceType?: string;
  description?: string;
  memberCount?: number;
  unreadCount?: number;
  lastMessageSnippet?: string;
  lastMessageTime?: string;
  isDirectMessage?: boolean;
  userAvatar?: string;
  status?: 'active' | 'away' | 'offline';
}

export interface ChatMessage {
  name?: string;
  text?: string;
  createTime?: string;
  sender?: {
    name?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  reactions?: Record<string, number>;
  userReactions?: string[];
  meetingUri?: string;
  attachmentName?: string;
  isPinned?: boolean;
}

export interface ContactPerson {
  resourceName: string;
  etag?: string;
  names?: Array<{ displayName?: string; familyName?: string; givenName?: string }>;
  emailAddresses?: Array<{ value?: string; type?: string }>;
  phoneNumbers?: Array<{ value?: string; type?: string }>;
  photos?: Array<{ url?: string }>;
}

export interface MeetSpace {
  name: string; // "spaces/{spaceId}"
  meetingUri: string;
  meetingCode: string;
  config?: {
    accessType?: string;
  };
}

export interface FormItem {
  itemId: string;
  title?: string;
  description?: string;
  questionItem?: {
    question?: {
      questionId?: string;
      required?: boolean;
    };
  };
}

export interface FormDetails {
  formId: string;
  info: {
    title: string;
    documentTitle?: string;
    description?: string;
  };
  items?: FormItem[];
  responderUri?: string;
}

export interface FormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers?: Record<string, {
    questionId: string;
    textAnswers?: {
      answers: Array<{ value: string }>;
    };
  }>;
}

export interface SheetMetadata {
  spreadsheetId: string;
  properties: {
    title: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      gridProperties?: {
        rowCount: number;
        columnCount: number;
      };
    };
  }>;
}
