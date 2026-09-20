import React, { useState, useEffect } from 'react';
import {
  Plus,
  ArrowRight,
  Clock,
  RefreshCw,
  ExternalLink,
  Video,
  FileSpreadsheet,
  CheckCircle2,
  Pin,
  Sparkles,
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Star,
  Check,
  Calendar,
  CheckSquare,
  Mail,
  HardDrive,
  Trash2,
  ShieldCheck,
  Zap,
  CheckCheck,
} from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import { ProBadge } from './ProBadge';
import { MeetingPrepPackModal } from './MeetingPrepPackModal';
import { SmartFollowUpModal } from './SmartFollowUpModal';
import {
  CalendarEvent,
  TaskItem,
  GmailMessageItem,
  DriveFile,
} from '../types/workspace';
import {
  listCalendarEvents,
  listTaskLists,
  listTasks,
  listGmailMessages,
  listDriveFiles,
} from '../services/workspace';
import {
  GoogleDriveIcon,
  GoogleDocsIcon,
  GoogleSheetsIcon,
  GoogleSlidesIcon,
  GmailIcon,
  GoogleCalendarIcon,
  GoogleTasksIcon,
  GoogleMeetIcon,
  GoogleFormsIcon,
  GoogleKeepIcon,
  GoogleLogo,
} from './GoogleIcons';
import { ALL_WORKSPACE_TOOLS, CATEGORIES, ToolDefinition, DEFAULT_PINNED_TOOL_IDS } from '../constants/tools';

