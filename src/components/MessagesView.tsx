import React, { useState, useEffect } from 'react';
import {
  Send,
  Search,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  Phone,
  User,
  CheckCheck,
  Smartphone,
  QrCode,
  ArrowLeft,
  MessageSquare,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ContactPerson } from '../types/workspace';
import { listContacts } from '../services/workspace';
import { ConfirmModal } from './ConfirmModal';
import { GoogleMessagesIcon } from './GoogleIcons';

interface MessageItem {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  type: 'rcs' | 'sms';
  status: 'sent' | 'delivered' | 'read';
}

interface ConversationThread {
  id: string;
  contactName: string;
  phoneNumber: string;
  avatarUrl?: string;
  unreadCount: number;
  lastMessage: string;
  lastTimestamp: string;
  type: 'rcs' | 'sms';
  messages: MessageItem[];
}

interface MessagesViewProps {
  token: string;
  onBackToOverview?: () => void;
}

const DEFAULT_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'thread-1',
    contactName: 'Sarah Jenkins',
    phoneNumber: '+1 (555) 234-5678',
    unreadCount: 0,
    lastMessage: 'Sounds good! See you at the team sync at 2 PM.',
    lastTimestamp: '10:42 AM',
    type: 'rcs',
    messages: [
      {
        id: 'm1',
        sender: 'Sarah Jenkins',
        senderName: 'Sarah Jenkins',
        text: 'Hey! Did you get a chance to check the updated slides on Drive?',
        timestamp: '10:30 AM',
        isMe: false,
        type: 'rcs',
        status: 'read',
      },
      {
        id: 'm2',
        sender: 'Me',
        senderName: 'Me',
        text: 'Yes, just reviewed them and left comments on slide 4.',
        timestamp: '10:38 AM',
        isMe: true,
        type: 'rcs',
        status: 'read',
      },
      {
        id: 'm3',
        sender: 'Sarah Jenkins',
        senderName: 'Sarah Jenkins',
        text: 'Sounds good! See you at the team sync at 2 PM.',
        timestamp: '10:42 AM',
        isMe: false,
        type: 'rcs',
        status: 'read',
      },
    ],
  },
  {
    id: 'thread-2',
    contactName: 'Alex Rivera',
    phoneNumber: '+1 (555) 876-5432',
    unreadCount: 1,
    lastMessage: 'The spreadsheet numbers are verified for Q3.',
    lastTimestamp: 'Yesterday',
    type: 'rcs',
    messages: [
      {
        id: 'm4',
        sender: 'Alex Rivera',
        senderName: 'Alex Rivera',
        text: 'The spreadsheet numbers are verified for Q3.',
        timestamp: 'Yesterday',
        isMe: false,
        type: 'rcs',
        status: 'delivered',
      },
    ],
  },
  {
    id: 'thread-3',
    contactName: 'Google Security',
    phoneNumber: '22000',
    unreadCount: 0,
    lastMessage: 'Your Google Workspace 2-step verification code is 849201.',
    lastTimestamp: 'Sep 11',
    type: 'sms',
    messages: [
      {
        id: 'm5',
        sender: 'Google Security',
        senderName: 'Google Security',
        text: 'Your Google Workspace 2-step verification code is 849201. Do not share this code with anyone.',
        timestamp: 'Sep 11',
        isMe: false,
        type: 'sms',
        status: 'read',
      },
    ],
  },
];

