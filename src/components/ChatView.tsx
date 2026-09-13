import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  RefreshCw,
  Hash,
  User,
  Users,
  ExternalLink,
  Info,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { ChatSpace, ChatMessage } from '../types/workspace';
import { listChatSpaces, listChatMessages, sendChatMessage } from '../services/workspace';
import { ConfirmModal } from './ConfirmModal';
import { GoogleChatIcon } from './GoogleIcons';

interface ChatViewProps {
  token: string;
  onBackToOverview?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ token, onBackToOverview }) => {
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ChatSpace | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Send message state
  const [messageText, setMessageText] = useState<string>('');
  const [showSendConfirm, setShowSendConfirm] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  const loadSpaces = async () => {
    setLoadingSpaces(true);
    setError(null);
    try {
      const data = await listChatSpaces(token);
      setSpaces(data);
      if (data.length > 0 && !selectedSpace) {
        setSelectedSpace(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load Google Chat spaces. Note: Chat Spaces require a Google Workspace or Chat-enabled account.');
    } finally {
      setLoadingSpaces(false);
    }
  };

  const loadMessages = async (spaceName: string) => {
    setLoadingMessages(true);
    setError(null);
    try {
      const data = await listChatMessages(token, spaceName);
      setMessages(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages from space');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadSpaces();
  }, [token]);

  useEffect(() => {
    if (selectedSpace) {
      loadMessages(selectedSpace.name);
    }
  }, [selectedSpace, token]);

  const handleConfirmSend = async () => {
    if (!selectedSpace || !messageText.trim()) return;
    setIsSending(true);
    try {
      await sendChatMessage(token, selectedSpace.name, messageText.trim());
      setMessageText('');
      setShowSendConfirm(false);
      setSuccessMsg('Message sent successfully!');
      loadMessages(selectedSpace.name);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="chat-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="chat-back-to-overview-btn"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-emerald-500/10 border border-emerald-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleChatIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Chat</h2>
            <p className="text-sm text-slate-500">Collaborate with your team across spaces and direct messages</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://chat.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-slate-600 hover:text-emerald-700 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Open Google Chat web"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => {
              loadSpaces();
              if (selectedSpace) loadMessages(selectedSpace.name);
            }}
            disabled={loadingSpaces || loadingMessages}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Refresh chat"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingSpaces || loadingMessages ? 'animate-spin text-emerald-600' : ''}`}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50/80 backdrop-blur-md border border-red-200/80 text-red-700 rounded-2xl text-sm flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50/80 backdrop-blur-md border border-emerald-200/80 text-emerald-700 rounded-2xl text-sm flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Main chat layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] overflow-hidden h-[580px]">
        {/* Spaces Sidebar */}
        <div className="md:col-span-4 border-r border-slate-100 flex flex-col h-full bg-slate-50/40">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 font-semibold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Chat Spaces ({spaces.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingSpaces ? (
              <div className="p-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                <p className="text-xs">Loading spaces...</p>
              </div>
            ) : spaces.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 stroke-1 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">No spaces available</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Create a space in Google Chat to start chatting
                </p>
              </div>
            ) : (
              spaces.map((sp) => {
                const isSelected = selectedSpace?.name === sp.name;
                return (
                  <button
                    key={sp.name}
                    id={`chat-space-${sp.name.replace('/', '-')}`}
                    onClick={() => setSelectedSpace(sp)}
                    className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-3 border-emerald-600'
                        : 'text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-500">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="truncate flex-1 min-w-0">
                      <p className="text-sm truncate">{sp.displayName || sp.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {sp.spaceType || 'Space'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="md:col-span-8 flex flex-col h-full">
          {selectedSpace ? (
            <>
              {/* Space Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {selectedSpace.displayName || selectedSpace.name}
                  </h3>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/20">
                {loadingMessages ? (
                  <div className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <p className="text-xs">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <MessageSquare className="w-8 h-8 stroke-1 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs text-slate-500 font-medium">No messages yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Send a message below to start the conversation
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={m.name || idx}
                      className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">
                          {m.sender?.displayName || m.sender?.name || 'Participant'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {m.createTime ? new Date(m.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{m.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Composer */}
              <div className="p-3 border-t border-slate-100 bg-white">
                <div className="flex gap-2">
                  <input
                    id="chat-message-input"
                    type="text"
                    placeholder={`Message #${selectedSpace.displayName || 'space'}...`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && messageText.trim()) {
                        setShowSendConfirm(true);
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    id="send-chat-btn"
                    disabled={!messageText.trim() || isSending}
                    onClick={() => setShowSendConfirm(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 stroke-1 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">Select a Space</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Pick a space from the left column to view conversations and participate
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Sending Chat Message */}
      <ConfirmModal
        isOpen={showSendConfirm}
        title="Confirm Send Chat Message"
        description={`Send this message to space "${selectedSpace?.displayName || selectedSpace?.name}"?`}
        confirmLabel="Confirm & Post Message"
        isDestructive={false}
        isLoading={isSending}
        itemsList={[`Space: ${selectedSpace?.displayName || selectedSpace?.name}`, `Message: ${messageText}`]}
        onConfirm={handleConfirmSend}
        onCancel={() => setShowSendConfirm(false)}
      />
    </div>
  );
};
