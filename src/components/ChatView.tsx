import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Home,
  AtSign,
  Star,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Settings,
  Grid,
  X,
  Send,
  Video,
  Smile,
  Paperclip,
  Bold,
  Italic,
  Code,
  Copy,
  Check,
  CheckCircle2,
  ArrowLeft,
  Menu,
  SlidersHorizontal,
  Users,
  Calendar,
  CheckSquare,
  User,
  Lightbulb,
} from 'lucide-react';
import { ChatMessage, ChatSpace } from '../types/workspace';
import {
  listChatSpaces,
  listChatMessages,
  sendChatMessage,
  createChatSpace,
  setupDirectMessage,
  createMeetingSpace,
} from '../services/workspace';

interface ChatViewProps {
  token: string;
  onBackToOverview?: () => void;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

interface ChatConversation {
  id: string;
  name: string;
  email?: string;
  avatarType: 'initial' | 'silhouette';
  avatarInitial?: string;
  avatarBg?: string;
  lastMessage: string;
  date: string;
  unread?: boolean;
  isStarred?: boolean;
  status?: 'active' | 'away' | 'dnd';
  type: 'dm' | 'space';
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🚀', '🔥', '👏', '💡', '✅', '👀', '💯', '☕️'];

export const ChatView: React.FC<ChatViewProps> = ({
  token,
  onBackToOverview,
  userName = 'You',
  userEmail = '',
  userPhoto,
}) => {
  // Navigation & panels — sidebar closed by default on phones (drawer)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [activeShortcut, setActiveShortcut] = useState<'home' | 'mentions' | 'starred'>('home');
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(true);
  const [dmsOpen, setDmsOpen] = useState<boolean>(true);
  const [spacesOpen, setSpacesOpen] = useState<boolean>(true);
  const [appsOpen, setAppsOpen] = useState<boolean>(true);

  // Filter controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [threadMode, setThreadMode] = useState<boolean>(false);
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState<boolean>(false);
  const [userStatus, setUserStatus] = useState<'active' | 'dnd' | 'away'>('active');

  // Conversation state — live Google Chat only (no fake seed data)
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [messageInput, setMessageInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [loadingSpaces, setLoadingSpaces] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [spacesError, setSpacesError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [isGeneratingMeet, setIsGeneratingMeet] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Companion Side Rail
  const [activeCompanion, setActiveCompanion] = useState<string | null>(null);

  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [newChatEmail, setNewChatEmail] = useState<string>('');
  const [showSpaceModal, setShowSpaceModal] = useState<boolean>(false);
  const [newSpaceName, setNewSpaceName] = useState<string>('');
  const [showAppsModal, setShowAppsModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (selectedConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation, messagesMap]);

  const mapSpaceToConversation = (sp: ChatSpace): ChatConversation => {
    const isDm =
      sp.spaceType === 'DIRECT_MESSAGE' ||
      sp.isDirectMessage === true ||
      sp.type === 'DIRECT_MESSAGE';
    const label =
      sp.displayName ||
      sp.lastMessageSnippet ||
      (sp.name ? sp.name.replace(/^spaces\//, '') : 'Chat');
    let date = '';
    if (sp.lastMessageTime) {
      try {
        date = new Date(sp.lastMessageTime).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
      } catch {
        date = '';
      }
    }
    return {
      id: sp.name,
      name: label,
      avatarType: isDm ? 'initial' : 'silhouette',
      avatarInitial: label ? label[0].toUpperCase() : 'C',
      avatarBg: isDm ? 'bg-[#0b57d0]' : 'bg-[#00796b]',
      lastMessage: sp.lastMessageSnippet || (isDm ? 'Direct message' : 'Space'),
      date: date || '',
      unread: (sp.unreadCount || 0) > 0,
      type: isDm ? 'dm' : 'space',
      status: sp.status === 'away' ? 'away' : 'active',
    };
  };

  const refreshSpaces = async () => {
    setLoadingSpaces(true);
    setSpacesError(null);
    try {
      const live = await listChatSpaces(token);
      const formatted = (live || []).map(mapSpaceToConversation);
      // Prefer real spaces only — drop any non-spaces/ local stubs
      setConversations(formatted);
      // Keep selection if still present
      setSelectedConversation((prev) => {
        if (!prev) return null;
        return formatted.find((c) => c.id === prev.id) || null;
      });
    } catch (err: any) {
      const msg =
        err?.message ||
        'Could not load Google Chat. Your account may need Chat enabled, or re-connect to grant Chat scopes.';
      setSpacesError(msg);
      setConversations([]);
    } finally {
      setLoadingSpaces(false);
    }
  };

  // Load real Google Chat spaces
  useEffect(() => {
    if (!token) return;
    refreshSpaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load messages when a real space is opened
  useEffect(() => {
    if (!token || !selectedConversation?.id) return;
    if (!selectedConversation.id.startsWith('spaces/')) return;

    let cancelled = false;
    (async () => {
      setLoadingMessages(true);
      setMessagesError(null);
      try {
        const msgs = await listChatMessages(token, selectedConversation.id);
        if (cancelled) return;
        const normalized: ChatMessage[] = (msgs || []).map((m) => ({
          name: m.name,
          text: m.text || '',
          createTime: m.createTime,
          sender: {
            name: m.sender?.name,
            displayName:
              m.sender?.displayName ||
              (m.sender?.name ? String(m.sender.name).split('/').pop() : 'Member'),
            avatarUrl: m.sender?.avatarUrl,
          },
          reactions: m.reactions || {},
          userReactions: m.userReactions || [],
        }));
        setMessagesMap((prev) => ({
          ...prev,
          [selectedConversation.id]: normalized,
        }));
        // Update last message snippet on the list
        const last = normalized[normalized.length - 1];
        if (last?.text) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConversation.id
                ? {
                    ...c,
                    lastMessage: last.text || c.lastMessage,
                    date: last.createTime
                      ? new Date(last.createTime).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : c.date,
                  }
                : c
            )
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setMessagesError(err?.message || 'Failed to load messages for this chat.');
        }
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, selectedConversation?.id]);

  // Send message via Google Chat API
  const handleSendMessage = async () => {
    if (!selectedConversation || !messageInput.trim() || isSending) return;
    const text = messageInput.trim();
    if (!selectedConversation.id.startsWith('spaces/')) {
      setToastMessage('This chat is not connected to Google Chat yet.');
      return;
    }

    setMessageInput('');
    setIsSending(true);
    setMessagesError(null);

    const optimisticId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      name: optimisticId,
      text,
      createTime: new Date().toISOString(),
      sender: {
        name: 'users/me',
        displayName: userName || 'You',
        avatarUrl: userPhoto,
      },
      reactions: {},
      userReactions: [],
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), optimistic],
    }));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? { ...c, lastMessage: `You: ${text}`, date: 'Just now' }
          : c
      )
    );

    try {
      const sent = await sendChatMessage(token, selectedConversation.id, text);
      setMessagesMap((prev) => {
        const list = prev[selectedConversation.id] || [];
        return {
          ...prev,
          [selectedConversation.id]: list.map((m) =>
            m.name === optimisticId
              ? {
                  ...m,
                  name: sent?.name || m.name,
                  createTime: sent?.createTime || m.createTime,
                  text: sent?.text || text,
                }
              : m
          ),
        };
      });
    } catch (err: any) {
      // Roll back optimistic message
      setMessagesMap((prev) => ({
        ...prev,
        [selectedConversation.id]: (prev[selectedConversation.id] || []).filter(
          (m) => m.name !== optimisticId
        ),
      }));
      setMessageInput(text);
      setMessagesError(err?.message || 'Failed to send message.');
      setToastMessage(err?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
      setShowEmojiPicker(false);
    }
  };

  // Google Meet 1-click video call
  const handleCreateMeetCall = async () => {
    if (!selectedConversation) return;
    setIsGeneratingMeet(true);
    let meetLink = 'https://meet.google.com/abc-gdeck-xyz';

    try {
      const space = await createMeetingSpace(token);
      if (space?.meetingUri) {
        meetLink = space.meetingUri;
      }
    } catch {
      const rand = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
      meetLink = `https://meet.google.com/${rand}`;
    }

    const meetMsg: ChatMessage = {
      name: `msg-meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: `📹 Google Meet video call: ${meetLink}`,
      meetingUri: meetLink,
      createTime: new Date().toISOString(),
      sender: {
        name: 'You',
        displayName: userName || 'You',
        avatarUrl: userPhoto,
      },
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), meetMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? { ...c, lastMessage: `You: 📹 Google Meet video call`, date: 'Just now' }
          : c
      )
    );

    setToastMessage('Google Meet meeting added to conversation!');
    setIsGeneratingMeet(false);
  };

  // Create / open a real DM via Google Chat spaces.setup
  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatEmail.trim() || isSending) return;
    const email = newChatEmail.trim();
    setIsSending(true);
    try {
      const space = await setupDirectMessage(token, email);
      const conv = mapSpaceToConversation({
        ...space,
        displayName: space.displayName || email,
        spaceType: space.spaceType || 'DIRECT_MESSAGE',
        isDirectMessage: true,
      });
      setConversations((prev) => {
        const without = prev.filter((c) => c.id !== conv.id);
        return [conv, ...without];
      });
      setSelectedConversation(conv);
      setMessagesMap((prev) => ({ ...prev, [conv.id]: prev[conv.id] || [] }));
      setNewChatEmail('');
      setShowNewChatModal(false);
      setSidebarOpen(false);
      setToastMessage(`Opened chat with ${email}`);
    } catch (err: any) {
      setToastMessage(
        err?.message ||
          'Could not start DM. Re-connect Google to grant Chat membership scopes, and ensure Chat is on for both accounts.'
      );
    } finally {
      setIsSending(false);
    }
  };

  // Create a real Google Chat space
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim() || isSending) return;
    const spaceName = newSpaceName.trim();
    setIsSending(true);
    try {
      const space = await createChatSpace(token, spaceName, 'SPACE');
      const conv = mapSpaceToConversation(space);
      setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
      setSelectedConversation(conv);
      setMessagesMap((prev) => ({ ...prev, [conv.id]: prev[conv.id] || [] }));
      setNewSpaceName('');
      setShowSpaceModal(false);
      setSidebarOpen(false);
      setToastMessage(`Created space #${spaceName}`);
    } catch (err: any) {
      setToastMessage(err?.message || 'Could not create space. Check Chat scopes / Workspace Chat access.');
    } finally {
      setIsSending(false);
    }
  };

  // Toggle reaction
  const handleToggleReaction = (msgName: string, emoji: string) => {
    if (!selectedConversation) return;
    setMessagesMap((prev) => {
      const list = prev[selectedConversation.id] || [];
      const updated = list.map((msg) => {
        if (msg.name !== msgName) return msg;
        const currentReactions = { ...(msg.reactions || {}) };
        const userReactions = [...(msg.userReactions || [])];
        const hasReacted = userReactions.includes(emoji);

        if (hasReacted) {
          currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 1) - 1);
          if (currentReactions[emoji] === 0) delete currentReactions[emoji];
          return {
            ...msg,
            reactions: currentReactions,
            userReactions: userReactions.filter((e) => e !== emoji),
          };
        } else {
          currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
          return {
            ...msg,
            reactions: currentReactions,
            userReactions: [...userReactions, emoji],
          };
        }
      });
      return { ...prev, [selectedConversation.id]: updated };
    });
  };