export const MessagesView: React.FC<MessagesViewProps> = ({ token, onBackToOverview }) => {
  const [conversations, setConversations] = useState<ConversationThread[]>(() => {
    try {
      const saved = localStorage.getItem('google_messages_threads');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_CONVERSATIONS;
  });

  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    conversations[0]?.id || ''
  );
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [messageInput, setMessageInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showNewMsgModal, setShowNewMsgModal] = useState<boolean>(false);
  const [newRecipientName, setNewRecipientName] = useState<string>('');
  const [newRecipientPhone, setNewRecipientPhone] = useState<string>('');
  const [newRecipientText, setNewRecipientText] = useState<string>('');
  const [deleteThreadTarget, setDeleteThreadTarget] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Save threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('google_messages_threads', JSON.stringify(conversations));
    } catch {
      // ignore
    }
  }, [conversations]);

  // Load Google Contacts for quick recipient selection
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const data = await listContacts(token, 20);
        setContacts(data);
      } catch (err) {
        console.error('Failed to load contacts for Messages:', err);
      }
    };
    if (token) {
      fetchContacts();
    }
  }, [token]);

  const selectedThread = conversations.find((c) => c.id === selectedThreadId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedThread) return;

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'Me',
      senderName: 'Me',
      text: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type: selectedThread.type,
      status: 'sent',
    };

    setConversations((prev) =>
      prev.map((thread) => {
        if (thread.id === selectedThread.id) {
          return {
            ...thread,
            lastMessage: newMsg.text,
            lastTimestamp: newMsg.timestamp,
            messages: [...thread.messages, newMsg],
          };
        }
        return thread;
      })
    );

    setMessageInput('');
  };

  const handleCreateNewThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientPhone.trim() || !newRecipientText.trim()) return;

    const contactName = newRecipientName.trim() || newRecipientPhone.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'Me',
      senderName: 'Me',
      text: newRecipientText.trim(),
      timestamp: timeStr,
      isMe: true,
      type: 'rcs',
      status: 'sent',
    };

    const newThread: ConversationThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      contactName,
      phoneNumber: newRecipientPhone.trim(),
      unreadCount: 0,
      lastMessage: newMsg.text,
      lastTimestamp: timeStr,
      type: 'rcs',
      messages: [newMsg],
    };

    setConversations([newThread, ...conversations]);
    setSelectedThreadId(newThread.id);
    setShowNewMsgModal(false);
    setNewRecipientName('');
    setNewRecipientPhone('');
    setNewRecipientText('');
    setSuccessMsg('Message dispatched successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteThread = () => {
    if (!deleteThreadTarget) return;
    setConversations((prev) => prev.filter((c) => c.id !== deleteThreadTarget));
    if (selectedThreadId === deleteThreadTarget) {
      const remaining = conversations.filter((c) => c.id !== deleteThreadTarget);
      setSelectedThreadId(remaining[0]?.id || '');
    }
    setDeleteThreadTarget(null);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="messages-view" className="flex flex-col h-full min-h-0 space-y-3 md:space-y-6 overflow-y-auto p-0 sm:p-2 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="messages-back-to-overview-btn"
              onClick={onBackToOverview}
              className="hidden md:inline-flex inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-blue-500/10 border border-blue-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleMessagesIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Messages</h2>
            <p className="text-sm text-slate-500">
              Text, RCS chats, and contact messaging synced with your Android phone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="start-chat-btn"
            onClick={() => setShowNewMsgModal(true)}
            className="px-4 py-2.5 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-[0_4px_14px_rgba(59,130,246,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-blue-400/40 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Start Chat
          </button>
          <a
            href="https://messages.google.com/web"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-slate-600 hover:text-blue-600 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Open Google Messages on Web"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span className="hidden md:inline">Pair Device</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCheck className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Messages Dual-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
        {/* Left: Conversations Thread List */}
        <div className="lg:col-span-4 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-xs bg-white/70 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Recent Chats ({filteredConversations.length})</span>
              <span className="flex items-center gap-1 text-blue-600">
                <ShieldCheck className="w-3 h-3" /> End-to-End Encrypted
              </span>
            </div>

            <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
              {filteredConversations.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No matching conversations found
                </div>
              ) : (
                filteredConversations.map((thread) => {
                  const isSelected = thread.id === selectedThreadId;
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`w-full p-3 rounded-2xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-500/10 border border-blue-500/30 text-blue-900 shadow-xs'
                          : 'hover:bg-white/60 border border-transparent text-slate-700'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs text-sm">
                        {thread.contactName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold truncate text-slate-900">
                            {thread.contactName}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {thread.lastTimestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {thread.lastMessage}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              thread.type === 'rcs'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {thread.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {thread.phoneNumber}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 mt-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" /> Synced with Phone
              </span>
              <button
                onClick={() => setShowNewMsgModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
          </div>
        </div>

        {/* Right: Active Chat Conversation */}
        <div className="lg:col-span-8 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-5 flex flex-col justify-between">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                    {selectedThread.contactName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {selectedThread.contactName}
                      </h3>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          selectedThread.type === 'rcs'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {selectedThread.type === 'rcs' ? 'RCS Chat' : 'SMS'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedThread.phoneNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDeleteThreadTarget(selectedThread.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <a
                    href="https://messages.google.com/web"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    title="Open in Google Messages Web"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Messages Bubble Area */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[300px] max-h-[380px] px-1">
                <div className="text-center my-2">
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100/80 px-2.5 py-1 rounded-full">
                    {selectedThread.type === 'rcs'
                      ? '🔒 End-to-end encrypted RCS chat with ' + selectedThread.contactName
                      : 'Standard SMS Message'}
                  </span>
                </div>

                {selectedThread.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                        msg.isMe
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                      {msg.isMe && (
                        <CheckCheck className="w-3 h-3 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input & Quick Replies */}
              <div className="pt-3 border-t border-slate-200/60 space-y-2.5">
                {/* Quick replies chip bar */}
                <div className="flex flex-wrap gap-1.5">
                  {['Got it, thanks!', 'On my way', 'Sounds good!', 'Call you shortly'].map(
                    (quick) => (
                      <button
                        key={quick}
                        onClick={() => setMessageInput(quick)}
                        className="text-[11px] px-2.5 py-1 bg-white/80 hover:bg-white text-slate-600 border border-slate-200/70 rounded-full transition-all cursor-pointer hover:border-blue-300"
                      >
                        {quick}
                      </button>
                    )
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Type an ${selectedThread.type.toUpperCase()} message...`}
                    className="flex-1 bg-white/80 border border-slate-200/90 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-2xs placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <GoogleMessagesIcon className="w-12 h-12 opacity-40" />
              <h4 className="text-sm font-bold text-slate-700">No Conversation Selected</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Select a conversation from the sidebar or start a new chat to begin messaging.
              </p>
              <button
                onClick={() => setShowNewMsgModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Start New Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Start New Chat Modal */}
      {showNewMsgModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GoogleMessagesIcon className="w-6 h-6" />
                <h3 className="text-base font-bold text-slate-900">New Message</h3>
              </div>
              <button
                onClick={() => setShowNewMsgModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Contact Picker */}
            {contacts.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pick From Google Contacts
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {contacts.slice(0, 6).map((c) => {
                    const name = c.names?.[0]?.displayName || 'Contact';
                    const phone = c.phoneNumbers?.[0]?.value || '';
                    return (
                      <button
                        key={c.resourceName}
                        type="button"
                        onClick={() => {
                          setNewRecipientName(name);
                          if (phone) setNewRecipientPhone(phone);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs rounded-xl font-medium shrink-0 transition-colors border border-slate-200/60"
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateNewThread} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Contact Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. David Miller"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Phone Number / Recipient *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={newRecipientPhone}
                  onChange={(e) => setNewRecipientPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Message *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Type your message..."
                  value={newRecipientText}
                  onChange={(e) => setNewRecipientText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewMsgModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteThreadTarget !== null}
        title="Delete Conversation"
        description="Are you sure you want to delete this chat conversation and its message history?"
        confirmLabel="Delete Conversation"
        isDestructive={true}
        onConfirm={handleDeleteThread}
        onClose={() => setDeleteThreadTarget(null)}
      />
    </div>
  );
};