interface OverviewViewProps {
  token: string;
  userName: string | null;
  onNavigateTab: (tabId: string) => void;
  anchorTools?: string[];
  userRole?: string;
  tabCount?: string;
  onOpenOnboarding?: () => void;
  pinnedTools?: string[];
  onTogglePin?: (toolId: string) => void;
  onDeleteAccount?: () => void;
  onOpenSecurity?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  token,
  userName,
  onNavigateTab,
  anchorTools = [],
  userRole,
  tabCount,
  onOpenOnboarding,
  pinnedTools: propsPinnedTools,
  onTogglePin: propsOnTogglePin,
  onDeleteAccount,
  onOpenSecurity,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [emails, setEmails] = useState<GmailMessageItem[]>([]);
  const [recentFiles, setRecentFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Pro features & plan
  const { isPro, requirePro, prioritySyncActive, togglePrioritySync } = usePlan();
  const [selectedPrepEvent, setSelectedPrepEvent] = useState<CalendarEvent | null>(null);
  const [selectedFollowUpEvent, setSelectedFollowUpEvent] = useState<CalendarEvent | null>(null);

  // Customize Pinned Tools Modal
  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);
  const [searchModalQuery, setSearchModalQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Internal pinned tools state if not passed via props
  const [localPinned, setLocalPinned] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gdeck_pinned_tools');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PINNED_TOOL_IDS;
  });

  const pinned = propsPinnedTools || localPinned;

  const togglePin = (toolId: string) => {
    if (propsOnTogglePin) {
      propsOnTogglePin(toolId);
    } else {
      setLocalPinned((prev) => {
        const next = prev.includes(toolId)
          ? prev.filter((id) => id !== toolId)
          : [...prev, toolId];
        try {
          localStorage.setItem('gdeck_pinned_tools', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  const loadAllOverviewData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      const [eventsData, taskListsData, emailsData, filesData] = await Promise.allSettled([
        listCalendarEvents(token, { timeMin: startOfToday.toISOString(), maxResults: 15 }),
        listTaskLists(token),
        listGmailMessages(token, 5),
        listDriveFiles(token),
      ]);

      if (eventsData.status === 'fulfilled') {
        if (eventsData.value.length > 0) {
          setEvents(eventsData.value.slice(0, 4));
        } else {
          // If no upcoming events starting from today, fall back to recent events
          try {
            const fallbackEvents = await listCalendarEvents(token, 10);
            setEvents(fallbackEvents.slice(0, 4));
          } catch {
            setEvents([]);
          }
        }
      }

      if (taskListsData.status === 'fulfilled' && taskListsData.value.length > 0) {
        try {
          const firstListId = taskListsData.value[0].id;
          const taskItems = await listTasks(token, firstListId);
          setTasks(taskItems.slice(0, 5));
        } catch (e) {
          console.warn('Failed to load tasks for default list', e);
        }
      }

      if (emailsData.status === 'fulfilled') {
        setEmails(emailsData.value.slice(0, 4));
      }

      if (filesData.status === 'fulfilled') {
        setRecentFiles(filesData.value.slice(0, 4));
      }
    } catch (err) {
      console.error('Error fetching overview dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllOverviewData();
  }, [token]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadAllOverviewData();
  };

  // Filter tools for customize modal
  const modalFilteredTools = ALL_WORKSPACE_TOOLS.filter((t) => {
    const matchesCat = filterCategory === 'All' || t.category === filterCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchModalQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchModalQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchModalQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Tools currently pinned to be displayed on dashboard
  const displayedPinnedTools = ALL_WORKSPACE_TOOLS.filter((t) => pinned.includes(t.id));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Google Workspace Dashboard Banner */}
      <div className="google-card p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1a73e8] bg-[#e8f0fe] px-2.5 py-0.5 rounded-full border border-[#d2e3fc]">
              Workspace Command Center
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#1f1f1f] font-['Google_Sans',Roboto,sans-serif]">
            Good day{userName ? `, ${userName}` : ''}
          </h2>
          <p className="text-xs sm:text-sm text-[#5f6368] max-w-xl">
            Live synchronization across your Google Workspace ecosystem. Quick launch apps, monitor deadlines, and access documents.
          </p>
        </div>

        {/* Action button cluster */}
        <div className="flex items-center flex-wrap gap-2.5 z-10">
          {/* Priority Sync & Offline toggle */}
          <button
            onClick={() => togglePrioritySync()}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              prioritySyncActive
                ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-2xs'
                : 'bg-white border-[#dadce0] text-[#5f6368] hover:bg-[#f8fafd]'
            }`}
            title="Priority Sync & Offline-Ready Cache (Sub-second sync)"
          >
            <Zap className={`w-3.5 h-3.5 ${prioritySyncActive ? 'fill-purple-600 text-purple-600' : 'text-slate-400'}`} />
            <span>{prioritySyncActive ? '⚡ Priority Sync: Active (38ms)' : 'Priority Sync'}</span>
            <ProBadge size="xs" featureTitle="Priority Sync & Offline Mode" />
          </button>

          <button
            onClick={() => {
              if (!requirePro('Custom Dashboard Layout', 'Pin, unpin, rearrange, and resize widgets on the Overview dashboard.')) {
                return;
              }
              setShowCustomizeModal(true);
            }}
            className="btn-google-secondary px-4 py-2 flex items-center gap-2"
            title="Choose which Google tools appear on this dashboard (Pro)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span>Customize Pinned ({pinned.length})</span>
            <ProBadge size="xs" featureTitle="Custom Dashboard Layout" />
          </button>

          <button
            id="overview-refresh-btn"
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="btn-google-secondary p-2.5 disabled:opacity-50"
            title="Refresh workspace feeds"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#1a73e8]' : 'text-[#5f6368]'}`} />
          </button>
        </div>
      </div>

      {/* Pinned Tools Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-[#1a73e8] fill-[#1a73e8]" />
            <h3 className="text-base font-bold text-[#1f1f1f] tracking-tight font-['Google_Sans',Roboto,sans-serif]">
              Pinned Google Tools ({displayedPinnedTools.length})
            </h3>
            <span className="text-xs text-[#5f6368] font-medium hidden sm:inline">
              — Your quick-launch deck
            </span>
          </div>

          <button
            onClick={() => {
              if (!requirePro('Custom Dashboard Layout', 'Pin, unpin, rearrange, and resize widgets on the Overview dashboard.')) {
                return;
              }
              setShowCustomizeModal(true);
            }}
            className="text-xs text-[#1a73e8] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Edit Pinned</span>
            <ProBadge size="xs" featureTitle="Custom Dashboard Layout" />
          </button>
        </div>

        {displayedPinnedTools.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-[#dadce0] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center mx-auto">
              <Pin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#1f1f1f]">No tools currently pinned</h4>
              <p className="text-xs text-[#5f6368] max-w-md mx-auto mt-1">
                Customize your workspace dashboard by pinning the Google tools you use most.
              </p>
            </div>
            <button
              onClick={() => setShowCustomizeModal(true)}
              className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-xs rounded-full shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Choose Tools to Pin</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedPinnedTools.map((tool) => {
              const Icon = tool.icon;
              const isAnchor = anchorTools.includes(tool.id);
              return (
                <div
                  key={tool.id}
                  id={`overview-launch-${tool.id}`}
                  onClick={() => onNavigateTab(tool.id)}
                  className={`google-card-interactive p-5 text-left group flex flex-col justify-between min-h-[160px] relative ${
                    isAnchor ? 'ring-2 ring-[#1a73e8]/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="p-2 rounded-2xl bg-[#f8fafd] border border-[#e1e3e1] group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                      <Icon className="w-8 h-8 object-contain" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f1f3f4] text-[#444746] border border-[#dadce0]">
                        {tool.badge}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(tool.id);
                        }}
                        className="p-1.5 rounded-full text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] transition-colors cursor-pointer"
                        title="Unpin tool"
                      >
                        <Pin className="w-3.5 h-3.5 fill-current text-[#1a73e8]" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#1f1f1f] group-hover:text-[#1a73e8] transition-colors flex items-center gap-1">
                        {tool.name}
                      </h4>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-[#1a73e8]" />
                    </div>
                    <p className="text-[11px] text-[#5f6368] leading-tight line-clamp-2 mt-1">
                      {tool.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Workspace Feeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Calendar Card */}
        <div className="google-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f3f4]">
              <div className="flex items-center gap-3">
                <GoogleCalendarIcon className="w-6 h-6 object-contain" />
                <div>
                  <h4 className="text-sm font-bold text-[#1f1f1f]">Google Calendar</h4>
                  <p className="text-[11px] text-[#5f6368]">Upcoming schedule and meetings</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs text-[#1a73e8] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                View calendar <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-[#f1f3f4] mt-3 min-h-[180px]">
              {loading ? (
                <div className="py-12 text-center text-xs text-[#5f6368] flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1a73e8]" /> Loading calendar events...
                </div>
              ) : events.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#5f6368]">
                  No upcoming events scheduled for today
                </div>
              ) : (
                events.map((ev) => (
                  <div
                    key={ev.id}
                    className="py-3 flex items-start justify-between gap-3 hover:bg-[#f8fafd] px-2.5 rounded-xl transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1f1f1f] truncate">
                        {ev.summary || '(Untitled Event)'}
                      </p>
                      <p className="text-[11px] text-[#5f6368] mt-0.5 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-[#1a73e8]" />
                        {ev.start?.dateTime
                          ? new Date(ev.start.dateTime).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ev.start?.date
                          ? `${new Date(ev.start.date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })} (All Day)`
                          : 'All Day'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          if (
                            !requirePro(
                              'Meeting Prep Packs',
                              'One-click briefing doc with relevant emails, Drive files, and attendee details.'
                            )
                          ) {
                            return;
                          }
                          setSelectedPrepEvent(ev);
                        }}
                        className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 border border-purple-200 transition-colors cursor-pointer"
                        title="Generate Meeting Prep Pack (Pro)"
                      >
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span className="hidden sm:inline">Prep Pack</span>
                        <ProBadge size="xs" featureTitle="Meeting Prep Packs" />
                      </button>

                      <button
                        onClick={() => {
                          if (
                            !requirePro(
                              'Smart Follow-Up Generator',
                              'Generate follow-up email drafts with action items assigned to attendees.'
                            )
                          ) {
                            return;
                          }
                          setSelectedFollowUpEvent(ev);
                        }}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
                        title="Generate Meeting Follow-Up Email (Pro)"
                      >
                        <CheckCheck className="w-3 h-3 text-slate-600" />
                        <span className="hidden sm:inline">Follow-Up</span>
                        <ProBadge size="xs" featureTitle="Smart Follow-Up Generator" />
                      </button>

                      {ev.htmlLink && (
                        <a
                          href={ev.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#5f6368] hover:text-[#1a73e8] p-1.5 rounded-lg hover:bg-[#e8f0fe] transition-colors"
                          title="Open in Google Calendar"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#f1f3f4] mt-4">
            <button
              onClick={() => onNavigateTab('calendar')}
              className="w-full py-2.5 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1a73e8] text-xs font-semibold rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Open Calendar & Add Event
            </button>
          </div>
        </div>

        {/* Google Tasks Card */}
        <div className="google-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f3f4]">
              <div className="flex items-center gap-3">
                <GoogleTasksIcon className="w-6 h-6 object-contain" />
                <div>
                  <h4 className="text-sm font-bold text-[#1f1f1f]">Google Tasks</h4>
                  <p className="text-[11px] text-[#5f6368]">Your synced to-do checklists</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs text-[#1a73e8] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Manage tasks <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-[#f1f3f4] mt-3 min-h-[180px]">
              {loading ? (
                <div className="py-12 text-center text-xs text-[#5f6368] flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1a73e8]" /> Loading active tasks...
                </div>
              ) : tasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#5f6368]">
                  All tasks are completed in your primary list
                </div>
              ) : (
                tasks.map((tsk) => (
                  <div
                    key={tsk.id}
                    className="py-3 flex items-start justify-between gap-3 hover:bg-[#f8fafd] px-2.5 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          tsk.status === 'completed' ? 'text-[#188038]' : 'text-[#5f6368]'
                        }`}
                      />
                      <span
                        className={`text-xs font-medium truncate ${
                          tsk.status === 'completed' ? 'line-through text-[#9aa0a6]' : 'text-[#1f1f1f]'
                        }`}
                      >
                        {tsk.title}
                      </span>
                    </div>
                    {tsk.due && (
                      <span className="text-[10px] text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded-md border border-[#d2e3fc] font-medium">
                        Due {new Date(tsk.due).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#f1f3f4] mt-4">
            <button
              onClick={() => onNavigateTab('tasks')}
              className="w-full py-2.5 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1a73e8] text-xs font-semibold rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Open Tasks & Create Item
            </button>
          </div>
        </div>

        {/* Gmail Priority Inbox Card */}
        <div className="google-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f3f4]">
              <div className="flex items-center gap-3">
                <GmailIcon className="w-6 h-6 object-contain" />
                <div>
                  <h4 className="text-sm font-bold text-[#1f1f1f]">Gmail</h4>
                  <p className="text-[11px] text-[#5f6368]">Live inbox synchronization</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('gmail')}
                className="text-xs text-[#d93025] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Go to inbox <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-[#f1f3f4] mt-3 min-h-[180px]">
              {loading ? (
                <div className="py-12 text-center text-xs text-[#5f6368] flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#d93025]" /> Fetching email messages...
                </div>
              ) : emails.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#5f6368]">
                  Inbox is clear or no recent messages loaded
                </div>
              ) : (
                emails.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => onNavigateTab('gmail')}
                    className="py-3 flex items-start justify-between gap-3 hover:bg-[#f8fafd] px-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1f1f1f] truncate">
                        {msg.subject || '(No Subject)'}
                      </p>
                      <p className="text-[11px] text-[#5f6368] truncate mt-0.5">
                        {msg.from || 'Google Contact'}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#9aa0a6] shrink-0 font-medium">
                      {msg.date ? new Date(msg.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#f1f3f4] mt-4">
            <button
              onClick={() => onNavigateTab('gmail')}
              className="w-full py-2.5 bg-[#fce8e6] hover:bg-[#fad2cf] text-[#d93025] text-xs font-semibold rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Compose Email in Gmail
            </button>
          </div>
        </div>

        {/* Google Drive Card */}
        <div className="google-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f3f4]">
              <div className="flex items-center gap-3">
                <GoogleDriveIcon className="w-6 h-6 object-contain" />
                <div>
                  <h4 className="text-sm font-bold text-[#1f1f1f]">Google Drive</h4>
                  <p className="text-[11px] text-[#5f6368]">Recent cloud files & documents</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('drive')}
                className="text-xs text-[#188038] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Open Drive <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-[#f1f3f4] mt-3 min-h-[180px]">
              {loading ? (
                <div className="py-12 text-center text-xs text-[#5f6368] flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#188038]" /> Fetching recent files...
                </div>
              ) : recentFiles.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#5f6368]">
                  No files found in Google Drive
                </div>
              ) : (
                recentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="py-3 flex items-start justify-between gap-3 hover:bg-[#f8fafd] px-2.5 rounded-xl transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1f1f1f] truncate">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-[#5f6368] mt-0.5">
                        {file.modifiedTime
                          ? `Modified ${new Date(file.modifiedTime).toLocaleDateString()}`
                          : 'Drive Document'}
                      </p>
                    </div>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5f6368] hover:text-[#188038] p-1.5 rounded-lg hover:bg-[#e6f4ea] transition-colors"
                        title="Open file in Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#f1f3f4] mt-4">
            <button
              onClick={() => onNavigateTab('drive')}
              className="w-full py-2.5 bg-[#e6f4ea] hover:bg-[#ceead6] text-[#188038] text-xs font-semibold rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Upload or Browse All Drive Files
            </button>
          </div>
        </div>
      </div>

      {/* Account Security & Privacy Section */}
      <div className="bg-white rounded-3xl border border-[#dadce0] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-[#e8f0fe] rounded-2xl text-[#1a73e8] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1f1f1f]">Google Workspace Account & Privacy</h4>
            <p className="text-xs text-[#5f6368] mt-0.5 max-w-xl leading-relaxed">
              Connected via Google OAuth 2.0 with least-privilege permissions. You can disconnect your active session or permanently delete your account and wipe all stored data at any time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onOpenSecurity && (
            <button
              id="overview-open-security-btn"
              onClick={onOpenSecurity}
              className="px-4 py-2 bg-[#f1f8f3] hover:bg-[#e6f4ea] text-[#137333] rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-[#ceead6]"
            >
              <ShieldCheck className="w-4 h-4 text-[#137333]" />
              <span>View Protections</span>
            </button>
          )}
          {onDeleteAccount && (
            <button
              id="overview-delete-account-btn"
              onClick={onDeleteAccount}
              className="px-4 py-2 bg-[#fdf2f2] hover:bg-[#fce8e6] text-[#d93025] rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-[#f5c6cb]"
            >
              <Trash2 className="w-4 h-4 text-[#d93025]" />
              <span>Delete Account & Wipe Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Customize Pinned Tools Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#dadce0] overflow-hidden flex flex-col max-h-[85vh] p-6 sm:p-7">
            <div className="flex-1 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#f1f3f4]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#e8f0fe] text-[#1a73e8]">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1f1f1f] font-['Google_Sans',Roboto,sans-serif]">
                      Customize Pinned Dashboard Tools
                    </h3>
                    <p className="text-xs text-[#5f6368]">
                      Select which Google applications appear on your home overview deck ({pinned.length} selected)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomizeModal(false)}
                  className="p-1.5 rounded-full text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f1f3f4] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters & Search Bar */}
              <div className="pt-4 pb-2 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#5f6368] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search tools by name, keyword or category..."
                    value={searchModalQuery}
                    onChange={(e) => setSearchModalQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#f0f4f9] border border-transparent focus:border-[#1a73e8] rounded-full text-xs text-[#1f1f1f] focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterCategory('All')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      filterCategory === 'All'
                        ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                        : 'bg-[#f0f4f9] hover:bg-[#e9eef6] text-[#444746]'
                    }`}
                  >
                    All Tools
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        filterCategory === cat
                          ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                          : 'bg-[#f0f4f9] hover:bg-[#e9eef6] text-[#444746]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1 mt-2">
                {modalFilteredTools.map((tool) => {
                  const Icon = tool.icon;
                  const isPinned = pinned.includes(tool.id);
                  return (
                    <div
                      key={tool.id}
                      onClick={() => togglePin(tool.id)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isPinned
                          ? 'bg-[#e8f0fe] border-[#d2e3fc] text-[#1f1f1f]'
                          : 'bg-white hover:bg-[#f8fafd] border-[#dadce0] text-[#444746]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-xl bg-white border border-[#dadce0] shrink-0">
                          <Icon className="w-6 h-6 object-contain" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold truncate text-[#1f1f1f]">{tool.name}</h4>
                          <p className="text-[10px] text-[#5f6368] truncate">{tool.category}</p>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                          isPinned
                            ? 'bg-[#1a73e8] border-[#1a73e8] text-white'
                            : 'border-[#dadce0] text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[#f1f3f4] flex items-center justify-between mt-4">
              <span className="text-xs text-[#5f6368] font-medium">
                {pinned.length} tools will be shown on your dashboard
              </span>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-xs rounded-full shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] cursor-pointer transition-transform hover:scale-105"
              >
                Save & Apply Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro Modals for Meeting Prep & Smart Follow-Up */}
      <MeetingPrepPackModal
        isOpen={!!selectedPrepEvent}
        onClose={() => setSelectedPrepEvent(null)}
        event={selectedPrepEvent}
        token={token}
      />

      <SmartFollowUpModal
        isOpen={!!selectedFollowUpEvent}
        onClose={() => setSelectedFollowUpEvent(null)}
        event={selectedFollowUpEvent}
        token={token}
      />
    </div>
  );
};