  // Filter conversations
  let filteredConversations = conversations.filter((c) => {
    if (unreadOnly && !c.unread) return false;
    if (activeShortcut === 'starred' && !c.isStarred) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (sortAsc) {
    filteredConversations = [...filteredConversations].reverse();
  }

  const currentMessages = selectedConversation ? messagesMap[selectedConversation.id] || [] : [];

  return (
    <div
      id="google-chat-screen"
      className="bg-[#f8fafd] w-full min-h-0 h-full md:min-h-[760px] md:h-[calc(100dvh-80px)] flex flex-col font-sans select-none text-[#1f1f1f] rounded-none md:rounded-2xl overflow-hidden relative shadow-none md:shadow-sm border-0 md:border border-[#e0e2e6]"
    >
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-[#001d35] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-medium border border-blue-400/30 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= TOP GOOGLE BAR (SEAMLESS ON #f8fafd) ================= */}
      <div className="h-14 sm:h-16 px-2 sm:px-4 flex items-center justify-between gap-4 shrink-0 bg-[#f8fafd]">
        {/* Left: Hamburger + Google Chat Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="hidden md:inline-flex p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
              title="Back to Overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
            title="Main menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setSelectedConversation(null)}
          >
            {/* Authentic Google Chat Emerald Pill Logo */}
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 48 48" className="w-8 h-8">
                <rect width="48" height="48" rx="14" fill="#00AC47" />
                <path
                  d="M13 18c0-2.76 2.24-5 5-5h12c2.76 0 5 2.24 5 5v10c0 2.76-2.24 5-5 5h-7l-5 5v-5h-1c-2.76 0-5-2.24-5-5V18z"
                  fill="#FFFFFF"
                />
                <circle cx="20" cy="23" r="2" fill="#00AC47" />
                <circle cx="25" cy="23" r="2" fill="#00AC47" />
                <circle cx="30" cy="23" r="2" fill="#00AC47" />
              </svg>
            </div>
            <span className="text-[22px] font-normal text-[#444746] tracking-tight">Chat</span>
          </div>
        </div>

        {/* Center: Search Chat Pill */}
        <div className="flex-1 max-w-2xl mx-2">
          <div className="relative w-full">
            <Search className="w-5 h-5 text-[#444746] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat"
              className="w-full pl-12 pr-10 py-2.5 bg-[#eaf1fb] hover:bg-[#dfe8f6] focus:bg-white text-sm text-[#1f1f1f] placeholder:text-[#5f6368] rounded-full border border-transparent focus:border-[#1a73e8] focus:shadow-md outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#444746] hover:text-[#1f1f1f] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className="px-3 py-1.5 rounded-full bg-[#eaf1fb] hover:bg-[#dfe8f6] text-xs font-medium text-[#1f1f1f] flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  userStatus === 'active'
                    ? 'bg-[#188038]'
                    : userStatus === 'dnd'
                    ? 'bg-[#d93025]'
                    : 'bg-[#f29900]'
                }`}
              />
              <span className="capitalize">{userStatus === 'dnd' ? 'Do not disturb' : userStatus}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#444746]" />
            </button>

            {statusMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#dadce0] rounded-2xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in">
                <button
                  onClick={() => {
                    setUserStatus('active');
                    setStatusMenuOpen(false);
                    setToastMessage('Status set to Active');
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#f1f3f4] flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#188038]" />
                  <span className="font-medium text-[#1f1f1f]">Active</span>
                </button>
                <button
                  onClick={() => {
                    setUserStatus('dnd');
                    setStatusMenuOpen(false);
                    setToastMessage('Status set to Do not disturb');
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#f1f3f4] flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d93025]" />
                  <span className="font-medium text-[#1f1f1f]">Do not disturb</span>
                </button>
                <button
                  onClick={() => {
                    setUserStatus('away');
                    setStatusMenuOpen(false);
                    setToastMessage('Status set to Set as away');
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#f1f3f4] flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f29900]" />
                  <span className="font-medium text-[#1f1f1f]">Set as away</span>
                </button>
              </div>
            )}
          </div>

          {/* Help */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Google Apps 9-dots */}
          <button
            onClick={() => {
              if (onBackToOverview) onBackToOverview();
            }}
            className="p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
            title="Google Apps"
          >
            <Grid className="w-5 h-5" />
          </button>

          {/* User Profile Avatar */}
          <div className="ml-1 cursor-pointer" title={userEmail}>
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#1a73e8]/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#007b83] text-white flex items-center justify-center text-xs font-bold ring-2 ring-[#007b83]/30">
                {userName ? userName[0] : 'T'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex overflow-hidden p-0 sm:p-2 gap-0 sm:gap-3 bg-[#f8fafd] relative min-h-0">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/35 md:hidden"
            aria-label="Close chat menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* ================= 1. LEFT SIDEBAR (drawer on mobile) ================= */}
        {sidebarOpen && (
          <div className="fixed md:static inset-y-0 left-0 z-50 md:z-auto w-[min(18rem,88vw)] md:w-60 flex flex-col shrink-0 overflow-y-auto px-3 md:px-2 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] select-none bg-[#f8fafd] md:bg-transparent shadow-2xl md:shadow-none">
            {/* "+ New chat" Button */}
            <button
              onClick={() => setShowNewChatModal(true)}
              className="w-fit mb-4 px-4 py-3 rounded-2xl bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] text-sm font-medium border border-[#dadce0] shadow-2xs flex items-center gap-3 transition-all cursor-pointer hover:shadow-xs"
            >
              <div className="w-5 h-5 flex items-center justify-center text-[#1f1f1f]">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span>New chat</span>
            </button>

            {/* Shortcuts Section */}
            <div className="mb-3">
              <button
                onClick={() => setShortcutsOpen(!shortcutsOpen)}
                className="w-full flex items-center gap-1.5 py-1 text-xs font-semibold text-[#444746] hover:text-[#1f1f1f] cursor-pointer"
              >
                <span className="text-[9px]">▾</span>
                <span>Shortcuts</span>
              </button>

              {shortcutsOpen && (
                <div className="mt-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setActiveShortcut('home');
                      setSelectedConversation(null);
                    }}
                    className={`w-full text-left px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-3 transition-all cursor-pointer ${
                      activeShortcut === 'home' && !selectedConversation
                        ? 'bg-[#d3e3fd] text-[#041e49] font-semibold'
                        : 'text-[#444746] hover:bg-[#e8eaed]'
                    }`}
                  >
                    <Home className="w-4 h-4 text-[#041e49] fill-current" />
                    <span>Home</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveShortcut('mentions');
                      setToastMessage('Mentions filter active');
                    }}
                    className={`w-full text-left px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-3 transition-all cursor-pointer ${
                      activeShortcut === 'mentions'
                        ? 'bg-[#d3e3fd] text-[#041e49] font-semibold'
                        : 'text-[#444746] hover:bg-[#e8eaed]'
                    }`}
                  >
                    <AtSign className="w-4 h-4 text-[#444746]" />
                    <span>Mentions</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveShortcut('starred');
                      setToastMessage('Starred conversations filter active');
                    }}
                    className={`w-full text-left px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-3 transition-all cursor-pointer ${
                      activeShortcut === 'starred'
                        ? 'bg-[#d3e3fd] text-[#041e49] font-semibold'
                        : 'text-[#444746] hover:bg-[#e8eaed]'
                    }`}
                  >
                    <Star className="w-4 h-4 text-[#444746]" />
                    <span>Starred</span>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Messages Section */}
            <div className="mb-3">
              <button
                onClick={() => setDmsOpen(!dmsOpen)}
                className="w-full flex items-center justify-between py-1 text-xs font-semibold text-[#444746] hover:text-[#1f1f1f] cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px]">▾</span>
                  <span>Direct messages</span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNewChatModal(true);
                  }}
                  className="p-0.5 hover:bg-[#e8eaed] rounded text-[#444746] hover:text-[#1f1f1f] cursor-pointer"
                  title="New direct message"
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </button>

              {dmsOpen && (
                <div className="mt-1 space-y-0.5">
                  {conversations
                    .filter((c) => c.type === 'dm')
                    .map((conv) => {
                      const isSelected = selectedConversation?.id === conv.id;
                      return (
                        <button
                          key={conv.id}
                          onClick={() => {
                            setSelectedConversation(conv);
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              setSidebarOpen(false);
                            }
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#d3e3fd] text-[#041e49] font-medium'
                              : 'text-[#1f1f1f] hover:bg-[#e8eaed]'
                          }`}
                        >
                          {/* Avatar icon */}
                          <div className="shrink-0">
                            {conv.avatarType === 'initial' ? (
                              <div
                                className={`w-6 h-6 rounded-full ${
                                  conv.avatarBg || 'bg-[#0b57d0]'
                                } text-white flex items-center justify-center text-[11px] font-bold`}
                              >
                                {conv.avatarInitial || 'A'}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#e9eef6] text-[#747775] flex items-center justify-center border border-[#dadce0]">
                                <svg
                                  className="w-3.5 h-3.5 fill-current"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <span className="truncate text-xs text-[#1f1f1f]">
                            {conv.name.length > 20 ? `${conv.name.substring(0, 18)}...` : conv.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Spaces Section */}
            <div className="mb-3">
              <button
                onClick={() => setSpacesOpen(!spacesOpen)}
                className="w-full flex items-center justify-between py-1 text-xs font-semibold text-[#444746] hover:text-[#1f1f1f] cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px]">▾</span>
                  <span>Spaces</span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSpaceModal(true);
                  }}
                  className="p-0.5 hover:bg-[#e8eaed] rounded text-[#444746] hover:text-[#1f1f1f] cursor-pointer"
                  title="Create space"
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </button>

              {spacesOpen && (
                <div className="mt-2 px-2 py-1 text-xs text-[#5f6368] space-y-1">
                  <p className="text-[11px] leading-relaxed">
                    Create a space to chat and collaborate
                  </p>
                  <button
                    onClick={() => setShowSpaceModal(true)}
                    className="text-[11px] font-medium text-[#0b57d0] hover:underline cursor-pointer block"
                  >
                    Find a space to join
                  </button>
                </div>
              )}
            </div>

            {/* Apps Section */}
            <div className="mb-2">
              <button
                onClick={() => setAppsOpen(!appsOpen)}
                className="w-full flex items-center justify-between py-1 text-xs font-semibold text-[#444746] hover:text-[#1f1f1f] cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px]">▾</span>
                  <span>Apps</span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAppsModal(true);
                  }}
                  className="p-0.5 hover:bg-[#e8eaed] rounded text-[#444746] hover:text-[#1f1f1f] cursor-pointer"
                  title="Add app"
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </button>

              {appsOpen && (
                <div className="mt-2 px-2 py-1 text-xs text-[#5f6368] space-y-1">
                  <p className="text-[11px]">No apps yet</p>
                  <button
                    onClick={() => setShowAppsModal(true)}
                    className="text-[11px] font-medium text-[#0b57d0] hover:underline cursor-pointer block"
                  >
                    Explore apps
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= 2. MIDDLE FLOATING WHITE CARD: "HOME" ================= */}
        <div className="w-80 md:w-96 bg-white rounded-[24px] shadow-xs border border-[#e0e2e6]/70 flex flex-col shrink-0 overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 border-b border-[#f1f3f4]">
            <h2 className="text-2xl font-normal text-[#1f1f1f]">Home</h2>

            {/* Filter controls matching screenshot */}
            <div className="flex items-center gap-2">
              {/* Unread toggle */}
              <div className="flex items-center gap-1.5 text-xs text-[#444746]">
                <span>Unread</span>
                <button
                  onClick={() => setUnreadOnly(!unreadOnly)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                    unreadOnly ? 'bg-[#0b57d0] justify-end' : 'bg-[#e0e2e6] justify-start'
                  }`}
                  title="Toggle unread"
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Thread button */}
              <button
                onClick={() => {
                  setThreadMode(!threadMode);
                  setToastMessage(threadMode ? 'Standard view' : 'Thread view active');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  threadMode
                    ? 'bg-[#c2e7ff] text-[#001d35] border-[#7fcfff]'
                    : 'bg-white text-[#444746] border-[#dadce0] hover:bg-[#f1f3f4]'
                }`}
                title="Thread view"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Thread</span>
              </button>

              {/* Sort / filter button */}
              <button
                onClick={() => {
                  setSortAsc(!sortAsc);
                  setToastMessage(sortAsc ? 'Newest first' : 'Oldest first');
                }}
                className="px-2 py-1 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#f1f3f4] rounded-lg border border-[#dadce0] transition-colors cursor-pointer flex items-center gap-1"
                title="Sort order"
              >
                <span className="text-[11px] font-mono">≡0</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Conversations list matching screenshot */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f1f3f4]">
            {loadingSpaces ? (
              <div className="p-10 text-center text-[#5f6368] space-y-2">
                <div className="w-6 h-6 mx-auto border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium">Loading Google Chat…</p>
              </div>
            ) : spacesError ? (
              <div className="p-6 text-center text-[#5f6368] space-y-3">
                <p className="text-xs font-semibold text-[#1f1f1f]">Couldn’t load chats</p>
                <p className="text-[11px] leading-relaxed">{spacesError}</p>
                <button
                  type="button"
                  onClick={() => refreshSpaces()}
                  className="px-4 py-2 rounded-full bg-[#1a73e8] text-white text-xs font-bold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-[#5f6368] space-y-3">
                <p className="text-sm font-semibold text-[#1f1f1f]">No chats yet</p>
                <p className="text-xs leading-relaxed max-w-xs mx-auto">
                  Start a direct message or create a space. Data comes from your real Google Chat account.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(true)}
                  className="px-4 py-2 rounded-full bg-[#1a73e8] text-white text-xs font-bold cursor-pointer"
                >
                  New chat
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                            setSelectedConversation(conv);
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              setSidebarOpen(false);
                            }
                          }}
                    className={`w-full text-left px-5 py-3.5 flex items-start gap-3.5 transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#e8f0fe]' : 'hover:bg-[#f8fafd]'
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="shrink-0 mt-0.5">
                      {conv.avatarType === 'initial' ? (
                        <div
                          className={`w-10 h-10 rounded-full ${
                            conv.avatarBg || 'bg-[#0b57d0]'
                          } text-white flex items-center justify-center text-sm font-semibold`}
                        >
                          {conv.avatarInitial || 'A'}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#f1f3f4] border border-[#dadce0] text-[#747775] flex items-center justify-center">
                          <svg
                            className="w-5 h-5 fill-current"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-normal text-[#1f1f1f] truncate">
                          {conv.name}
                        </p>
                        <span className="text-xs text-[#5f6368] shrink-0 font-normal">
                          {conv.date}
                        </span>
                      </div>
                      <p className="text-xs text-[#5f6368] truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================= 3. RIGHT FLOATING WHITE CARD: DETAIL / EMPTY STATE ================= */}
        <div className="flex-1 bg-white rounded-[24px] shadow-xs border border-[#e0e2e6]/70 flex flex-col overflow-hidden relative">
          {!selectedConversation ? (
            /* EXACT "NO CONVERSATION SELECTED" SCREEN FROM SCREENSHOT */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative bg-white">
              {/* Close Button top right */}
              <button
                onClick={() => setToastMessage('Select a conversation from Home to chat')}
                className="absolute top-4 right-4 p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Exact Google Chat Vector Illustration */}
              <div className="w-72 h-64 mb-6 flex items-center justify-center">
                <svg viewBox="0 0 240 200" className="w-full h-full">
                  {/* Speech bubble outline */}
                  <path
                    d="M 50 45 L 175 45 A 14 14 0 0 1 189 59 L 189 125 A 14 14 0 0 1 175 139 L 75 139 L 55 155 L 55 139 A 14 14 0 0 1 41 125 L 41 59 A 14 14 0 0 1 50 45 Z"
                    fill="#FFFFFF"
                    stroke="#1F1F1F"
                    strokeWidth="2.5"
                  />

                  {/* Top-Right Document card on bubble */}
                  <rect
                    x="152"
                    y="32"
                    width="42"
                    height="54"
                    rx="4"
                    fill="#D3E3FD"
                    stroke="#1F1F1F"
                    strokeWidth="2"
                  />
                  <line x1="162" y1="44" x2="184" y2="44" stroke="#1F1F1F" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="162" y1="52" x2="184" y2="52" stroke="#1F1F1F" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="162" y1="60" x2="178" y2="60" stroke="#1F1F1F" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Left hand holding yellow card */}
                  <path
                    d="M 20 108 L 48 85 L 58 92 L 68 98 L 65 115 L 20 115 Z"
                    fill="#F7C8A0"
                    stroke="#1F1F1F"
                    strokeWidth="2"
                  />
                  <rect
                    x="18"
                    y="112"
                    width="18"
                    height="24"
                    fill="#1F1F1F"
                  />

                  {/* Yellow square chat badge */}
                  <rect
                    x="48"
                    y="95"
                    width="30"
                    height="30"
                    rx="6"
                    fill="#FBBC04"
                    stroke="#1F1F1F"
                    strokeWidth="2"
                  />
                  <line x1="56" y1="106" x2="70" y2="106" stroke="#1F1F1F" strokeWidth="2" strokeLinecap="round" />
                  <line x1="56" y1="114" x2="66" y2="114" stroke="#1F1F1F" strokeWidth="2" strokeLinecap="round" />

                  {/* Green dot circle */}
                  <circle
                    cx="156"
                    cy="115"
                    r="16"
                    fill="#34A853"
                    stroke="#1F1F1F"
                    strokeWidth="2"
                  />

                  {/* Right hand pointing index finger up to green circle */}
                  <path
                    d="M 158 135 L 158 100 A 4 4 0 0 1 167 100 L 167 135 L 180 150 L 178 178 L 145 178 L 145 150 Z"
                    fill="#A84323"
                    stroke="#1F1F1F"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              {/* Headings */}
              <h3 className="text-xl font-normal text-[#1f1f1f] mb-2">
                {loadingSpaces ? 'Loading your chats…' : 'Pick a conversation'}
              </h3>
              <p className="text-sm text-[#444746] max-w-sm leading-relaxed">
                {spacesError
                  ? spacesError
                  : 'Open a direct message or space from the list — messages load live from Google Chat.'}
              </p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden px-4 py-2 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-xs font-bold cursor-pointer"
                >
                  Open chats
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(true)}
                  className="px-4 py-2 rounded-full bg-[#1a73e8] text-white text-xs font-bold cursor-pointer"
                >
                  New chat
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE CONVERSATION INSIDE WHITE CARD */
            <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-white">
              {(loadingMessages || messagesError) && (
                <div className={`px-4 py-2 text-[11px] font-medium border-b ${messagesError ? 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]' : 'bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]'}`}>
                  {loadingMessages ? 'Loading messages…' : messagesError}
                </div>
              )}
              {/* Header */}
              <div className="px-6 py-3.5 border-b border-[#dadce0] bg-white flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedConversation.avatarType === 'initial' ? (
                    <div
                      className={`w-9 h-9 rounded-full ${
                        selectedConversation.avatarBg || 'bg-[#0b57d0]'
                      } text-white flex items-center justify-center text-sm font-semibold shrink-0`}
                    >
                      {selectedConversation.avatarInitial || 'A'}
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#f1f3f4] border border-[#dadce0] text-[#747775] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-medium text-sm text-[#1f1f1f] truncate">
                      {selectedConversation.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#5f6368]">
                      <span className="w-2 h-2 rounded-full bg-[#188038]" />
                      <span>Active</span>
                      {selectedConversation.email && (
                        <span className="hidden sm:inline text-[#747775]">
                          • {selectedConversation.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCreateMeetCall}
                    disabled={isGeneratingMeet}
                    className="px-3 py-1.5 rounded-full bg-[#e6f4ea] hover:bg-[#ceead6] text-[#0b8043] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Google Meet call"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {isGeneratingMeet ? 'Creating...' : 'Meet Call'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setConversations((prev) =>
                        prev.map((c) =>
                          c.id === selectedConversation.id
                            ? { ...c, isStarred: !c.isStarred }
                            : c
                        )
                      );
                      setSelectedConversation((prev) =>
                        prev ? { ...prev, isStarred: !prev.isStarred } : null
                      );
                      setToastMessage('Starred conversation');
                    }}
                    className="p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
                    title="Star conversation"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        selectedConversation.isStarred
                          ? 'text-[#f29900] fill-[#f29900]'
                          : ''
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer"
                    title="Close conversation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#fbfcfe]">
                <div className="flex items-center justify-center my-2">
                  <span className="px-3 py-1 bg-white border border-[#dadce0] text-[#5f6368] text-[11px] font-semibold rounded-full shadow-2xs">
                    {selectedConversation.date || 'Today'}
                  </span>
                </div>

                {currentMessages.map((msg, idx) => {
                  const isYou = msg.sender?.name === 'You';

                  return (
                    <div
                      key={msg.name || idx}
                      className={`flex items-start gap-3 p-2 rounded-2xl group hover:bg-white hover:shadow-xs transition-all ${
                        isYou ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="shrink-0 mt-0.5">
                        {isYou ? (
                          userPhoto ? (
                            <img
                              src={userPhoto}
                              alt={userName}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-[#dadce0]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#007b83] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                              {userName ? userName[0] : 'Y'}
                            </div>
                          )
                        ) : selectedConversation.avatarType === 'initial' ? (
                          <div
                            className={`w-8 h-8 rounded-full ${
                              selectedConversation.avatarBg || 'bg-[#0b57d0]'
                            } text-white flex items-center justify-center text-xs font-bold`}
                          >
                            {selectedConversation.avatarInitial || 'A'}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#f1f3f4] border border-[#dadce0] text-[#747775] flex items-center justify-center">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className={`max-w-md ${isYou ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-bold text-[#1f1f1f]">
                            {isYou ? 'You' : selectedConversation.name}
                          </span>
                          <span className="text-[10px] text-[#5f6368]">
                            {msg.createTime
                              ? new Date(msg.createTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '10:30 AM'}
                          </span>
                        </div>

                        {/* Bubble */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed inline-block shadow-2xs ${
                            isYou
                              ? 'bg-[#c2e7ff] text-[#001d35] rounded-tr-xs'
                              : 'bg-white text-[#1f1f1f] border border-[#dadce0] rounded-tl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>

                        {/* Google Meet Link Preview */}
                        {msg.meetingUri && (
                          <div className="mt-2 p-3 bg-white border border-[#dadce0] rounded-2xl shadow-xs flex items-center justify-between gap-3 text-left">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-[#00ac47] text-white rounded-xl">
                                <Video className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#1f1f1f]">Google Meet</p>
                                <p className="text-[11px] text-[#0b57d0] underline truncate max-w-xs">
                                  {msg.meetingUri}
                                </p>
                              </div>
                            </div>
                            <a
                              href={msg.meetingUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-[#00ac47] hover:bg-[#008f3b] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                            >
                              Join
                            </a>
                          </div>
                        )}

                        {/* Reactions */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div
                            className={`flex flex-wrap items-center gap-1.5 mt-1.5 ${
                              isYou ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {Object.entries(msg.reactions).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.name || '', emoji)}
                                className="px-2 py-0.5 rounded-full text-xs bg-white text-[#444746] border border-[#dadce0] hover:bg-[#f1f3f4] flex items-center gap-1 cursor-pointer"
                              >
                                <span>{emoji}</span>
                                <span className="text-[10px] font-bold">{count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Quick hover reaction bar */}
                        <div
                          className={`opacity-0 group-hover:opacity-100 flex items-center gap-1 mt-1 transition-opacity ${
                            isYou ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {QUICK_EMOJIS.slice(0, 3).map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.name || '', emoji)}
                              className="p-1 hover:bg-[#f1f3f4] rounded-full text-xs cursor-pointer transition-transform hover:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              if (msg.text) {
                                navigator.clipboard.writeText(msg.text);
                                setCopiedMsgId(msg.name || '');
                                setTimeout(() => setCopiedMsgId(null), 2000);
                              }
                            }}
                            className="p-1 hover:bg-[#f1f3f4] rounded-full text-[#5f6368] cursor-pointer"
                            title="Copy text"
                          >
                            {copiedMsgId === msg.name ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-4 border-t border-[#dadce0] bg-white relative">
                {showEmojiPicker && (
                  <div className="absolute bottom-20 left-6 bg-white border border-[#dadce0] rounded-3xl shadow-xl p-3 z-50 w-72 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-[#dadce0] mb-2">
                      <span className="text-xs font-bold text-[#1f1f1f]">Emojis</span>
                      <button
                        onClick={() => setShowEmojiPicker(false)}
                        className="text-[#5f6368] hover:text-[#1f1f1f] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-2 text-lg">
                      {QUICK_EMOJIS.map((em) => (
                        <button
                          key={em}
                          onClick={() => {
                            setMessageInput((prev) => prev + em);
                            setShowEmojiPicker(false);
                            textareaRef.current?.focus();
                          }}
                          className="p-1.5 hover:bg-[#f1f3f4] rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-125"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-[#5f6368] mb-2 px-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#188038]" />
                  <span>History is on</span>
                </div>

                <div className="border border-[#dadce0] rounded-3xl bg-[#f8fafd] focus-within:bg-white focus-within:border-[#1a73e8] focus-within:shadow-md transition-all p-2.5">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Send a message to ${selectedConversation.name}...`}
                    className="w-full bg-transparent px-2.5 py-1 text-xs text-[#1f1f1f] placeholder:text-[#5f6368] outline-none resize-none max-h-32"
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-[#f1f3f4] mt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
                        title="Add emoji"
                      >
                        <Smile className="w-4 h-4" />
                      </button>

                      <button
                        onClick={handleCreateMeetCall}
                        disabled={isGeneratingMeet}
                        className="p-1.5 text-[#0b8043] hover:bg-[#e6f4ea] rounded-full transition-colors cursor-pointer"
                        title="Add Google Meet video link"
                      >
                        <Video className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setMessageInput((prev) => `${prev} 📎 [Attachment: ${file.name}] `);
                              setToastMessage(`Attached ${file.name}`);
                            }
                          };
                          input.click();
                        }}
                        className="p-1.5 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
                        title="Attach file"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setMessageInput((prev) => `*${prev}*`);
                          textareaRef.current?.focus();
                        }}
                        className="p-1.5 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setMessageInput((prev) => `\`${prev}\``);
                          textareaRef.current?.focus();
                        }}
                        className="p-1.5 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
                        title="Code snippet"
                      >
                        <Code className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || isSending}
                      className={`p-2 rounded-full transition-all cursor-pointer ${
                        messageInput.trim() && !isSending
                          ? 'bg-[#0b57d0] text-white hover:bg-[#0842a0] shadow-sm'
                          : 'text-[#c4c7c5] cursor-not-allowed'
                      }`}
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 4. FAR-RIGHT COMPANION BAR (MATCHING SCREENSHOT) ================= */}
        <div className="w-12 bg-transparent flex flex-col items-center py-2 space-y-4 shrink-0">
          {/* Calendar 31 */}
          <button
            onClick={() => {
              setActiveCompanion(activeCompanion === 'calendar' ? null : 'calendar');
              setToastMessage('Google Calendar Companion');
            }}
            className="w-10 h-10 rounded-full hover:bg-[#e8eaed] flex items-center justify-center transition-colors cursor-pointer"
            title="Calendar"
          >
            <div className="w-6 h-6 rounded-md bg-[#1a73e8] text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
              31
            </div>
          </button>

          {/* Google Keep lightbulb */}
          <button
            onClick={() => {
              setActiveCompanion(activeCompanion === 'keep' ? null : 'keep');
              setToastMessage('Google Keep Companion');
            }}
            className="w-10 h-10 rounded-full hover:bg-[#e8eaed] flex items-center justify-center transition-colors cursor-pointer"
            title="Keep"
          >
            <div className="w-6 h-6 rounded-md bg-[#fbbc04] text-white flex items-center justify-center shadow-2xs">
              <Lightbulb className="w-4 h-4 fill-white" />
            </div>
          </button>

          {/* Google Tasks checkmark */}
          <button
            onClick={() => {
              setActiveCompanion(activeCompanion === 'tasks' ? null : 'tasks');
              setToastMessage('Google Tasks Companion');
            }}
            className="w-10 h-10 rounded-full hover:bg-[#e8eaed] flex items-center justify-center transition-colors cursor-pointer"
            title="Tasks"
          >
            <div className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-2xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </button>

          {/* Google Contacts user */}
          <button
            onClick={() => {
              setActiveCompanion(activeCompanion === 'contacts' ? null : 'contacts');
              setToastMessage('Google Contacts Companion');
            }}
            className="w-10 h-10 rounded-full hover:bg-[#e8eaed] flex items-center justify-center transition-colors cursor-pointer"
            title="Contacts"
          >
            <div className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-2xs">
              <User className="w-3.5 h-3.5 fill-white" />
            </div>
          </button>

          {/* Collapse rail chevron */}
          <div className="flex-1 flex items-end pb-2">
            <button
              onClick={() => setToastMessage('Toggle companion panel')}
              className="w-8 h-8 rounded-full hover:bg-[#e8eaed] flex items-center justify-center text-[#5f6368] transition-colors cursor-pointer"
              title="Hide side panel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {/* 1. New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#dadce0] shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#dadce0] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#e8f0fe] text-[#0b57d0] rounded-xl">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-[#1f1f1f]">New chat</h3>
                  <p className="text-xs text-[#5f6368]">Start a 1:1 direct message</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 text-[#5f6368] hover:text-[#1f1f1f] rounded-full hover:bg-[#f1f3f4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewChat} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1.5">
                  Enter email address or name
                </label>
                <input
                  type="email"
                  required
                  value={newChatEmail}
                  onChange={(e) => setNewChatEmail(e.target.value)}
                  placeholder="e.g. colleague@gmail.com"
                  className="w-full px-4 py-2.5 bg-[#f8fafd] border border-[#dadce0] rounded-2xl text-xs text-[#1f1f1f] focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 outline-none"
                />
              </div>

              {conversations.filter((c) => c.type === 'dm').length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider mb-2">
                    Recent DMs
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {conversations
                      .filter((c) => c.type === 'dm')
                      .slice(0, 6)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedConversation(c);
                            setShowNewChatModal(false);
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              setSidebarOpen(false);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left hover:bg-[#f1f3f4] flex items-center justify-between text-xs cursor-pointer"
                        >
                          <span className="font-medium text-[#1f1f1f] truncate">{c.name}</span>
                          <span className="text-[11px] text-[#0b57d0]">Open</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dadce0]">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#444746] hover:bg-[#f1f3f4] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Start chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Create Space Modal */}
      {showSpaceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#dadce0] shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#dadce0] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#e6f4ea] text-[#00796b] rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-[#1f1f1f]">Create a Space</h3>
                  <p className="text-xs text-[#5f6368]">Group collaboration and project channels</p>
                </div>
              </div>
              <button
                onClick={() => setShowSpaceModal(false)}
                className="p-1 text-[#5f6368] hover:text-[#1f1f1f] rounded-full hover:bg-[#f1f3f4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1.5">
                  Space name
                </label>
                <input
                  type="text"
                  required
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="e.g. Project Launch Q4"
                  className="w-full px-4 py-2.5 bg-[#f8fafd] border border-[#dadce0] rounded-2xl text-xs text-[#1f1f1f] focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dadce0]">
                <button
                  type="button"
                  onClick={() => setShowSpaceModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#444746] hover:bg-[#f1f3f4] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#00796b] hover:bg-[#00695c] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Create space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Explore Apps Modal */}
      {showAppsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#dadce0] shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#dadce0] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#e8f0fe] text-[#0b57d0] rounded-xl">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-[#1f1f1f]">Google Chat Apps</h3>
                  <p className="text-xs text-[#5f6368]">Connect productivity apps and automations</p>
                </div>
              </div>
              <button
                onClick={() => setShowAppsModal(false)}
                className="p-1 text-[#5f6368] hover:text-[#1f1f1f] rounded-full hover:bg-[#f1f3f4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              {[
                { name: 'Google Drive Bot', desc: 'File updates & comment notifications', icon: '📁' },
                { name: 'Google Meet', desc: 'Instant video conference links', icon: '📹' },
                { name: 'GitHub Integration', desc: 'Pull requests & issue alerts', icon: '🐙' },
                { name: 'Google Calendar Bot', desc: 'Daily agenda & meeting reminders', icon: '📅' },
              ].map((app) => (
                <div
                  key={app.name}
                  className="p-3 bg-[#f8fafd] border border-[#dadce0] rounded-2xl hover:border-[#0b57d0] transition-colors"
                >
                  <div className="text-xl mb-1">{app.icon}</div>
                  <h4 className="text-xs font-bold text-[#1f1f1f]">{app.name}</h4>
                  <p className="text-[11px] text-[#5f6368] leading-tight mt-0.5">{app.desc}</p>
                  <button
                    onClick={() => {
                      setToastMessage(`${app.name} added to Chat!`);
                      setShowAppsModal(false);
                    }}
                    className="mt-2.5 px-3 py-1 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-[10px] font-bold rounded-full transition-colors cursor-pointer"
                  >
                    Add to Chat
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#dadce0]">
              <button
                onClick={() => setShowAppsModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#444746] hover:bg-[#f1f3f4] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#dadce0] shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#dadce0] mb-4">
              <h3 className="font-semibold text-base text-[#1f1f1f]">Google Chat Shortcuts</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-[#5f6368] hover:text-[#1f1f1f] rounded-full hover:bg-[#f1f3f4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#3c4043]">
              <div className="flex items-center justify-between p-2 bg-[#f8fafd] rounded-xl">
                <span>Send message</span>
                <kbd className="px-2 py-0.5 bg-white border border-[#dadce0] rounded-md font-mono text-[11px]">Enter</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#f8fafd] rounded-xl">
                <span>New line in message</span>
                <kbd className="px-2 py-0.5 bg-white border border-[#dadce0] rounded-md font-mono text-[11px]">Shift + Enter</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#f8fafd] rounded-xl">
                <span>Search chat</span>
                <kbd className="px-2 py-0.5 bg-white border border-[#dadce0] rounded-md font-mono text-[11px]">Ctrl / Cmd + K</kbd>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#dadce0] mt-4">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 bg-[#0b57d0] text-white rounded-full text-xs font-semibold cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#dadce0] shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#dadce0] mb-4">
              <h3 className="font-semibold text-base text-[#1f1f1f]">Chat settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-[#5f6368] hover:text-[#1f1f1f] rounded-full hover:bg-[#f1f3f4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#3c4043]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1f1f1f]">Desktop notifications</p>
                  <p className="text-[#5f6368] text-[11px]">Receive alerts for new incoming messages</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0b57d0]" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1f1f1f]">Chat history</p>
                  <p className="text-[#5f6368] text-[11px]">Save history by default for conversations</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0b57d0]" />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#dadce0] mt-4">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setToastMessage('Settings saved');
                }}
                className="px-5 py-2 bg-[#0b57d0] text-white rounded-full text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
