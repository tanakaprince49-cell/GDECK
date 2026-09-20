import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  Inbox,
  Star,
  Send,
  Trash2,
  Tag,
  Users,
  Paperclip,
  Smile,
  HardDrive,
  Minimize2,
  Maximize2,
  ExternalLink,
  Printer,
  MailOpen,
  Mail,
  CornerUpLeft,
  CornerUpRight,
  Download,
  FileText,
  Image as ImageIcon,
  FileArchive,
  File,
  ArrowLeft,
  RotateCcw,
  Check,
  AlertCircle,
  Menu,
  Clock,
  FileEdit,
  Grid,
  ChevronDown,
  Link as LinkIcon,
  Lock,
  PenTool,
  MoreVertical,
} from 'lucide-react';
import { GmailMessageItem, GmailAttachment } from '../types/workspace';
import {
  listGmailMessages,
  getGmailMessageDetails,
  sendGmailMessage,
  trashGmailMessage,
  untrashGmailMessage,
  deleteGmailMessagePermanently,
  toggleGmailStar,
  markGmailReadStatus,
  downloadGmailAttachment,
  exportGmailMessageEml,
  OutgoingAttachment,
} from '../services/workspace';
import { ConfirmModal } from './ConfirmModal';
import { usePlan } from '../context/PlanContext';
import { ProBadge } from './ProBadge';
import { EmailToTaskEventModal } from './EmailToTaskEventModal';
import { DeepThreadSummaryModal } from './DeepThreadSummaryModal';
import { TonePolishStudioModal } from './TonePolishStudioModal';
import { Sparkles, Zap } from 'lucide-react';
import {
  GmailIcon,
  GoogleDriveIcon,
  GoogleDocsIcon,
  GoogleSheetsIcon,
  GoogleSlidesIcon,
  GoogleFormsIcon,
  GoogleCalendarIcon,
  GoogleTasksIcon,
  GoogleKeepIcon,
  GoogleMeetIcon,
} from './GoogleIcons';

interface GmailViewProps {
  token: string;
  onBackToOverview?: () => void;
  onNavigateTab?: (tab: string) => void;
}

type MailFolder = 'inbox' | 'starred' | 'snoozed' | 'sent' | 'drafts' | 'trash';
type MailCategory = 'primary' | 'promotions' | 'social';

// Normal Clean Google Material 3 Checkbox (No solid dark boxes)
const GoogleCheckbox: React.FC<{
  checked: boolean;
  indeterminate?: boolean;
  onChange?: (e: React.MouseEvent) => void;
  className?: string;
  title?: string;
}> = ({ checked, indeterminate = false, onChange, className = '', title }) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(e);
      }}
      className={`w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-[3px] flex items-center justify-center transition-all cursor-pointer select-none shrink-0 ${
        checked || indeterminate
          ? 'bg-[#1a73e8] border-2 border-[#1a73e8] text-white shadow-2xs'
          : 'border-2 border-[#747775] hover:border-[#1f1f1f] bg-white hover:bg-[#f0f4f9]'
      } ${className}`}
    >
      {checked ? (
        <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
      ) : indeterminate ? (
        <div className="w-2.5 h-0.5 bg-white rounded-full" />
      ) : null}
    </button>
  );
};

