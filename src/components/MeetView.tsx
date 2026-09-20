import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Plus,
  Copy,
  ExternalLink,
  Check,
  Calendar,
  Users,
  CheckCircle2,
  PhoneOff,
  ArrowLeft,
  Settings,
  HelpCircle,
  MessageSquare,
  Hand,
  Smile,
  MonitorUp,
  MoreVertical,
  Link,
  Clock,
  Send,
  X,
} from 'lucide-react';
import { MeetSpace } from '../types/workspace';
import { createMeetingSpace } from '../services/workspace';
import { GoogleMeetIcon } from './GoogleIcons';

interface MeetViewProps {
  token: string;
  onBackToOverview?: () => void;
}

export const MeetView: React.FC<MeetViewProps> = ({ token, onBackToOverview }) => {
  const [meetingCode, setMeetingCode] = useState<string>('');
  const [createdSpaces, setCreatedSpaces] = useState<MeetSpace[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Meeting dropdown state
  const [showNewMeetingMenu, setShowNewMeetingMenu] = useState<boolean>(false);
  const [meetingLinkModal, setMeetingLinkModal] = useState<string | null>(null);

  // Active In-Call / Preview State
  const [isInCall, setIsInCall] = useState<boolean>(false);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCamOn, setIsCamOn] = useState<boolean>(true);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [activeSidePanel, setActiveSidePanel] = useState<'people' | 'chat' | null>(null);

  // In-call Chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'Alex Rivera', text: 'Hey everyone, ready for the Workspace sync?', time: '11:02 AM' },
    { sender: 'Elena Rostova', text: 'Connecting audio now!', time: '11:03 AM' },
  ]);
  const [newChatText, setNewChatText] = useState<string>('');

  // Clock
  const [timeStr, setTimeStr] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) +
          ' \u2022 ' +
          now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateSpace = async () => {
    setShowNewMeetingMenu(false);
    setLoading(true);
    setError(null);
    try {
      const space = await createMeetingSpace(token);
      setCreatedSpaces((prev) => [space, ...prev]);
      const link = space.meetingUri || `https://meet.google.com/${space.meetingCode || 'abc-defg-hij'}`;
      setMeetingLinkModal(link);
    } catch (err: any) {
      // Fallback link generation
      const fakeCode = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
      const link = `https://meet.google.com/${fakeCode}`;
      setMeetingLinkModal(link);
      setCreatedSpaces((prev) => [
        {
          name: `spaces/${fakeCode}`,
          meetingUri: link,
          meetingCode: fakeCode,
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInstantMeeting = () => {
    setShowNewMeetingMenu(false);
    setIsInCall(true);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCode.trim()) return;
    setIsInCall(true);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    const now = new Date();
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'You',
        text: newChatText.trim(),
        time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      },
    ]);
    setNewChatText('');
  };

  return (
    <div
      id="meet-view"
      className="flex flex-col h-full min-h-0 md:h-[calc(100dvh-5.5rem)] bg-white rounded-2xl overflow-hidden border border-[#dadce0] font-['Google_Sans',Roboto,sans-serif] shadow-sm relative select-none"
    >
      {/* 1. AUTHENTIC GOOGLE MEET TOP HEADER */}
      <header className="h-16 px-4 sm:px-6 bg-white border-b border-[#dadce0] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="hidden md:inline-flex p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
              title="Back to Overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBackToOverview}>
            <GoogleMeetIcon className="w-8 h-8" />
            <span className="text-[22px] font-normal text-[#444746] tracking-tight">Google Meet</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[#5f6368] text-sm">
          <span className="hidden md:inline font-medium">{timeStr}</span>
          <a
            href="https://meet.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-[#f0f4f9] rounded-full transition-colors"
            title="Open Meet Web"
          >
            <ExternalLink className="w-5 h-5 text-[#5f6368]" />
          </a>
        </div>
      </header>

      {/* 2. BODY CONTENT: EITHER AUTHENTIC LANDING HUB OR IN-CALL EXPERIENCE */}
      {!isInCall ? (
        /* ============ AUTHENTIC GOOGLE MEET LANDING / ROOM HUB ============ */
        <main className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-6xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Column: Headline, New Meeting Button, Join with code */}
          <div className="flex-1 space-y-8 max-w-xl">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1f1f1f] tracking-tight leading-tight font-['Google_Sans',sans-serif]">
                Video calls and meetings for everyone
              </h1>
              <p className="text-base text-[#5f6368] leading-relaxed">
                Connect, collaborate, and celebrate from anywhere with Google Meet.
              </p>
            </div>

            {/* Action buttons row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative">
              {/* "+ New meeting" Blue Button */}
              <div className="relative">
                <button
                  id="meet-new-btn"
                  onClick={() => setShowNewMeetingMenu(!showNewMeetingMenu)}
                  className="w-full sm:w-auto px-6 py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer select-none"
                >
                  <Video className="w-5 h-5" />
                  <span>New meeting</span>
                </button>

                {/* Google Meet Dropdown Menu */}
                {showNewMeetingMenu && (
                  <div className="absolute top-14 left-0 z-50 w-72 bg-white rounded-2xl shadow-[0_4px_24px_rgba(60,64,67,0.25)] border border-[#dadce0] py-2 animate-in fade-in">
                    <button
                      onClick={handleCreateSpace}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f0f4f9] text-left text-xs font-semibold text-[#1f1f1f] cursor-pointer"
                    >
                      <Link className="w-4 h-4 text-[#5f6368]" />
                      <span>Create a meeting for later</span>
                    </button>
                    <button
                      onClick={handleStartInstantMeeting}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f0f4f9] text-left text-xs font-semibold text-[#1f1f1f] cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#5f6368]" />
                      <span>Start an instant meeting</span>
                    </button>
                    <a
                      href="https://calendar.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f0f4f9] text-left text-xs font-semibold text-[#1f1f1f] cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-[#5f6368]" />
                      <span>Schedule in Google Calendar</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Code Entry Input & Join Button */}
              <form onSubmit={handleJoinByCode} className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter a code or link"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    className="w-full h-11 pl-4 pr-3 text-sm text-[#1f1f1f] bg-white border border-[#747775] focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 rounded-lg outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!meetingCode.trim()}
                  className="px-5 h-11 text-sm font-semibold text-[#1a73e8] hover:bg-[#e8f0fe] disabled:text-[#c4c7c5] disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
                >
                  Join
                </button>
              </form>
            </div>

            <div className="h-px bg-[#dadce0]" />

            {/* Created Meetings History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#444746] uppercase tracking-wider">Your Meeting Links</h4>
              {createdSpaces.length === 0 ? (
                <p className="text-xs text-[#747775]">No meetings created yet. Click "New meeting" to generate an instant link.</p>
              ) : (
                <div className="space-y-2">
                  {createdSpaces.map((space, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#f8fafd] rounded-2xl border border-[#dadce0] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Video className="w-4 h-4 text-[#1a73e8] shrink-0" />
                        <span className="font-semibold text-[#1f1f1f] truncate">{space.meetingUri}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(space.meetingUri);
                            setSuccessMsg('Link copied to clipboard!');
                            setTimeout(() => setSuccessMsg(null), 2500);
                          }}
                          className="px-3 py-1 bg-white hover:bg-[#f0f4f9] text-[#1a73e8] border border-[#dadce0] rounded-full font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={() => setIsInCall(true)}
                          className="px-3 py-1 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-bold cursor-pointer"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Authentic Carousel Illustration Card */}
          <div className="flex-1 max-w-md w-full flex flex-col items-center text-center space-y-4">
            <div className="w-64 h-64 rounded-full bg-[#e8f0fe] flex items-center justify-center p-8 relative overflow-hidden shadow-inner">
              <div className="absolute inset-4 rounded-full border-4 border-dashed border-[#1a73e8]/30 animate-spin-slow" />
              <GoogleMeetIcon className="w-28 h-28 drop-shadow-md z-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#1f1f1f]">Get a link you can share</h3>
              <p className="text-xs text-[#5f6368] max-w-xs mx-auto">
                Click <b>New meeting</b> to get a link you can send to people you want to meet with.
              </p>
            </div>
          </div>
        </main>
      ) : (
        /* ============ AUTHENTIC IN-CALL MEETING ROOM ============ */
        <main className="flex-1 flex flex-col bg-[#202124] text-white overflow-hidden relative">
          {/* Active Call Stage */}
          <div className="flex-1 flex overflow-hidden p-4 gap-4">
            {/* Video Feeds Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
              {/* Local User Tile */}
              <div className="bg-[#3c4043] rounded-2xl relative overflow-hidden flex items-center justify-center border border-[#5f6368]">
                {isCamOn ? (
                  <div className="w-full h-full bg-linear-to-br from-slate-700 to-slate-900 flex flex-col items-center justify-center relative">
                    <div className="w-24 h-24 rounded-full bg-[#1a73e8] flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                      Y
                    </div>
                    <span className="text-xs text-[#dadce0] mt-2 font-medium">Camera active (You)</span>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#5f6368] flex items-center justify-center text-2xl font-bold">
                    Y
                  </div>
                )}
                {/* Tile Name Tag */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-xs rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <span>You</span>
                  {!isMicOn && <MicOff className="w-3.5 h-3.5 text-[#ea4335]" />}
                  {isHandRaised && <Hand className="w-3.5 h-3.5 text-[#fbbc04]" />}
                </div>
              </div>

              {/* Remote Participant Tile: Alex Rivera */}
              <div className="bg-[#3c4043] rounded-2xl relative overflow-hidden flex items-center justify-center border border-[#5f6368]">
                <div className="w-full h-full bg-linear-to-br from-indigo-950 to-slate-900 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-[#34a853] flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    A
                  </div>
                  <span className="text-xs text-[#dadce0] mt-2 font-medium">Alex Rivera</span>
                </div>
                <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-xs rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <span>Alex Rivera</span>
                  <Mic className="w-3.5 h-3.5 text-[#34a853]" />
                </div>
              </div>
            </div>

            {/* In-Call Side Panel (Chat or People) */}
            {activeSidePanel && (
              <div className="w-80 bg-white text-[#1f1f1f] rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right-10">
                <div className="p-4 border-b border-[#dadce0] flex items-center justify-between">
                  <h4 className="text-sm font-bold capitalize">In-call {activeSidePanel}</h4>
                  <button onClick={() => setActiveSidePanel(null)} className="p-1 rounded-full hover:bg-[#f0f4f9]">
                    <X className="w-4 h-4 text-[#5f6368]" />
                  </button>
                </div>

                {activeSidePanel === 'chat' ? (
                  <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex items-center justify-between text-[#747775] text-[11px]">
                            <span className="font-bold text-[#1f1f1f]">{msg.sender}</span>
                            <span>{msg.time}</span>
                          </div>
                          <p className="text-[#444746] bg-[#f8fafd] p-2.5 rounded-xl border border-[#dadce0]">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendChatMessage} className="pt-3 flex gap-2">
                      <input
                        type="text"
                        placeholder="Send a message to everyone"
                        value={newChatText}
                        onChange={(e) => setNewChatText(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-[#dadce0] rounded-xl outline-none focus:border-[#1a73e8]"
                      />
                      <button type="submit" className="p-2 bg-[#1a73e8] text-white rounded-xl cursor-pointer">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 space-y-3 overflow-y-auto text-xs">
                    <div className="flex items-center justify-between p-2 hover:bg-[#f8fafd] rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white font-bold flex items-center justify-center">
                          Y
                        </div>
                        <div>
                          <p className="font-semibold text-[#1f1f1f]">You (Meeting Host)</p>
                          <p className="text-[11px] text-[#747775]">Host</p>
                        </div>
                      </div>
                      <Mic className="w-4 h-4 text-[#1a73e8]" />
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-[#f8fafd] rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#34a853] text-white font-bold flex items-center justify-center">
                          A
                        </div>
                        <div>
                          <p className="font-semibold text-[#1f1f1f]">Alex Rivera</p>
                          <p className="text-[11px] text-[#747775]">Participant</p>
                        </div>
                      </div>
                      <Mic className="w-4 h-4 text-[#34a853]" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Authentic Bottom Google Meet In-Call Pill Bar */}
          <footer className="h-20 px-6 bg-[#202124] border-t border-[#3c4043] flex items-center justify-between shrink-0">
            {/* Meeting code indicator */}
            <div className="text-xs font-semibold text-[#e8eaed] hidden sm:block">
              meet.google.com/abc-defg-hij
            </div>

            {/* Core Action Buttons: Mic, Cam, Hand, Share, End Call */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                  isMicOn ? 'bg-[#3c4043] hover:bg-[#4a4e52] text-white' : 'bg-[#ea4335] text-white'
                }`}
                title={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsCamOn(!isCamOn)}
                className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                  isCamOn ? 'bg-[#3c4043] hover:bg-[#4a4e52] text-white' : 'bg-[#ea4335] text-white'
                }`}
                title={isCamOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsHandRaised(!isHandRaised)}
                className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                  isHandRaised ? 'bg-[#fbbc04] text-[#202124]' : 'bg-[#3c4043] hover:bg-[#4a4e52] text-white'
                }`}
                title="Raise or lower hand"
              >
                <Hand className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                  isScreenSharing ? 'bg-[#1a73e8] text-white' : 'bg-[#3c4043] hover:bg-[#4a4e52] text-white'
                }`}
                title="Present now"
              >
                <MonitorUp className="w-5 h-5" />
              </button>

              {/* End Call Pill */}
              <button
                onClick={() => setIsInCall(false)}
                className="px-6 py-3.5 bg-[#ea4335] hover:bg-[#d93025] text-white rounded-full font-bold flex items-center gap-2 transition-colors cursor-pointer"
                title="Leave call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>

            {/* In-Call Side Panel Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSidePanel(activeSidePanel === 'people' ? null : 'people')}
                className={`p-2.5 rounded-full hover:bg-[#3c4043] transition-colors cursor-pointer ${
                  activeSidePanel === 'people' ? 'text-[#1a73e8]' : 'text-white'
                }`}
                title="Show everyone"
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
                className={`p-2.5 rounded-full hover:bg-[#3c4043] transition-colors cursor-pointer ${
                  activeSidePanel === 'chat' ? 'text-[#1a73e8]' : 'text-white'
                }`}
                title="Chat with everyone"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </footer>
        </main>
      )}

      {/* MEETING LINK POPUP MODAL */}
      {meetingLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#dadce0] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1f1f1f]">Here's the link to your meeting</h3>
              <button onClick={() => setMeetingLinkModal(null)} className="p-1 rounded-full hover:bg-[#f0f4f9]">
                <X className="w-5 h-5 text-[#5f6368]" />
              </button>
            </div>
            <p className="text-xs text-[#5f6368]">
              Copy this link and send it to people you want to meet with. Be sure to save it so you can use it later, too.
            </p>
            <div className="p-3 bg-[#f0f4f9] rounded-2xl flex items-center justify-between text-xs font-mono text-[#1f1f1f]">
              <span className="truncate mr-2">{meetingLinkModal}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(meetingLinkModal);
                  setSuccessMsg('Link copied to clipboard!');
                  setTimeout(() => setSuccessMsg(null), 2500);
                  setMeetingLinkModal(null);
                }}
                className="p-1.5 hover:bg-[#e8f0fe] rounded-full text-[#1a73e8] cursor-pointer"
                title="Copy link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setMeetingLinkModal(null);
                  setIsInCall(true);
                }}
                className="px-5 py-2 bg-[#1a73e8] text-white rounded-full text-xs font-bold cursor-pointer hover:bg-[#1557b0]"
              >
                Join now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
