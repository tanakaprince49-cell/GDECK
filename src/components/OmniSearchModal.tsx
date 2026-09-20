import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Mail,
  Calendar,
  CheckSquare,
  HardDrive,
  ExternalLink,
  ArrowRight,
  Clock,
  Lock,
  Tag,
} from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import { listGmailMessages, listCalendarEvents, listDriveFiles, listTaskLists, listTasks } from '../services/workspace';
import { GmailIcon, GoogleCalendarIcon, GoogleDriveIcon, GoogleTasksIcon } from './GoogleIcons';
import { ProBadge } from './ProBadge';

interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onNavigateTab: (tabId: string) => void;
}

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({
  isOpen,
  onClose,
  token,
  onNavigateTab,
}) => {
  const { isPro, openUpgradeModal } = usePlan();
  const [query, setQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'gmail' | 'calendar' | 'drive' | 'tasks'>('all');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [gmailResults, setGmailResults] = useState<any[]>([]);
  const [calendarResults, setCalendarResults] = useState<any[]>([]);
  const [driveResults, setDriveResults] = useState<any[]>([]);
  const [taskResults, setTaskResults] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Execute Omni-Search across all 4 Google Workspace tools simultaneously
  useEffect(() => {
    if (!isOpen || !token || !query.trim()) {
      setGmailResults([]);
      setCalendarResults([]);
      setDriveResults([]);
      setTaskResults([]);
      return;
    }

    // Debounce search by 300ms
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const q = query.trim().toLowerCase();

      try {
        const [emails, events, files, taskLists] = await Promise.all([
          listGmailMessages(token, 15, query).catch(() => []),
          listCalendarEvents(token).catch(() => []),
          listDriveFiles(token, query).catch(() => []),
          listTaskLists(token).catch(() => []),
        ]);

        // Filter emails
        const matchedEmails = (emails || []).slice(0, 5);
        setGmailResults(matchedEmails);

        // Filter calendar events
        const matchedEvents = (events || [])
          .filter(
            (e: any) =>
              (e.summary && e.summary.toLowerCase().includes(q)) ||
              (e.description && e.description.toLowerCase().includes(q)) ||
              (e.location && e.location.toLowerCase().includes(q))
          )
          .slice(0, 5);
        setCalendarResults(matchedEvents);

        // Filter drive files
        const matchedFiles = (files || []).slice(0, 5);
        setDriveResults(matchedFiles);

        // Search tasks across task lists
        if (taskLists && taskLists.length > 0) {
          const tasks = await listTasks(token, taskLists[0].id).catch(() => []);
          const matchedTasks = (tasks || [])
            .filter(
              (t: any) =>
                (t.title && t.title.toLowerCase().includes(q)) ||
                (t.notes && t.notes.toLowerCase().includes(q))
            )
            .slice(0, 5);
          setTaskResults(matchedTasks);
        }
      } catch (err) {
        console.error('Omni search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen, token]);

  if (!isOpen) return null;

  // If user is Free and tries to use OmniSearch
  if (!isPro) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl border border-[#dadce0] p-6 max-w-lg w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs font-bold mb-2">
              <span>G-DECK PRO FEATURE</span>
            </div>
            <h3 className="text-lg font-bold text-[#1f1f1f]">Unified Global Omni-Search</h3>
            <p className="text-xs text-[#5f6368] mt-1">
              Free search operates only within individual tabs. Pro connects Gmail, Calendar, Drive, and Tasks in a unified instant search bar (Cmd/Ctrl + K).
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                onClose();
                openUpgradeModal({
                  title: 'Unified Global Omni-Search',
                  desc: 'Search simultaneously across Gmail messages, Calendar event descriptions, Drive documents, and Tasks in a single search bar.',
                });
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              Unlock Pro ($12/mo)
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#1f1f1f] rounded-full text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalResults =
    gmailResults.length + calendarResults.length + driveResults.length + taskResults.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-[#dadce0] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#dadce0] flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-[#7e22ce] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Global Omni-Search: Type keywords to search across Gmail, Drive, Calendar & Tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm sm:text-base text-[#1f1f1f] placeholder-[#5f6368] outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-[#5f6368] hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ProBadge featureTitle="Global Omni-Search" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#5f6368] hover:bg-slate-100 cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 bg-[#f8fafd] border-b border-[#dadce0] flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#7e22ce] text-white font-bold'
                : 'bg-white text-[#5f6368] hover:bg-slate-100 border border-[#dadce0]'
            }`}
          >
            All Results ({totalResults})
          </button>
          <button
            onClick={() => setActiveFilter('gmail')}
            className={`px-3 py-1 rounded-full font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFilter === 'gmail'
                ? 'bg-[#ea4335] text-white font-bold'
                : 'bg-white text-[#5f6368] hover:bg-slate-100 border border-[#dadce0]'
            }`}
          >
            <GmailIcon className="w-3.5 h-3.5" />
            <span>Gmail ({gmailResults.length})</span>
          </button>
          <button
            onClick={() => setActiveFilter('calendar')}
            className={`px-3 py-1 rounded-full font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFilter === 'calendar'
                ? 'bg-[#1a73e8] text-white font-bold'
                : 'bg-white text-[#5f6368] hover:bg-slate-100 border border-[#dadce0]'
            }`}
          >
            <GoogleCalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar ({calendarResults.length})</span>
          </button>
          <button
            onClick={() => setActiveFilter('drive')}
            className={`px-3 py-1 rounded-full font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFilter === 'drive'
                ? 'bg-[#34a853] text-white font-bold'
                : 'bg-white text-[#5f6368] hover:bg-slate-100 border border-[#dadce0]'
            }`}
          >
            <GoogleDriveIcon className="w-3.5 h-3.5" />
            <span>Drive ({driveResults.length})</span>
          </button>
          <button
            onClick={() => setActiveFilter('tasks')}
            className={`px-3 py-1 rounded-full font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFilter === 'tasks'
                ? 'bg-[#1a73e8] text-white font-bold'
                : 'bg-white text-[#5f6368] hover:bg-slate-100 border border-[#dadce0]'
            }`}
          >
            <GoogleTasksIcon className="w-3.5 h-3.5" />
            <span>Tasks ({taskResults.length})</span>
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 sm:p-4 space-y-4 flex-1">
          {isSearching && (
            <div className="py-8 text-center text-xs text-[#5f6368] flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span>Omni-searching across Google Workspace...</span>
            </div>
          )}

          {!isSearching && query.trim() && totalResults === 0 && (
            <div className="py-12 text-center text-xs text-[#5f6368]">
              No items found matching "{query}" across Gmail, Calendar, Drive, or Tasks.
            </div>
          )}

          {!query.trim() && (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs font-semibold text-[#1f1f1f]">
                Simultaneous multi-tool search across all connected Google data
              </p>
              <p className="text-[11px] text-[#5f6368] max-w-sm mx-auto">
                Try searching for client names, project codenames, agenda topics, or meeting documents.
              </p>
            </div>
          )}

          {/* Gmail Results */}
          {(activeFilter === 'all' || activeFilter === 'gmail') && gmailResults.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-[#ea4335] uppercase tracking-wider flex items-center gap-1.5 px-2">
                <GmailIcon className="w-3.5 h-3.5" /> Gmail Messages
              </div>
              {gmailResults.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    onNavigateTab('gmail');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-[#f0f4f9] border border-transparent hover:border-[#dadce0] cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#1f1f1f] group-hover:text-[#1a73e8] truncate">
                      {msg.subject || '(No Subject)'}
                    </p>
                    <p className="text-[11px] text-[#5f6368] truncate">
                      {msg.from} • {msg.snippet}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#5f6368] opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Calendar Results */}
          {(activeFilter === 'all' || activeFilter === 'calendar') && calendarResults.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-[#1a73e8] uppercase tracking-wider flex items-center gap-1.5 px-2">
                <GoogleCalendarIcon className="w-3.5 h-3.5" /> Calendar Events
              </div>
              {calendarResults.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => {
                    onNavigateTab('calendar');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-[#f0f4f9] border border-transparent hover:border-[#dadce0] cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#1f1f1f] group-hover:text-[#1a73e8] truncate">
                      {evt.summary}
                    </p>
                    <p className="text-[11px] text-[#5f6368] truncate">
                      {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString() : 'All day'} • {evt.location || 'Google Meet'}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#5f6368] opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Drive Results */}
          {(activeFilter === 'all' || activeFilter === 'drive') && driveResults.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-[#34a853] uppercase tracking-wider flex items-center gap-1.5 px-2">
                <GoogleDriveIcon className="w-3.5 h-3.5" /> Drive Documents
              </div>
              {driveResults.map((file) => (
                <div
                  key={file.id}
                  onClick={() => {
                    if (file.webViewLink) {
                      window.open(file.webViewLink, '_blank');
                    } else {
                      onNavigateTab('drive');
                    }
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-[#f0f4f9] border border-transparent hover:border-[#dadce0] cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#1f1f1f] group-hover:text-[#1a73e8] truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-[#5f6368] truncate">
                      {file.mimeType?.replace('application/vnd.google-apps.', '') || 'Document'}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#5f6368] opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Tasks Results */}
          {(activeFilter === 'all' || activeFilter === 'tasks') && taskResults.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-[#1a73e8] uppercase tracking-wider flex items-center gap-1.5 px-2">
                <GoogleTasksIcon className="w-3.5 h-3.5" /> Google Tasks
              </div>
              {taskResults.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    onNavigateTab('tasks');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-[#f0f4f9] border border-transparent hover:border-[#dadce0] cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#1f1f1f] group-hover:text-[#1a73e8] truncate">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-[#5f6368] truncate">
                      {t.notes || (t.status === 'completed' ? 'Completed' : 'Pending')}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#5f6368] opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#f1f3f4] border-t border-[#dadce0] flex items-center justify-between text-[11px] text-[#5f6368]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#dadce0] font-mono">Esc</kbd> to close
            </span>
            <span>
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#dadce0] font-mono">⌘K</kbd> to reopen
            </span>
          </div>
          <span className="font-semibold text-purple-700">Pro Omni-Search Active</span>
        </div>
      </div>
    </div>
  );
};