// Render sanitized email body
const FormattedEmailBody: React.FC<{ body?: string; htmlBody?: string }> = ({ body, htmlBody }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (htmlBody && iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: Roboto, Arial, sans-serif;
                  font-size: 14px;
                  color: #202124;
                  line-height: 1.5;
                  margin: 0;
                  padding: 12px;
                  word-break: break-word;
                }
                img { max-width: 100%; height: auto; }
                a { color: #1a73e8; text-decoration: underline; }
                blockquote {
                  border-left: 2px solid #dadce0;
                  margin-left: 0;
                  padding-left: 12px;
                  color: #5f6368;
                }
              </style>
            </head>
            <body>${htmlBody}</body>
          </html>
        `);
        doc.close();

        // Auto-adjust iframe height
        const resizeIframe = () => {
          if (iframeRef.current && doc.body) {
            iframeRef.current.style.height = `${Math.max(doc.body.scrollHeight + 30, 200)}px`;
          }
        };
        resizeIframe();
        setTimeout(resizeIframe, 300);
      }
    }
  }, [htmlBody]);

  if (htmlBody) {
    return (
      <div className="w-full rounded-lg overflow-hidden border border-[#dadce0]/50 bg-white">
        <iframe
          ref={iframeRef}
          title="Email Content"
          sandbox="allow-same-origin allow-popups"
          className="w-full min-h-[300px] border-0"
        />
      </div>
    );
  }

  return (
    <div className="text-sm text-[#1f1f1f] leading-relaxed whitespace-pre-wrap font-sans p-4 bg-white rounded-lg border border-[#dadce0]/40">
      {body || '(Empty body)'}
    </div>
  );
};

// Helper for attachment icon
const getAttachmentIcon = (mimeType: string, filename: string) => {
  const name = filename.toLowerCase();
  if (mimeType.startsWith('image/') || name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.jpeg') || name.endsWith('.webp')) {
    return <ImageIcon className="w-5 h-5 text-[#ea4335]" />;
  }
  if (name.endsWith('.pdf') || mimeType.includes('pdf')) {
    return <FileText className="w-5 h-5 text-[#d93025]" />;
  }
  if (name.endsWith('.zip') || name.endsWith('.tar') || name.endsWith('.gz')) {
    return <FileArchive className="w-5 h-5 text-[#fbbc04]" />;
  }
  return <File className="w-5 h-5 text-[#1a73e8]" />;
};

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const GmailView: React.FC<GmailViewProps> = ({ token, onBackToOverview, onNavigateTab }) => {
  const [messages, setMessages] = useState<GmailMessageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Active folder & category
  const [activeFolder, setActiveFolder] = useState<MailFolder>('inbox');
  const [activeCategory, setActiveCategory] = useState<MailCategory>('primary');
  const [filterChips, setFilterChips] = useState<{ hasAttachment: boolean; unreadOnly: boolean }>({
    hasAttachment: false,
    unreadOnly: false,
  });

  // Selected message for details preview
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
  const [isExportingEml, setIsExportingEml] = useState<boolean>(false);

  // Selection list for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Floating Compose state (docked bottom-right like real Gmail)
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [isComposeMinimized, setIsComposeMinimized] = useState<boolean>(false);
  const [isComposeExpanded, setIsComposeExpanded] = useState<boolean>(false);
  const [toRecipient, setToRecipient] = useState<string>('');
  const [ccRecipient, setCcRecipient] = useState<string>('');
  const [bccRecipient, setBccRecipient] = useState<string>('');
  const [showCc, setShowCc] = useState<boolean>(false);
  const [showBcc, setShowBcc] = useState<boolean>(false);
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [composeAttachments, setComposeAttachments] = useState<OutgoingAttachment[]>([]);
  const [showFormatting, setShowFormatting] = useState<boolean>(false);
  const [showScheduleDropdown, setShowScheduleDropdown] = useState<boolean>(false);
  const [isConfidential, setIsConfidential] = useState<boolean>(false);
  const [showSendConfirm, setShowSendConfirm] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // File input ref for compose attachments
  const composeFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  // Trash & delete modal
  const [trashTarget, setTrashTarget] = useState<GmailMessageItem | null>(null);
  const [isTrashing, setIsTrashing] = useState<boolean>(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<GmailMessageItem | null>(null);

  // Inline quick reply state
  const [inlineReplyText, setInlineReplyText] = useState<string>('');
  const [inlineReplyAttachments, setInlineReplyAttachments] = useState<OutgoingAttachment[]>([]);
  const [isSendingQuickReply, setIsSendingQuickReply] = useState<boolean>(false);

  // Pro Features State
  const { isPro, requirePro } = usePlan();
  const [magicEmailToTaskModalOpen, setMagicEmailToTaskModalOpen] = useState<boolean>(false);
  const [deepThreadSummaryModalOpen, setDeepThreadSummaryModalOpen] = useState<boolean>(false);
  const [tonePolishModalOpen, setTonePolishModalOpen] = useState<boolean>(false);
  const [tonePolishTarget, setTonePolishTarget] = useState<'reply' | 'compose'>('reply');

  const handleOpenMagicEmailToTask = (msg: GmailMessageItem) => {
    if (
      !requirePro(
        '1-Click Email to Task/Event',
        'Automatically create a scheduled Google Calendar event and a Google Task with the meeting link pre-attached.'
      )
    ) {
      return;
    }
    setMagicEmailToTaskModalOpen(true);
  };

  const handleOpenDeepSummary = (msg: GmailMessageItem) => {
    if (
      !requirePro(
        'Deep Email Thread Summarization',
        'Instant TL;DR bullet points and action items for long email threads.'
      )
    ) {
      return;
    }
    setDeepThreadSummaryModalOpen(true);
  };

  const handleOpenTonePolish = (target: 'reply' | 'compose') => {
    if (
      !requirePro(
        'Tone & Polish Studio',
        '1-click rewrite drafts for executive, casual, or formal tones.'
      )
    ) {
      return;
    }
    setTonePolishTarget(target);
    setTonePolishModalOpen(true);
  };

  const loadMessages = async (folder = activeFolder, query = searchQuery, category = activeCategory) => {
    setLoading(true);
    setError(null);
    try {
      const msgs = await listGmailMessages(token, 25, query, folder, category);
      setMessages(msgs);
    } catch (err: any) {
      setError(err.message || 'Failed to load Gmail messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(activeFolder, searchQuery, activeCategory);
  }, [token, activeFolder, activeCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMessages(activeFolder, searchQuery, activeCategory);
  };

  const handleOpenMessage = async (item: GmailMessageItem) => {
    setSelectedMessage(item);
    setLoadingDetails(true);
    try {
      const detailed = await getGmailMessageDetails(token, item.id);
      setSelectedMessage(detailed);
      // Mark read automatically if unread
      if (item.isUnread) {
        markGmailReadStatus(token, item.id, true).catch(() => {});
        setMessages((prev) => prev.map((m) => (m.id === item.id ? { ...m, isUnread: false } : m)));
      }
    } catch (err: any) {
      console.error('Failed to get message details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleStar = async (msg: GmailMessageItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStarred = !msg.isStarred;
    try {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isStarred: newStarred } : m))
      );
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage({ ...selectedMessage, isStarred: newStarred });
      }
      await toggleGmailStar(token, msg.id, !newStarred);
    } catch (err: any) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleMarkAsUnread = async (msg: GmailMessageItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newUnread = !msg.isUnread;
    try {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isUnread: newUnread } : m))
      );
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage({ ...selectedMessage, isUnread: newUnread });
      }
      await markGmailReadStatus(token, msg.id, !newUnread);
      setSuccessMsg(newUnread ? 'Marked as unread' : 'Marked as read');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      console.error('Failed to update read status:', err);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMessages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMessages.map((m) => m.id));
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Compose file upload handler
  const handleFileUpload = (files: FileList | null, isQuickReply = false) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        // Strip data:mime/type;base64, prefix
        const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
        const newAtt: OutgoingAttachment = {
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          base64Data,
        };

        if (isQuickReply) {
          setInlineReplyAttachments((prev) => [...prev, newAtt]);
        } else {
          setComposeAttachments((prev) => [...prev, newAtt]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Download attachment
  const handleDownloadAttachment = async (att: GmailAttachment) => {
    if (!selectedMessage) return;
    setDownloadingAttachmentId(att.attachmentId || att.filename);
    try {
      const res = await downloadGmailAttachment(
        token,
        selectedMessage.id,
        att.attachmentId,
        att.filename,
        att.mimeType,
        att.data
      );
      setSuccessMsg(`Downloaded ${res.filename}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to download attachment');
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  // Export full email as .eml
  const handleExportEml = async () => {
    if (!selectedMessage) return;
    setIsExportingEml(true);
    try {
      const res = await exportGmailMessageEml(token, selectedMessage.id, selectedMessage.subject);
      setSuccessMsg(`Exported ${res.filename}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to export email');
    } finally {
      setIsExportingEml(false);
    }
  };

  const handleReplyToMessage = (msg: GmailMessageItem) => {
    let recipientEmail = msg.from || '';
    const match = recipientEmail.match(/<([^>]+)>/);
    if (match) recipientEmail = match[1];

    const replySubject = msg.subject?.startsWith('Re:')
      ? msg.subject
      : `Re: ${msg.subject || ''}`;

    setToRecipient(recipientEmail);
    setEmailSubject(replySubject);
    setEmailBody(`\n\n--- Original Message ---\nFrom: ${msg.from}\nDate: ${msg.date}\n\n${msg.body || msg.snippet || ''}`);
    setIsComposeOpen(true);
    setIsComposeMinimized(false);
  };

  const handleSendQuickReply = async () => {
    if (!selectedMessage || !inlineReplyText.trim()) return;
    setIsSendingQuickReply(true);
    let recipientEmail = selectedMessage.from || '';
    const match = recipientEmail.match(/<([^>]+)>/);
    if (match) recipientEmail = match[1];

    const replySubject = selectedMessage.subject?.startsWith('Re:')
      ? selectedMessage.subject
      : `Re: ${selectedMessage.subject || ''}`;

    try {
      await sendGmailMessage(token, recipientEmail, replySubject, inlineReplyText.trim(), inlineReplyAttachments);
      setSuccessMsg(`Reply sent to ${recipientEmail}`);
      setInlineReplyText('');
      setInlineReplyAttachments([]);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setIsSendingQuickReply(false);
    }
  };

  const handleConfirmSend = async () => {
    setIsSending(true);
    try {
      await sendGmailMessage(token, toRecipient, emailSubject, emailBody, composeAttachments);
      setSuccessMsg(`Email sent to ${toRecipient}`);
      setShowSendConfirm(false);
      setIsComposeOpen(false);
      setToRecipient('');
      setEmailSubject('');
      setEmailBody('');
      setComposeAttachments([]);
      loadMessages();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmTrash = async () => {
    if (!trashTarget) return;
    setIsTrashing(true);
    try {
      await trashGmailMessage(token, trashTarget.id);
      setMessages((prev) => prev.filter((m) => m.id !== trashTarget.id));
      if (selectedMessage?.id === trashTarget.id) {
        setSelectedMessage(null);
      }
      setTrashTarget(null);
      setSuccessMsg('Email moved to Trash');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to move message to trash');
    } finally {
      setIsTrashing(false);
    }
  };

  const handleRestoreFromTrash = async (msg: GmailMessageItem) => {
    try {
      await untrashGmailMessage(token, msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage(null);
      }
      setSuccessMsg('Restored email to Inbox');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to restore message');
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteTarget) return;
    try {
      await deleteGmailMessagePermanently(token, permanentDeleteTarget.id);
      setMessages((prev) => prev.filter((m) => m.id !== permanentDeleteTarget.id));
      if (selectedMessage?.id === permanentDeleteTarget.id) {
        setSelectedMessage(null);
      }
      setPermanentDeleteTarget(null);
      setSuccessMsg('Email permanently deleted');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to permanently delete email');
    }
  };

  // Filter messages based on chips
  const filteredMessages = messages.filter((msg) => {
    if (filterChips.hasAttachment && !msg.hasAttachments && !msg.snippet?.toLowerCase().includes('attach')) {
      return false;
    }
    if (filterChips.unreadOnly && !msg.isUnread) {
      return false;
    }
    return true;
  });

  return (
    <div id="gmail-view" className="flex flex-col h-[calc(100vh-5.5rem)] bg-[#f6f8fc] rounded-2xl overflow-hidden border border-[#dadce0] font-['Google_Sans',Roboto,sans-serif] shadow-sm relative">
      {/* AUTHENTIC GMAIL TOP SEARCH & LOGO BAR */}
      <header className="h-16 px-3 sm:px-6 bg-[#f6f8fc] border-b border-[#dadce0]/80 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer md:hidden"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
              title="Back to Overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={onBackToOverview}>
            <GmailIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-[20px] sm:text-[22px] font-normal text-[#444746] tracking-tight hidden sm:inline">Gmail</span>
          </div>
        </div>

        {/* Real Gmail Search Box with Clear Button */}
        <div className="flex-1 max-w-2xl mx-1 sm:mx-2">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#5f6368] absolute left-3.5 pointer-events-none" />
            <input
              id="gmail-search-input"
              type="text"
              placeholder="Search in mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 sm:h-11 pl-10 sm:pl-12 pr-9 bg-[#eaf1fb] hover:bg-[#e1eaf5] focus:bg-white text-xs sm:text-sm text-[#1f1f1f] rounded-full border border-transparent focus:border-[#dadce0] focus:shadow-md outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadMessages(activeFolder, '', activeCategory);
                }}
                className="absolute right-3 p-1 text-[#5f6368] hover:text-[#1f1f1f] rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={() => loadMessages(activeFolder, searchQuery, activeCategory)}
            disabled={loading}
            className="p-2 sm:p-2.5 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
            title="Refresh mail"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin text-[#1a73e8]' : ''}`} />
          </button>
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:p-2.5 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer hidden sm:block"
            title="Open in official Gmail web app"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-[300px] max-w-[85vw] bg-[#f6f8fc] h-full shadow-2xl p-4 flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#dadce0]">
                <div className="flex items-center gap-2">
                  <GmailIcon className="w-7 h-7" />
                  <span className="text-lg font-medium text-[#444746]">Gmail</span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 hover:bg-[#e8eaed] rounded-full text-[#5f6368] cursor-pointer"
                  title="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Big Compose Pill Button for Mobile */}
              <button
                id="mobile-drawer-compose-btn"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsComposeOpen(true);
                  setIsComposeMinimized(false);
                }}
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-[#c2e7ff] hover:bg-[#b3defa] active:bg-[#a0d2f8] text-[#001d35] rounded-2xl font-semibold text-sm transition-all shadow-xs cursor-pointer select-none"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
                <span>Compose Email</span>
              </button>

              {/* Mail Folders */}
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Mail Folders</p>
                <nav className="space-y-0.5">
                  {[
                    { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4" />, count: messages.length },
                    { id: 'starred', label: 'Starred', icon: <Star className="w-4 h-4" /> },
                    { id: 'sent', label: 'Sent', icon: <Send className="w-4 h-4" /> },
                    { id: 'trash', label: 'Trash', icon: <Trash2 className="w-4 h-4" /> },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setActiveFolder(f.id as MailFolder);
                        setSelectedMessage(null);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        activeFolder === f.id
                          ? 'bg-[#d3e3fd] text-[#041e49] font-bold'
                          : 'text-[#444746] hover:bg-[#e8eaed]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {f.icon}
                        <span>{f.label}</span>
                      </div>
                      {f.count !== undefined && activeFolder === 'inbox' && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#c2e7ff] text-[#001d35]">{f.count}</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Mail Categories */}
              <div className="space-y-1 pt-2 border-t border-[#dadce0]/70">
                <p className="px-3 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Categories</p>
                <div className="space-y-0.5">
                  {[
                    { id: 'primary', label: 'Primary', icon: <Inbox className="w-4 h-4 text-[#1a73e8]" /> },
                    { id: 'promotions', label: 'Promotions', icon: <Tag className="w-4 h-4 text-[#188038]" /> },
                    { id: 'social', label: 'Social', icon: <Users className="w-4 h-4 text-[#1a73e8]" /> },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id as MailCategory);
                        setActiveFolder('inbox');
                        setSelectedMessage(null);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        activeCategory === cat.id && activeFolder === 'inbox'
                          ? 'bg-[#e8f0fe] text-[#1a73e8] font-bold'
                          : 'text-[#444746] hover:bg-[#e8eaed]'
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Other Features & Workspace Apps Switcher */}
              {onNavigateTab && (
                <div className="space-y-1 pt-2 border-t border-[#dadce0]/70">
                  <p className="px-3 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Google Workspace Apps</p>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {[
                      { id: 'drive', label: 'Drive', icon: <GoogleDriveIcon className="w-4 h-4" /> },
                      { id: 'docs', label: 'Docs', icon: <GoogleDocsIcon className="w-4 h-4" /> },
                      { id: 'sheets', label: 'Sheets', icon: <GoogleSheetsIcon className="w-4 h-4" /> },
                      { id: 'calendar', label: 'Calendar', icon: <GoogleCalendarIcon className="w-4 h-4" /> },
                      { id: 'slides', label: 'Slides', icon: <GoogleSlidesIcon className="w-4 h-4" /> },
                      { id: 'forms', label: 'Forms', icon: <GoogleFormsIcon className="w-4 h-4" /> },
                      { id: 'tasks', label: 'Tasks', icon: <GoogleTasksIcon className="w-4 h-4" /> },
                      { id: 'meet', label: 'Meet', icon: <GoogleMeetIcon className="w-4 h-4" /> },
                    ].map((app) => (
                      <button
                        key={app.id}
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          onNavigateTab(app.id);
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl text-xs text-[#444746] hover:bg-[#e8eaed] font-medium transition-colors cursor-pointer"
                      >
                        {app.icon}
                        <span className="truncate">{app.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Google Storage Info */}
            <div className="p-3 bg-white rounded-2xl border border-[#dadce0] text-[11px] text-[#5f6368] space-y-1.5 mt-4">
              <div className="flex justify-between font-medium">
                <span>Google Storage</span>
                <span className="text-[#1a73e8] font-semibold">15 GB Plan</span>
              </div>
              <div className="w-full h-1.5 bg-[#e0e2ec] rounded-full overflow-hidden">
                <div className="w-[28%] h-full bg-[#1a73e8] rounded-full" />
              </div>
              <p className="text-[10px] text-[#747775]">4.2 GB of 15 GB used</p>
            </div>
          </div>
        </div>
      )}

      {/* ERROR & SUCCESS NOTIFICATIONS */}
      {error && (
        <div className="px-6 py-2 bg-[#fce8e6] border-b border-[#f5c2c7] text-[#c5221f] text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</span>
          <button onClick={() => setError(null)} className="underline cursor-pointer">Dismiss</button>
        </div>
      )}
      {successMsg && (
        <div className="px-6 py-2 bg-[#e6f4ea] border-b border-[#b7e1cd] text-[#137333] text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* MAIN TWO-PANE BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* AUTHENTIC GMAIL LEFT SIDEBAR DRAWER */}
        <aside className="w-60 shrink-0 p-3 flex flex-col justify-between hidden md:flex bg-[#f6f8fc]">
          <div className="space-y-4">
            {/* Big Google Material 3 Compose Pill Button */}
            <button
              id="compose-email-btn"
              onClick={() => {
                setIsComposeOpen(true);
                setIsComposeMinimized(false);
              }}
              className="inline-flex items-center gap-3 px-6 py-4 bg-[#c2e7ff] hover:bg-[#b3defa] hover:shadow-md active:bg-[#a0d2f8] text-[#001d35] rounded-2xl font-semibold text-sm transition-all shadow-xs cursor-pointer select-none"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              <span>Compose</span>
            </button>

            {/* Folder Navigation */}
            <nav className="space-y-0.5 pr-2">
              <button
                onClick={() => {
                  setActiveFolder('inbox');
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-r-full text-xs font-semibold cursor-pointer transition-colors ${
                  activeFolder === 'inbox'
                    ? 'bg-[#d3e3fd] text-[#041e49] font-bold'
                    : 'text-[#444746] hover:bg-[#e8eaed]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </div>
                {activeFolder === 'inbox' && (
                  <span className="text-[11px] font-bold">{messages.length}</span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveFolder('starred');
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-r-full text-xs font-semibold cursor-pointer transition-colors ${
                  activeFolder === 'starred'
                    ? 'bg-[#d3e3fd] text-[#041e49] font-bold'
                    : 'text-[#444746] hover:bg-[#e8eaed]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Star className="w-4 h-4" />
                  <span>Starred</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveFolder('sent');
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-r-full text-xs font-semibold cursor-pointer transition-colors ${
                  activeFolder === 'sent'
                    ? 'bg-[#d3e3fd] text-[#041e49] font-bold'
                    : 'text-[#444746] hover:bg-[#e8eaed]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Send className="w-4 h-4" />
                  <span>Sent</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveFolder('trash');
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-r-full text-xs font-semibold cursor-pointer transition-colors ${
                  activeFolder === 'trash'
                    ? 'bg-[#d3e3fd] text-[#041e49] font-bold'
                    : 'text-[#444746] hover:bg-[#e8eaed]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Trash2 className="w-4 h-4" />
                  <span>Trash</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Real Google Storage Indicator */}
          <div className="p-3 bg-white/70 rounded-2xl border border-[#dadce0]/70 text-[11px] text-[#5f6368] space-y-1.5">
            <div className="flex justify-between font-medium">
              <span>Google Storage</span>
              <span className="text-[#1a73e8] font-semibold">15 GB Plan</span>
            </div>
            <div className="w-full h-1.5 bg-[#e0e2ec] rounded-full overflow-hidden">
              <div className="w-[28%] h-full bg-[#1a73e8] rounded-full" />
            </div>
            <p className="text-[10px] text-[#747775]">4.2 GB of 15 GB used</p>
          </div>
        </aside>

        {/* RIGHT MAIN WHITE WORKSPACE AREA */}
        <main className="flex-1 flex flex-col bg-white rounded-2xl m-2 overflow-hidden shadow-xs border border-[#dadce0]">
          {selectedMessage ? (
            /* AUTHENTIC READING THREAD VIEW */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Thread Action Toolbar */}
              <div className="h-12 px-4 border-b border-[#dadce0] flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                    title="Back to inbox"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {activeFolder === 'trash' ? (
                    <>
                      <button
                        onClick={() => handleRestoreFromTrash(selectedMessage)}
                        className="p-2 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full cursor-pointer"
                        title="Restore to Inbox"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPermanentDeleteTarget(selectedMessage)}
                        className="p-2 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full cursor-pointer"
                        title="Delete forever"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setTrashTarget(selectedMessage)}
                      className="p-2 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full cursor-pointer"
                      title="Move to Trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleStar(selectedMessage)}
                    className="p-2 text-[#fbbc04] hover:bg-[#fef7e0] rounded-full cursor-pointer"
                    title={selectedMessage.isStarred ? 'Unstar' : 'Star'}
                  >
                    <Star className={`w-4 h-4 ${selectedMessage.isStarred ? 'fill-[#fbbc04]' : 'text-[#5f6368]'}`} />
                  </button>

                  <button
                    onClick={() => handleMarkAsUnread(selectedMessage)}
                    className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                    title={selectedMessage.isUnread ? 'Mark as read' : 'Mark as unread'}
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Pro Magic Action: 1-Click Email to Task & Event */}
                  <button
                    onClick={() => handleOpenMagicEmailToTask(selectedMessage)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#7e22ce] bg-[#faf5ff] hover:bg-[#f3e8ff] rounded-full border border-[#e9d5ff] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="1-Click Convert email to scheduled Calendar event and Google Task"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current text-purple-600" />
                    <span>Convert to Task & Event</span>
                    <ProBadge size="xs" featureTitle="1-Click Email to Task & Event" />
                  </button>

                  {/* Pro Magic Action: Deep Thread TL;DR */}
                  <button
                    onClick={() => handleOpenDeepSummary(selectedMessage)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#1a73e8] bg-[#f0f4f9] hover:bg-[#e8f0fe] rounded-full border border-[#dadce0] flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Synthesize email thread highlights into executive bullets & action items"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current text-[#1a73e8]" />
                    <span>Thread TL;DR</span>
                    <ProBadge size="xs" featureTitle="Deep Email Thread Summarization" />
                  </button>

                  {/* Download Message as .eml file */}
                  <button
                    onClick={handleExportEml}
                    disabled={isExportingEml}
                    className="px-3 py-1.5 text-xs font-semibold text-[#444746] hover:bg-[#f0f4f9] rounded-full border border-[#dadce0] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Download raw email message (.eml)"
                  >
                    <Download className={`w-3.5 h-3.5 ${isExportingEml ? 'animate-bounce' : ''}`} />
                    <span>{isExportingEml ? 'Exporting...' : 'Download .eml'}</span>
                  </button>

                  <a
                    href={`https://mail.google.com/mail/u/0/#inbox/${selectedMessage.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open in Web</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => window.print()}
                    className="p-2 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                    title="Print"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thread Body Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Email Subject Title */}
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-xl font-medium text-[#1f1f1f] tracking-tight">
                    {selectedMessage.subject || '(No Subject)'}
                  </h1>
                  <span className="text-xs text-[#5f6368] bg-[#f0f4f9] px-2.5 py-1 rounded-full font-medium shrink-0 capitalize">
                    {activeFolder}
                  </span>
                </div>

                {/* Sender Metadata Block */}
                <div className="flex items-center justify-between pb-4 border-b border-[#f1f3f4]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white font-semibold text-sm flex items-center justify-center shadow-xs">
                      {(selectedMessage.from || 'G').replace(/"/g, '')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1f1f1f]">
                          {selectedMessage.from?.split('<')[0]?.trim() || selectedMessage.from}
                        </span>
                        <span className="text-xs text-[#5f6368] hidden sm:inline">
                          {selectedMessage.from?.includes('<') ? selectedMessage.from.match(/<([^>]+)>/)?.[1] : ''}
                        </span>
                      </div>
                      <p className="text-xs text-[#5f6368]">
                        to {selectedMessage.to || 'me'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-[#5f6368]">
                      {selectedMessage.date ? new Date(selectedMessage.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                {loadingDetails ? (
                  <div className="py-20 text-center text-[#5f6368] space-y-3">
                    <RefreshCw className="w-7 h-7 animate-spin mx-auto text-[#1a73e8]" />
                    <p className="text-xs font-medium">Loading full email content...</p>
                  </div>
                ) : (
                  <FormattedEmailBody body={selectedMessage.body} htmlBody={selectedMessage.htmlBody} />
                )}

                {/* REAL ATTACHMENTS SHELF (Download individual files) */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="pt-4 border-t border-[#f1f3f4] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#444746]">
                      <Paperclip className="w-4 h-4 text-[#1a73e8]" />
                      <span>{selectedMessage.attachments.length} Attachment{selectedMessage.attachments.length > 1 ? 's' : ''}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedMessage.attachments.map((att, idx) => {
                        const isDownloading = downloadingAttachmentId === (att.attachmentId || att.filename);
                        return (
                          <div
                            key={idx}
                            className="p-3 bg-[#f8fafd] hover:bg-[#f0f4f9] border border-[#dadce0] rounded-xl flex items-center justify-between gap-3 group transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2 bg-white rounded-lg border border-[#dadce0] shrink-0">
                                {getAttachmentIcon(att.mimeType, att.filename)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#1f1f1f] truncate" title={att.filename}>
                                  {att.filename}
                                </p>
                                <p className="text-[10px] text-[#5f6368] mt-0.5">
                                  {formatBytes(att.size)}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDownloadAttachment(att)}
                              disabled={isDownloading}
                              className="p-2 hover:bg-[#e8f0fe] text-[#1a73e8] rounded-full transition-colors cursor-pointer shrink-0"
                              title={`Download ${att.filename}`}
                            >
                              <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Reply Box */}
                <div className="pt-6 border-t border-[#f1f3f4] space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReplyToMessage(selectedMessage)}
                      className="px-4 py-2 border border-[#dadce0] hover:bg-[#f0f4f9] rounded-full text-xs font-semibold text-[#444746] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                      Reply
                    </button>
                    <button
                      onClick={() => handleReplyToMessage(selectedMessage)}
                      className="px-4 py-2 border border-[#dadce0] hover:bg-[#f0f4f9] rounded-full text-xs font-semibold text-[#444746] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <CornerUpRight className="w-3.5 h-3.5" />
                      Forward
                    </button>
                  </div>

                  {/* Inline quick reply textarea */}
                  <div className="border border-[#dadce0] rounded-2xl p-3 bg-[#f8fafd] focus-within:bg-white focus-within:border-[#1a73e8] transition-all space-y-2">
                    <textarea
                      placeholder={`Reply to ${selectedMessage.from}...`}
                      rows={3}
                      value={inlineReplyText}
                      onChange={(e) => setInlineReplyText(e.target.value)}
                      className="w-full bg-transparent text-xs text-[#1f1f1f] placeholder-[#747775] outline-none resize-none"
                    />

                    {/* Attached files list in quick reply */}
                    {inlineReplyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#e0e2ec]">
                        {inlineReplyAttachments.map((att, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#dadce0] rounded-full text-[11px] text-[#1f1f1f]">
                            <Paperclip className="w-3 h-3 text-[#1a73e8]" />
                            <span className="truncate max-w-[140px]">{att.name}</span>
                            <span className="text-[#5f6368]">({formatBytes(att.size)})</span>
                            <button
                              onClick={() => setInlineReplyAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                              className="p-0.5 hover:bg-[#e8eaed] rounded-full cursor-pointer ml-1"
                            >
                              <X className="w-3 h-3 text-[#5f6368]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-[#e0e2ec]">
                      <div className="flex items-center gap-1 text-[#5f6368]">
                        <input
                          type="file"
                          multiple
                          ref={replyFileInputRef}
                          onChange={(e) => handleFileUpload(e.target.files, true)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => replyFileInputRef.current?.click()}
                          className="p-1.5 hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                          title="Attach files"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <button type="button" className="p-1.5 hover:bg-[#f0f4f9] rounded-full cursor-pointer"><Smile className="w-4 h-4" /></button>
                        <button
                          type="button"
                          onClick={() => handleOpenTonePolish('reply')}
                          className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-full border border-purple-200 flex items-center gap-1 transition-colors cursor-pointer ml-1"
                          title="Tone & Polish Studio (Executive, Formal, Casual)"
                        >
                          <Sparkles className="w-3 h-3 fill-current text-purple-600" />
                          <span>Tone Studio</span>
                          <ProBadge size="xs" featureTitle="Tone & Polish Studio" />
                        </button>
                      </div>
                      <button
                        onClick={handleSendQuickReply}
                        disabled={!inlineReplyText.trim() || isSendingQuickReply}
                        className="px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        {isSendingQuickReply ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* AUTHENTIC INBOX LIST VIEW */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Trash banner if activeFolder === 'trash' */}
              {activeFolder === 'trash' && (
                <div className="px-4 py-2 bg-[#fef7e0] border-b border-[#fce8b2] text-xs text-[#5f6368] flex items-center justify-between">
                  <span>Messages that have been in Trash more than 30 days will be automatically deleted.</span>
                </div>
              )}

              {/* Gmail Action Toolbar */}
              <div className="h-12 px-3 sm:px-4 border-b border-[#dadce0] flex items-center justify-between bg-white shrink-0 text-[#5f6368] text-xs">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center">
                    <GoogleCheckbox
                      checked={selectedIds.length > 0 && selectedIds.length === filteredMessages.length}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < filteredMessages.length}
                      onChange={handleSelectAll}
                      title="Select all"
                    />
                  </div>
                  <button
                    onClick={() => loadMessages(activeFolder, searchQuery, activeCategory)}
                    className="p-1.5 sm:p-2 hover:bg-[#f0f4f9] rounded-full cursor-pointer transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1a73e8]' : ''}`} />
                  </button>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1.5 ml-1 sm:ml-2">
                    <button
                      onClick={() => setFilterChips((f) => ({ ...f, hasAttachment: !f.hasAttachment }))}
                      className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium border transition-colors cursor-pointer ${
                        filterChips.hasAttachment
                          ? 'bg-[#c2e7ff] text-[#001d35] border-transparent font-semibold'
                          : 'border-[#dadce0] text-[#444746] hover:bg-[#f0f4f9]'
                      }`}
                    >
                      Has attachment
                    </button>
                    <button
                      onClick={() => setFilterChips((f) => ({ ...f, unreadOnly: !f.unreadOnly }))}
                      className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium border transition-colors cursor-pointer ${
                        filterChips.unreadOnly
                          ? 'bg-[#c2e7ff] text-[#001d35] border-transparent font-semibold'
                          : 'border-[#dadce0] text-[#444746] hover:bg-[#f0f4f9]'
                      }`}
                    >
                      Unread
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-medium text-[11px]">
                  <span>{filteredMessages.length > 0 ? `1–${filteredMessages.length} of ${filteredMessages.length}` : '0 of 0'}</span>
                </div>
              </div>

              {/* Category Tabs: Primary / Promotions / Social (Shown in inbox) */}
              {activeFolder === 'inbox' && (
                <div className="flex border-b border-[#dadce0] bg-white shrink-0">
                  <button
                    onClick={() => setActiveCategory('primary')}
                    className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                      activeCategory === 'primary'
                        ? 'border-[#1a73e8] text-[#1a73e8] bg-[#e8f0fe]/20'
                        : 'border-transparent text-[#5f6368] hover:bg-[#f8fafd]'
                    }`}
                  >
                    <Inbox className="w-4 h-4" />
                    <span>Primary</span>
                  </button>
                  <button
                    onClick={() => setActiveCategory('promotions')}
                    className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                      activeCategory === 'promotions'
                        ? 'border-[#188038] text-[#188038] bg-[#e6f4ea]/20'
                        : 'border-transparent text-[#5f6368] hover:bg-[#f8fafd]'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    <span>Promotions</span>
                  </button>
                  <button
                    onClick={() => setActiveCategory('social')}
                    className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                      activeCategory === 'social'
                        ? 'border-[#1a73e8] text-[#1a73e8] bg-[#e8f0fe]/20'
                        : 'border-transparent text-[#5f6368] hover:bg-[#f8fafd]'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Social</span>
                  </button>
                </div>
              )}

              {/* Message Rows */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#f1f3f4]">
                {loading ? (
                  <div className="py-24 text-center text-[#5f6368]">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#1a73e8]" />
                    <p className="text-sm font-medium">Loading Gmail messages...</p>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="py-24 text-center text-[#5f6368] space-y-2">
                    <Inbox className="w-12 h-12 stroke-1 mx-auto text-[#dadce0]" />
                    <p className="text-sm font-medium text-[#1f1f1f]">No messages in this folder</p>
                    <p className="text-xs text-[#747775]">Messages matching your criteria will appear here.</p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isChecked = selectedIds.includes(msg.id);
                    const isUnread = msg.isUnread;
                    return (
                      <div
                        key={msg.id}
                        id={`gmail-row-${msg.id}`}
                        onClick={() => handleOpenMessage(msg)}
                        className={`group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 hover:shadow-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#c2e7ff]/30'
                            : isUnread
                            ? 'bg-white font-semibold'
                            : 'bg-[#f8fafd]/60 hover:bg-[#f2f6fc]'
                        }`}
                      >
                        <GoogleCheckbox
                          checked={isChecked}
                          onChange={(e) => handleToggleSelectOne(msg.id, e)}
                          title={isChecked ? 'Deselect message' : 'Select message'}
                        />

                        <button
                          onClick={(e) => handleToggleStar(msg, e)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer shrink-0"
                          title={msg.isStarred ? 'Starred' : 'Not starred'}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              msg.isStarred ? 'fill-[#fbbc04] text-[#fbbc04]' : 'text-[#dadce0] group-hover:text-[#9aa0a6]'
                            }`}
                          />
                        </button>

                        {/* Sender */}
                        <div className={`w-24 sm:w-44 shrink-0 truncate text-xs ${isUnread ? 'font-bold text-[#1f1f1f]' : 'font-medium text-[#444746]'}`}>
                          {msg.from?.split('<')[0]?.trim() || msg.from}
                        </div>

                        {/* Subject + Snippet */}
                        <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 truncate text-xs">
                          <span className={`truncate ${isUnread ? 'font-bold text-[#1f1f1f]' : 'font-medium text-[#1f1f1f]'}`}>
                            {msg.subject || '(No Subject)'}
                          </span>
                          <span className="text-[#5f6368] truncate font-normal hidden sm:inline">
                            - {msg.snippet}
                          </span>
                        </div>

                        {/* Attachment indicator if any */}
                        {msg.hasAttachments && (
                          <Paperclip className="w-3.5 h-3.5 text-[#5f6368] shrink-0" />
                        )}

                        {/* Date on Right & Quick Hover Actions */}
                        <div className="shrink-0 flex items-center gap-2">
                          <span className={`group-hover:hidden text-[11px] ${isUnread ? 'font-bold text-[#1f1f1f]' : 'font-medium text-[#5f6368]'}`}>
                            {msg.date ? new Date(msg.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                          </span>
                          <div className="hidden group-hover:flex items-center gap-1">
                            {activeFolder === 'trash' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestoreFromTrash(msg);
                                }}
                                className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors cursor-pointer"
                                title="Restore to Inbox"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTrashTarget(msg);
                                }}
                                className="p-1.5 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleMarkAsUnread(msg, e)}
                              className="p-1.5 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full transition-colors cursor-pointer"
                              title={msg.isUnread ? 'Mark as read' : 'Mark as unread'}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMessage(msg);
                              }}
                              className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors cursor-pointer"
                              title="Open message"
                            >
                              <MailOpen className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE FLOATING COMPOSE ACTION BUTTON (FAB) */}
      {!isComposeOpen && (
        <button
          id="mobile-compose-fab"
          onClick={() => {
            setIsComposeOpen(true);
            setIsComposeMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-40 md:hidden flex items-center gap-2.5 px-5 py-3.5 bg-[#c2e7ff] hover:bg-[#b3defa] active:bg-[#a0d2f8] text-[#001d35] rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.25)] active:scale-95 transition-all font-semibold text-sm cursor-pointer select-none"
          title="Compose email"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
          <span>Compose</span>
        </button>
      )}

      {/* DOCKED BOTTOM-RIGHT REAL GMAIL FLOATING COMPOSE WINDOW WITH ATTACHMENT UPLOADS */}
      {isComposeOpen && (
        <div
          className={`fixed z-50 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.28)] border border-[#dadce0] transition-all flex flex-col ${
            isComposeExpanded
              ? 'inset-2 sm:inset-auto sm:right-6 sm:bottom-0 sm:w-[850px] sm:h-[640px] rounded-2xl'
              : isComposeMinimized
              ? 'bottom-0 right-4 sm:right-6 w-72 h-10 rounded-t-2xl'
              : 'inset-x-2 bottom-0 top-14 sm:top-auto sm:inset-x-auto sm:right-6 sm:bottom-0 sm:w-[540px] sm:h-[520px] rounded-t-2xl'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-2.5 bg-[#f2f6fc] border-b border-[#dadce0] rounded-t-2xl flex items-center justify-between select-none cursor-pointer">
            <span className="text-xs font-bold text-[#001d35] font-['Google_Sans',Roboto,sans-serif]">
              {emailSubject.trim() ? emailSubject : 'New Message'}
            </span>
            <div className="flex items-center gap-1 text-[#5f6368]">
              <button
                onClick={() => setIsComposeMinimized(!isComposeMinimized)}
                className="p-1 hover:bg-[#dadce0] rounded-md transition-colors cursor-pointer"
                title="Minimize"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsComposeExpanded(!isComposeExpanded)}
                className="p-1 hover:bg-[#dadce0] rounded-md transition-colors cursor-pointer"
                title="Full screen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1 hover:bg-[#dadce0] rounded-md transition-colors cursor-pointer"
                title="Save & close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body when not minimized */}
          {!isComposeMinimized && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* To Row */}
              <div className="px-4 py-2 border-b border-[#dadce0]/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-[#5f6368] w-8">To</span>
                  <input
                    type="email"
                    placeholder="Recipients"
                    value={toRecipient}
                    onChange={(e) => setToRecipient(e.target.value)}
                    className="flex-1 text-xs sm:text-sm text-[#1f1f1f] outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5f6368]">
                  {!showCc && (
                    <button
                      type="button"
                      onClick={() => setShowCc(true)}
                      className="hover:text-[#1a73e8] cursor-pointer"
                    >
                      Cc
                    </button>
                  )}
                  {!showBcc && (
                    <button
                      type="button"
                      onClick={() => setShowBcc(true)}
                      className="hover:text-[#1a73e8] cursor-pointer"
                    >
                      Bcc
                    </button>
                  )}
                </div>
              </div>

              {/* Cc Row if toggled */}
              {showCc && (
                <div className="px-4 py-1.5 border-b border-[#dadce0]/60 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#5f6368] w-8">Cc</span>
                  <input
                    type="email"
                    placeholder="Cc recipients"
                    value={ccRecipient}
                    onChange={(e) => setCcRecipient(e.target.value)}
                    className="flex-1 text-xs text-[#1f1f1f] outline-none bg-transparent"
                  />
                </div>
              )}

              {/* Bcc Row if toggled */}
              {showBcc && (
                <div className="px-4 py-1.5 border-b border-[#dadce0]/60 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#5f6368] w-8">Bcc</span>
                  <input
                    type="email"
                    placeholder="Bcc recipients"
                    value={bccRecipient}
                    onChange={(e) => setBccRecipient(e.target.value)}
                    className="flex-1 text-xs text-[#1f1f1f] outline-none bg-transparent"
                  />
                </div>
              )}

              {/* Subject Row */}
              <div className="px-4 py-2 border-b border-[#dadce0]/60">
                <input
                  type="text"
                  placeholder="Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full text-xs sm:text-sm text-[#1f1f1f] outline-none bg-transparent"
                />
              </div>

              {/* Formatting options toolbar if active */}
              {showFormatting && (
                <div className="px-3 py-1.5 bg-[#f0f4f9] border-b border-[#dadce0] flex items-center gap-1.5 text-[#444746] overflow-x-auto select-none">
                  <button type="button" onClick={() => setEmailBody(prev => prev + ' **bold**')} className="p-1 hover:bg-[#e1e3e1] rounded cursor-pointer font-bold text-xs" title="Bold">B</button>
                  <button type="button" onClick={() => setEmailBody(prev => prev + ' *italic*')} className="p-1 hover:bg-[#e1e3e1] rounded cursor-pointer italic text-xs" title="Italic">I</button>
                  <button type="button" onClick={() => setEmailBody(prev => prev + ' <u>underline</u>')} className="p-1 hover:bg-[#e1e3e1] rounded cursor-pointer underline text-xs" title="Underline">U</button>
                  <div className="w-[1px] h-4 bg-[#dadce0] mx-0.5" />
                  <button type="button" onClick={() => setEmailBody(prev => prev + '\n- ')} className="p-1 hover:bg-[#e1e3e1] rounded cursor-pointer text-xs" title="Bulleted list">• Bullet list</button>
                  <button type="button" onClick={() => setEmailBody(prev => prev + '\n1. ')} className="p-1 hover:bg-[#e1e3e1] rounded cursor-pointer text-xs" title="Numbered list">1. Numbered list</button>
                </div>
              )}

              {/* Body Textarea */}
              <textarea
                placeholder="Write your email here..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="flex-1 w-full p-4 text-xs sm:text-sm text-[#1f1f1f] placeholder-[#747775] outline-none resize-none font-sans"
              />

              {/* Uploaded Attachments List in Compose */}
              {composeAttachments.length > 0 && (
                <div className="px-4 py-2 border-t border-[#f1f3f4] bg-[#f8fafd] flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {composeAttachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#dadce0] rounded-full text-[11px] text-[#1f1f1f] shadow-2xs"
                    >
                      <Paperclip className="w-3 h-3 text-[#1a73e8]" />
                      <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                      <span className="text-[#747775]">({formatBytes(att.size)})</span>
                      <button
                        type="button"
                        onClick={() => setComposeAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-0.5 hover:bg-[#e8eaed] rounded-full cursor-pointer ml-1 text-[#5f6368]"
                        title="Remove attachment"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Authentic Gmail Compose Action Footer Toolbar */}
              <div className="px-3 py-2 border-t border-[#f1f3f4] bg-white flex items-center justify-between select-none relative">
                {/* Left Cluster */}
                <div className="flex items-center gap-1">
                  {/* Split Send button with Schedule dropdown */}
                  <div className="relative inline-flex rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-xs shadow-xs transition-all overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowSendConfirm(true)}
                      disabled={!toRecipient.trim() || !emailSubject.trim()}
                      className="px-4 py-2 hover:bg-black/10 cursor-pointer disabled:opacity-50 flex items-center gap-1 font-bold"
                    >
                      <span>Send</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowScheduleDropdown(!showScheduleDropdown)}
                      className="px-2 py-2 border-l border-white/20 hover:bg-black/10 cursor-pointer flex items-center justify-center"
                      title="More send options"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Schedule Send Popup */}
                    {showScheduleDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl border border-[#dadce0] shadow-xl p-2 text-xs text-[#1f1f1f] z-50 animate-in fade-in">
                        <div className="px-3 py-1 font-bold text-[#5f6368] uppercase text-[10px]">Schedule Send</div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowScheduleDropdown(false);
                            setSuccessMsg('Email scheduled for Tomorrow morning, 8:00 AM');
                            setTimeout(() => setSuccessMsg(null), 3000);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-[#f0f4f9] rounded-lg font-medium cursor-pointer"
                        >
                          Tomorrow morning (8:00 AM)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowScheduleDropdown(false);
                            setSuccessMsg('Email scheduled for Tomorrow afternoon, 1:00 PM');
                            setTimeout(() => setSuccessMsg(null), 3000);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-[#f0f4f9] rounded-lg font-medium cursor-pointer"
                        >
                          Tomorrow afternoon (1:00 PM)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowScheduleDropdown(false);
                            setSuccessMsg('Email scheduled for Monday morning, 8:00 AM');
                            setTimeout(() => setSuccessMsg(null), 3000);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-[#f0f4f9] rounded-lg font-medium cursor-pointer"
                        >
                          Monday morning (8:00 AM)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Formatting options toggle (A) */}
                  <button
                    type="button"
                    onClick={() => setShowFormatting(!showFormatting)}
                    className={`p-2 rounded-full cursor-pointer transition-colors ${
                      showFormatting ? 'bg-[#c2e7ff] text-[#001d35]' : 'text-[#444746] hover:bg-[#f0f4f9]'
                    }`}
                    title="Formatting options"
                  >
                    <span className="font-serif font-bold underline text-sm leading-none">A</span>
                  </button>

                  {/* Attach files (Paperclip) */}
                  <input
                    type="file"
                    multiple
                    ref={composeFileInputRef}
                    onChange={(e) => handleFileUpload(e.target.files, false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => composeFileInputRef.current?.click()}
                    className="p-2 text-[#444746] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                    title="Attach files"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Insert Link */}
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Enter URL link:');
                      if (url) setEmailBody((prev) => prev + `\n${url}`);
                    }}
                    className="p-2 text-[#444746] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                    title="Insert link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>

                  {/* Insert Emoji */}
                  <button
                    type="button"
                    onClick={() => setEmailBody((prev) => prev + ' 😊')}
                    className="p-2 text-[#444746] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                    title="Insert emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {/* Insert files using Drive */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('drive');
                      else alert('Opening Google Drive files...');
                    }}
                    className="p-2 text-[#444746] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                    title="Insert files using Drive"
                  >
                    <GoogleDriveIcon className="w-4 h-4" />
                  </button>

                  {/* Insert Photo */}
                  <button
                    type="button"
                    onClick={() => composeFileInputRef.current?.click()}
                    className="p-2 text-[#444746] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                    title="Insert photo"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  {/* Toggle Confidential mode */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfidential(!isConfidential);
                      setSuccessMsg(
                        !isConfidential
                          ? 'Confidential mode turned on (Recipient cannot forward, copy, print, or download)'
                          : 'Confidential mode turned off'
                      );
                      setTimeout(() => setSuccessMsg(null), 2500);
                    }}
                    className={`p-2 rounded-full cursor-pointer transition-colors ${
                      isConfidential ? 'bg-[#ceead6] text-[#137333]' : 'text-[#444746] hover:bg-[#f0f4f9]'
                    }`}
                    title="Toggle confidential mode"
                  >
                    <Lock className="w-4 h-4" />
                  </button>

                  {/* Insert Signature */}
                  <button
                    type="button"
                    onClick={() => {
                      setEmailBody((prev) => prev + '\n\n--\nBest regards,\nTanaka Prince\ntanakaprince49@gmail.com');
                    }}
                    className="p-2 text-[#444746] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                    title="Insert signature"
                  >
                    <PenTool className="w-4 h-4" />
                  </button>
                </div>

                {/* Right Cluster */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsComposeOpen(false);
                      setComposeAttachments([]);
                      setEmailBody('');
                      setEmailSubject('');
                      setToRecipient('');
                      setCcRecipient('');
                      setBccRecipient('');
                    }}
                    className="p-2 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors cursor-pointer"
                    title="Discard draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('More options: Default full screen, Label, Plain text mode, Print, Check spelling')}
                    className="p-2 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEND CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showSendConfirm}
        title="Send Email via Gmail"
        description="Are you sure you want to send this email from your connected Google Account?"
        confirmLabel="Send Email"
        isDestructive={false}
        isLoading={isSending}
        itemsList={[
          `To: ${toRecipient}`,
          `Subject: ${emailSubject}`,
          composeAttachments.length > 0 ? `Attachments: ${composeAttachments.length} file(s)` : '',
          `Body preview: ${emailBody.slice(0, 80)}${emailBody.length > 80 ? '...' : ''}`,
        ].filter(Boolean)}
        onConfirm={handleConfirmSend}
        onCancel={() => setShowSendConfirm(false)}
      />

      {/* TRASH CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={!!trashTarget}
        title="Move Email to Trash"
        description={`Are you sure you want to move the conversation "${trashTarget?.subject || '(No Subject)'}" to Trash?`}
        confirmLabel="Move to Trash"
        isDestructive={true}
        isLoading={isTrashing}
        onConfirm={handleConfirmTrash}
        onCancel={() => setTrashTarget(null)}
      />

      {/* PERMANENT DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={!!permanentDeleteTarget}
        title="Delete Permanently"
        description={`Are you sure you want to permanently delete "${permanentDeleteTarget?.subject || '(No Subject)'}"? This action cannot be undone.`}
        confirmLabel="Delete Forever"
        isDestructive={true}
        isLoading={false}
        onConfirm={handleConfirmPermanentDelete}
        onCancel={() => setPermanentDeleteTarget(null)}
      />

      {/* PRO MAGIC ACTION: 1-CLICK EMAIL TO TASK & EVENT MODAL */}
      <EmailToTaskEventModal
        isOpen={magicEmailToTaskModalOpen}
        onClose={() => setMagicEmailToTaskModalOpen(false)}
        message={selectedMessage}
        token={token}
        onSuccess={() => {
          setSuccessMsg('Calendar event & Google Task created with pre-attached meeting link!');
          setTimeout(() => setSuccessMsg(null), 3500);
        }}
      />

      {/* PRO MAGIC ACTION: DEEP THREAD TL;DR MODAL */}
      <DeepThreadSummaryModal
        isOpen={deepThreadSummaryModalOpen}
        onClose={() => setDeepThreadSummaryModalOpen(false)}
        message={selectedMessage}
      />

      {/* PRO MAGIC ACTION: TONE & POLISH STUDIO MODAL */}
      <TonePolishStudioModal
        isOpen={tonePolishModalOpen}
        onClose={() => setTonePolishModalOpen(false)}
        originalText={tonePolishTarget === 'reply' ? inlineReplyText : emailBody}
        onApplyPolishedText={(polished) => {
          if (tonePolishTarget === 'reply') {
            setInlineReplyText(polished);
          } else {
            setEmailBody(polished);
          }
          setSuccessMsg('Draft replaced with polished tone version!');
          setTimeout(() => setSuccessMsg(null), 2500);
        }}
      />
    </div>
  );
};
