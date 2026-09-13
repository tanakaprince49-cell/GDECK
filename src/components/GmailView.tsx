import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  X,
  Clock,
  User,
  CheckCircle2,
  Inbox,
  PenSquare,
  ArrowLeft,
  Star,
  Tag,
  Paperclip,
  ExternalLink,
  Image,
} from 'lucide-react';
import { GmailMessageItem } from '../types/workspace';
import {
  listGmailMessages,
  getGmailMessageDetails,
  sendGmailMessage,
  trashGmailMessage,
  toggleGmailStar,
} from '../services/workspace';
import { ConfirmModal } from './ConfirmModal';
import { GmailIcon } from './GoogleIcons';

interface GmailViewProps {
  token: string;
  onBackToOverview?: () => void;
}

const FormattedEmailBody: React.FC<{ body?: string; htmlBody?: string }> = ({ body, htmlBody }) => {
  const [viewMode, setViewMode] = useState<'html' | 'text'>(htmlBody ? 'html' : 'text');

  // URL matching regex: captures http, https, www URLs
  const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

  // Extract inline image URLs from plain text if available
  const imageRegex = /(https?:\/\/[^\s<]+\.(?:png|jpg|jpeg|gif|webp|svg)[^\s<]*)/gi;
  const content = body || '';
  const matchedImages = Array.from(content.matchAll(imageRegex)).map((m) => m[0]);

  if (viewMode === 'html' && htmlBody) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-[#dadce0] overflow-hidden bg-white shadow-2xs p-3">
          <iframe
            title="Email HTML Content"
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <base target="_blank">
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                      font-size: 14px;
                      line-height: 1.6;
                      color: #1f1f1f;
                      margin: 0;
                      padding: 12px;
                      word-break: break-word;
                      overflow-wrap: break-word;
                    }
                    img {
                      max-width: 100% !important;
                      height: auto !important;
                      border-radius: 12px;
                      margin: 12px 0;
                      display: block;
                    }
                    a {
                      color: #1a73e8;
                      font-weight: 600;
                      text-decoration: underline;
                      background-color: #e8f0fe;
                      padding: 2px 6px;
                      border-radius: 6px;
                    }
                    a:hover {
                      background-color: #c2e7ff;
                      color: #1557b0;
                    }
                    blockquote {
                      border-left: 3px solid #dadce0;
                      margin: 12px 0;
                      padding-left: 12px;
                      color: #5f6368;
                    }
                    pre, code {
                      background: #f0f4f9;
                      padding: 4px 8px;
                      border-radius: 6px;
                      font-size: 13px;
                    }
                  </style>
                </head>
                <body>${htmlBody}</body>
              </html>
            `}
            className="w-full min-h-[360px] max-h-[500px] border-none"
            sandbox="allow-same-origin allow-popups"
          />
        </div>
      </div>
    );
  }

  // Plain text mode with highlighted URLs and embedded pictures
  const textParts = content.split(urlRegex);

  return (
    <div className="space-y-4">
      <div className="text-sm text-[#1f1f1f] leading-relaxed whitespace-pre-wrap break-words font-sans bg-[#f8fafd] p-4 rounded-2xl border border-[#e1e3e1] shadow-2xs">
        {textParts.map((part, idx) => {
          if (part.match(/^https?:\/\//i) || part.match(/^www\./i)) {
            const href = part.startsWith('www.') ? `https://${part}` : part;
            return (
              <a
                key={idx}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#c2e7ff] hover:text-[#1557b0] px-2 py-0.5 rounded-md underline transition-all my-0.5 mx-0.5 shadow-2xs"
              >
                <span>{part}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            );
          }
          return part;
        })}
      </div>

      {/* Auto-detected inline image previews */}
      {matchedImages.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#f1f3f4]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1f1f1f]">
            <Image className="w-4 h-4 text-[#1a73e8]" />
            <span>Embedded Pictures ({matchedImages.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {matchedImages.map((imgUrl, i) => (
              <a
                key={i}
                href={imgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block group overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-xs"
              >
                <img
                  src={imgUrl}
                  alt={`Embedded photo ${i + 1}`}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const GmailView: React.FC<GmailViewProps> = ({ token, onBackToOverview }) => {
  const [messages, setMessages] = useState<GmailMessageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected message for details preview
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Compose / Send modal
  const [showComposeModal, setShowComposeModal] = useState<boolean>(false);
  const [toRecipient, setToRecipient] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [showSendConfirm, setShowSendConfirm] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Trash message modal
  const [trashTarget, setTrashTarget] = useState<GmailMessageItem | null>(null);
  const [isTrashing, setIsTrashing] = useState<boolean>(false);

  const loadMessages = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const msgs = await listGmailMessages(token, 15, query);
      setMessages(msgs);
    } catch (err: any) {
      setError(err.message || 'Failed to load Gmail messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMessages(searchQuery);
  };

  const handleOpenMessage = async (item: GmailMessageItem) => {
    setSelectedMessage(item);
    setLoadingDetails(true);
    try {
      const detailed = await getGmailMessageDetails(token, item.id);
      setSelectedMessage(detailed);
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

  const handleReplyToMessage = (msg: GmailMessageItem) => {
    // Extract raw email address from "Name <email@domain.com>" or "email@domain.com"
    let recipientEmail = msg.from || '';
    const match = recipientEmail.match(/<([^>]+)>/);
    if (match) recipientEmail = match[1];

    const replySubject = msg.subject?.startsWith('Re:')
      ? msg.subject
      : `Re: ${msg.subject || ''}`;

    setToRecipient(recipientEmail);
    setEmailSubject(replySubject);
    setEmailBody(`\n\n--- Original Message ---\nFrom: ${msg.from}\nDate: ${msg.date}\n\n${msg.body || msg.snippet || ''}`);
    setShowComposeModal(true);
  };

  const handleConfirmSend = async () => {
    setIsSending(true);
    try {
      await sendGmailMessage(token, toRecipient, emailSubject, emailBody);
      setSuccessMsg(`Email successfully sent to ${toRecipient}`);
      setShowSendConfirm(false);
      setShowComposeModal(false);
      setToRecipient('');
      setEmailSubject('');
      setEmailBody('');
      loadMessages();
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
    } catch (err: any) {
      setError(err.message || 'Failed to delete message');
    } finally {
      setIsTrashing(false);
    }
  };

  return (
    <div id="gmail-view" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-[#dadce0] shadow-[0_1px_2px_0_rgba(60,64,67,0.06)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="gmail-back-to-overview-btn"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#1f1f1f] hover:text-[#d93025] bg-[#f0f4f9] hover:bg-[#fce8e6] border border-[#dadce0] rounded-full transition-all cursor-pointer shrink-0"
              title="Return to Workspace Dashboard"
            >
              <ArrowLeft className="w-4 h-4 text-[#5f6368]" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div className="p-2 bg-[#f8fafd] border border-[#dadce0] rounded-2xl shrink-0 flex items-center justify-center">
            <GmailIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1f1f1f] tracking-tight font-['Google_Sans',Roboto,sans-serif]">Gmail</h2>
            <p className="text-xs text-[#5f6368]">Live inbox synchronization and email composer</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="compose-email-btn"
            onClick={() => setShowComposeModal(true)}
            className="px-5 py-2.5 bg-[#c2e7ff] hover:bg-[#b3defa] text-[#001d35] text-xs font-bold rounded-2xl shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] flex items-center gap-2.5 transition-all cursor-pointer hover:shadow-md"
          >
            <PenSquare className="w-4 h-4 text-[#d93025]" />
            <span>Compose</span>
          </button>
          <button
            id="gmail-refresh-btn"
            onClick={() => loadMessages(searchQuery)}
            disabled={loading}
            className="p-2.5 text-[#5f6368] hover:text-[#1f1f1f] bg-[#f0f4f9] hover:bg-[#e8f0fe] rounded-full border border-[#dadce0] transition-colors cursor-pointer"
            title="Refresh inbox"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d93025]' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#fce8e6] border border-[#f5c6cb] text-[#d93025] rounded-2xl text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline font-semibold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-[#e6f4ea] border border-[#ceead6] text-[#188038] rounded-2xl text-xs flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="underline font-semibold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Mail layout: list + detail preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Messages List Column */}
        <div className={`${selectedMessage ? 'hidden lg:block lg:col-span-6' : 'lg:col-span-12'} transition-all`}>
          <div className="bg-white rounded-3xl border border-[#dadce0] shadow-[0_1px_2px_0_rgba(60,64,67,0.06)] overflow-hidden">
            {/* Search Header inside list */}
            <div className="p-3 border-b border-[#dadce0] bg-[#f8fafd] flex items-center gap-2">
              {searchQuery && (
                <button
                  id="gmail-back-to-all-btn"
                  onClick={() => {
                    setSearchQuery('');
                    loadMessages('');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#d93025] hover:bg-[#fce8e6] rounded-full font-medium transition-colors cursor-pointer shrink-0"
                  title="Clear search and return to all messages"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All</span>
                </button>
              )}
              <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#5f6368] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="gmail-search-input"
                    type="text"
                    placeholder="Search in mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#dadce0] rounded-full focus:outline-none focus:border-[#d93025]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-[#1a73e8] text-white rounded-full hover:bg-[#1557b0] transition-colors font-semibold cursor-pointer"
                >
                  Search
                </button>
              </form>
            </div>

            {loading ? (
              <div className="p-12 text-center text-[#5f6368]">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#d93025]" />
                <p className="text-sm font-medium">Loading Gmail messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-12 text-center text-[#5f6368]">
                <Inbox className="w-12 h-12 stroke-1 mx-auto mb-3 text-[#9aa0a6]" />
                <p className="text-sm font-semibold text-[#1f1f1f]">No messages found</p>
                <p className="text-xs text-[#5f6368] mt-1">Your inbox is clean or no matching emails</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f1f3f4] max-h-[560px] overflow-y-auto">
                {messages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  return (
                    <div
                      key={msg.id}
                      id={`gmail-item-${msg.id}`}
                      onClick={() => handleOpenMessage(msg)}
                      className={`p-4 hover:bg-[#f8fafd] cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                        isSelected ? 'bg-[#fce8e6]/40 border-l-4 border-[#d93025]' : ''
                      }`}
                    >
                      <button
                        onClick={(e) => handleToggleStar(msg, e)}
                        className="p-1 text-[#fbbc04] hover:scale-110 transition-transform cursor-pointer shrink-0 mt-0.5"
                        title={msg.isStarred ? 'Unstar email' : 'Star email'}
                      >
                        <Star className={`w-4 h-4 ${msg.isStarred ? 'fill-[#fbbc04]' : 'text-[#9aa0a6]'}`} />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-[#1f1f1f] truncate">
                            {msg.from || 'Unknown Sender'}
                          </span>
                          <span className="text-[11px] text-[#5f6368] shrink-0 font-medium">
                            {msg.date ? new Date(msg.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-[#1f1f1f] truncate mb-0.5">
                          {msg.subject || '(No Subject)'}
                        </h4>
                        <p className="text-xs text-[#5f6368] line-clamp-2 leading-relaxed">
                          {msg.snippet}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrashTarget(msg);
                        }}
                        className="p-1.5 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors shrink-0"
                        title="Move to trash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Message Detail Column */}
        {selectedMessage && (
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#dadce0] shadow-[0_1px_2px_0_rgba(60,64,67,0.06)] p-6 flex flex-col h-[650px]">
            {/* Back to Inbox Bar */}
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#f1f3f4]">
              <button
                id="gmail-back-to-inbox-btn"
                onClick={() => setSelectedMessage(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1f1f1f] hover:text-[#d93025] bg-[#f0f4f9] hover:bg-[#fce8e6] border border-[#dadce0] rounded-full transition-all cursor-pointer"
                title="Close preview and return to messages list"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Inbox</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStar(selectedMessage)}
                  className="p-1.5 text-[#fbbc04] hover:bg-[#fef7e0] rounded-full transition-colors cursor-pointer"
                  title={selectedMessage.isStarred ? 'Unstar email' : 'Star email'}
                >
                  <Star className={`w-4 h-4 ${selectedMessage.isStarred ? 'fill-[#fbbc04]' : 'text-[#9aa0a6]'}`} />
                </button>
                <button
                  onClick={() => handleReplyToMessage(selectedMessage)}
                  className="px-3.5 py-1.5 text-xs font-bold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#c2e7ff] rounded-full transition-colors cursor-pointer"
                >
                  Reply
                </button>
              </div>
            </div>

            {/* Message Header with Sender Avatar */}
            <div className="pb-4 border-b border-[#f1f3f4] mb-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base sm:text-lg font-bold text-[#1f1f1f] tracking-tight leading-snug">
                  {selectedMessage.subject || '(No Subject)'}
                </h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#34a853] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {(selectedMessage.from || 'G').replace(/"/g, '')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 text-xs">
                    <p className="font-bold text-[#1f1f1f] truncate">
                      {selectedMessage.from}
                    </p>
                    {selectedMessage.to && (
                      <p className="text-[#5f6368] truncate">
                        to {selectedMessage.to}
                      </p>
                    )}
                  </div>
                </div>

                {selectedMessage.date && (
                  <span className="text-[11px] font-medium text-[#5f6368] shrink-0 bg-[#f0f4f9] px-2.5 py-1 rounded-full">
                    {new Date(selectedMessage.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto pr-2">
              {loadingDetails ? (
                <div className="p-12 text-center text-[#5f6368]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#d93025]" />
                  <p className="text-xs font-semibold">Loading email content & pictures...</p>
                </div>
              ) : (
                <FormattedEmailBody body={selectedMessage.body} htmlBody={selectedMessage.htmlBody} />
              )}
            </div>

            {/* Footer Bar */}
            <div className="pt-4 border-t border-[#f1f3f4] flex items-center justify-between mt-2">
              <a
                href={`https://mail.google.com/mail/u/0/#inbox/${selectedMessage.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#d93025] hover:underline flex items-center gap-1"
              >
                <span>Open in Gmail Web App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setTrashTarget(selectedMessage)}
                className="px-4 py-1.5 text-xs font-semibold text-[#d93025] hover:bg-[#fce8e6] rounded-full border border-[#f5c6cb] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Move to Trash
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compose Email Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_4px_24px_rgba(60,64,67,0.25)] border border-[#dadce0] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#f1f3f4] flex items-center justify-between bg-[#f8fafd]">
              <h3 className="text-sm font-bold text-[#1f1f1f] flex items-center gap-2">
                <PenSquare className="w-4 h-4 text-[#d93025]" /> New Message
              </h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-[#5f6368] hover:text-[#1f1f1f] p-1.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1">
                  To:
                </label>
                <input
                  id="compose-to-input"
                  type="email"
                  placeholder="recipient@example.com"
                  value={toRecipient}
                  onChange={(e) => setToRecipient(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-[#f0f4f9] border border-transparent focus:border-[#d93025] rounded-full focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1">
                  Subject:
                </label>
                <input
                  id="compose-subject-input"
                  type="text"
                  placeholder="Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-[#f0f4f9] border border-transparent focus:border-[#d93025] rounded-full focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1">
                  Message:
                </label>
                <textarea
                  id="compose-body-input"
                  rows={6}
                  placeholder="Write your email here..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-[#f0f4f9] border border-transparent focus:border-[#d93025] rounded-2xl focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-[#f8fafd] border-t border-[#f1f3f4] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowComposeModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5f6368] hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                id="send-email-review-btn"
                type="button"
                disabled={!toRecipient || !emailSubject}
                onClick={() => setShowSendConfirm(true)}
                className="px-6 py-2 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full flex items-center gap-2 disabled:opacity-50 transition-all shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal for Sending Email */}
      <ConfirmModal
        isOpen={showSendConfirm}
        title="Send Email via Gmail"
        description="Are you sure you want to send this email on behalf of your Google Account?"
        confirmLabel="Send Email"
        isDestructive={false}
        isLoading={isSending}
        itemsList={[
          `Recipient: ${toRecipient}`,
          `Subject: ${emailSubject}`,
          `Body snippet: ${emailBody.slice(0, 100)}${emailBody.length > 100 ? '...' : ''}`,
        ]}
        onConfirm={handleConfirmSend}
        onCancel={() => setShowSendConfirm(false)}
      />

      {/* Confirmation modal for Trashing Email */}
      <ConfirmModal
        isOpen={!!trashTarget}
        title="Move Email to Trash"
        description={`Are you sure you want to move this email from "${trashTarget?.from}" regarding "${trashTarget?.subject}" to Trash?`}
        confirmLabel="Move to Trash"
        isDestructive={true}
        isLoading={isTrashing}
        onConfirm={handleConfirmTrash}
        onCancel={() => setTrashTarget(null)}
      />
    </div>
  );
};
