import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, ExternalLink, Lock } from 'lucide-react';
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

type Source = 'gmail' | 'calendar' | 'drive' | 'tasks';

interface FlatResult {
  key: string;
  source: Source;
  title: string;
  subtitle: string;
  meta?: string;
  href?: string;
  unread?: boolean;
}

const SOURCE_ORDER: Source[] = ['gmail', 'calendar', 'drive', 'tasks'];

const SOURCE_META: Record<Source, { label: string; icon: React.FC<{ className?: string }>; tint: string }> = {
  gmail: { label: 'Gmail', icon: GmailIcon, tint: 'text-[#ea4335]' },
  calendar: { label: 'Calendar', icon: GoogleCalendarIcon, tint: 'text-[#1a73e8]' },
  drive: { label: 'Drive', icon: GoogleDriveIcon, tint: 'text-[#34a853]' },
  tasks: { label: 'Tasks', icon: GoogleTasksIcon, tint: 'text-[#1a73e8]' },
};

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({
  isOpen,
  onClose,
  token,
  onNavigateTab,
}) => {
  const { isPro, openUpgradeModal } = usePlan();
  const [query, setQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | Source>('all');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [cursor, setCursor] = useState<number>(0);

  const [gmailResults, setGmailResults] = useState<any[]>([]);
  const [calendarResults, setCalendarResults] = useState<any[]>([]);
  const [driveResults, setDriveResults] = useState<any[]>([]);
  const [taskResults, setTaskResults] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setCursor(0);
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Run the query across all four Workspace tools.
  useEffect(() => {
    if (!isOpen || !token || !isPro || !query.trim()) {
      setGmailResults([]);
      setCalendarResults([]);
      setDriveResults([]);
      setTaskResults([]);
      setIsSearching(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      const q = query.trim().toLowerCase();
      try {
        const [emails, events, files, taskLists] = await Promise.all([
          listGmailMessages(token, 15, query).catch(() => []),
          listCalendarEvents(token).catch(() => []),
          listDriveFiles(token, query).catch(() => []),
          listTaskLists(token).catch(() => []),
        ]);
        if (requestId !== requestIdRef.current) return;

        setGmailResults((emails || []).slice(0, 5));
        setCalendarResults(
          (events || [])
            .filter(
              (e: any) =>
                (e.summary && e.summary.toLowerCase().includes(q)) ||
                (e.description && e.description.toLowerCase().includes(q)) ||
                (e.location && e.location.toLowerCase().includes(q))
            )
            .slice(0, 5)
        );
        setDriveResults((files || []).slice(0, 5));

        // Every list, not just the first one.
        const lists = (taskLists || []).slice(0, 6);
        const perList = await Promise.all(
          lists.map((l: any) => listTasks(token, l.id).catch(() => []))
        );
        if (requestId !== requestIdRef.current) return;

        const matchedTasks = perList
          .flat()
          .filter(
            (t: any) =>
              (t.title && t.title.toLowerCase().includes(q)) || (t.notes && t.notes.toLowerCase().includes(q))
          )
          .slice(0, 5);
        setTaskResults(matchedTasks);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsSearching(false);
          setCursor(0);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen, token, isPro]);

  const results: FlatResult[] = useMemo(() => {
    const out: FlatResult[] = [];

    gmailResults.forEach((m: any) =>
      out.push({
        key: `gmail-${m.id}`,
        source: 'gmail',
        title: m.subject || '(no subject)',
        subtitle: m.snippet || m.from || '',
        meta: m.date,
        unread: m.isUnread,
        // No external deep link: the in-app Gmail view already lists this thread.
        href: undefined,
      })
    );

    calendarResults.forEach((e: any) =>
      out.push({
        key: `cal-${e.id}`,
        source: 'calendar',
        title: e.summary || '(untitled event)',
        subtitle: e.location || (e.start?.dateTime ? new Date(e.start.dateTime).toLocaleString() : 'No location'),
        meta: e.start?.dateTime ? new Date(e.start.dateTime).toLocaleDateString() : undefined,
        href: e.htmlLink,
      })
    );

    driveResults.forEach((f: any) =>
      out.push({
        key: `drive-${f.id}`,
        source: 'drive',
        title: f.name || 'Untitled',
        subtitle: f.owners?.[0]?.displayName ? `Owned by ${f.owners[0].displayName}` : 'In your Drive',
        meta: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : undefined,
        href: f.webViewLink,
      })
    );

    taskResults.forEach((t: any) =>
      out.push({
        key: `task-${t.id}`,
        source: 'tasks',
        title: t.title || 'Untitled task',
        subtitle: t.notes || (t.status === 'completed' ? 'Completed' : 'Pending'),
        href: undefined,
      })
    );

    return out;
  }, [gmailResults, calendarResults, driveResults, taskResults, query]);

  const visible = useMemo(
    () => (activeFilter === 'all' ? results : results.filter((r) => r.source === activeFilter)),
    [results, activeFilter]
  );

  const activate = (r: FlatResult | undefined) => {
    if (!r) return;
    if (r.href) {
      window.open(r.href, '_blank', 'noopener,noreferrer');
    } else {
      onNavigateTab(r.source);
    }
    onClose();
  };

  // Keyboard: Esc closes, arrows move, Enter opens. These were advertised but never wired.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!visible.length) return;
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, visible.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        activate(visible[cursor]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, visible, cursor]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-cursor="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!isOpen) return null;

  const tabs: Array<{ id: 'all' | Source; label: string; count: number }> = [
    { id: 'all', label: 'All', count: results.length },
    ...SOURCE_ORDER.map((s) => ({
      id: s,
      label: SOURCE_META[s].label,
      count: results.filter((r) => r.source === s).length,
    })),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search across Workspace"
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-[#dadce0] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[78vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search field */}
        <div className="p-3 border-b border-[#f1f3f4] flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-[#f1f3f4] rounded-2xl transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-[#e8f0fe]">
            <Search className="w-[18px] h-[18px] shrink-0 text-[#5f6368]" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={visible.length > 0}
              aria-controls="omni-results"
              aria-label="Search Gmail, Calendar, Drive and Tasks"
              placeholder="Search mail, events, files and tasks"
              value={query}
              disabled={!isPro}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 min-w-0 text-sm text-[#1f1f1f] placeholder-[#9aa0a6] outline-none bg-transparent disabled:cursor-not-allowed"
            />
            {query && isPro && (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="shrink-0 p-1 rounded-full text-[#5f6368] hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <ProBadge size="xs" featureTitle="Omni-Search" />
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
            aria-label="Close (Esc)"
            title="Close (Esc)"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Source tabs */}
        <div className="px-3 pt-2.5 pb-2.5 bg-white border-b border-[#f1f3f4] flex items-center gap-1 flex-wrap">
          {tabs.map((t) => {
            const on = activeFilter === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveFilter(t.id);
                  setCursor(0);
                }}
                disabled={!isPro}
                className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  on ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                }`}
              >
                {t.id === 'all' ? (
                  <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-[#1a73e8]' : 'bg-[#bdc1c6]'}`} />
                ) : (
                  React.createElement(SOURCE_META[t.id as Source].icon, { className: 'w-3.5 h-3.5' })
                )}
                <span>{t.label}</span>
                <span className={`text-[10px] tabular-nums ${on ? 'text-[#1a73e8]' : 'text-[#9aa0a6]'}`}>{t.count}</span>
              </button>
            );
          })}
        </div>

        {!isPro ? (
          /* Compact locked state — same shell, no second full-screen ad */
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3.5 p-4 bg-[#faf5ff] border border-[#f3e8ff] rounded-2xl">
              <div className="w-9 h-9 shrink-0 rounded-2xl bg-white border border-[#f3e8ff] text-[#7e22ce] flex items-center justify-center">
                <Lock className="w-[18px] h-[18px]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#1f1f1f] mb-1">Omni-Search is a Pro feature</h4>
                <p className="text-xs text-[#5f6368] leading-relaxed mb-3">
                  One query across Gmail, Calendar, Drive and Tasks from anywhere, with <kbd className="bg-white px-1 py-0.5 rounded border border-[#e9d5ff] font-mono text-[10px]">⌘K</kbd>. Free
                  plans search inside each tab.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      openUpgradeModal({
                        title: 'Omni-Search',
                        desc: 'Search Gmail, Calendar, Drive and Tasks at the same time from a single bar.',
                      });
                    }}
                    className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Upgrade for $12/month
                  </button>
                  <button
                    onClick={onClose}
                    className="px-3 py-2 text-xs font-semibold text-[#5f6368] hover:text-[#1f1f1f] transition-colors cursor-pointer"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div id="omni-results" ref={listRef} className="overflow-y-auto flex-1 py-1.5" role="listbox">
              {isSearching && (
                <div className="py-9 text-center text-xs text-[#5f6368] flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
                  <span>Searching your Workspace…</span>
                </div>
              )}

              {!isSearching && !query.trim() && (
                <div className="px-5 py-9 text-center space-y-1.5">
                  <p className="text-xs font-semibold text-[#1f1f1f]">Search across everything at once</p>
                  <p className="text-[11px] text-[#5f6368] max-w-sm mx-auto">
                    Try a client name, a project codename, or a phrase from a meeting you remember.
                  </p>
                </div>
              )}

              {!isSearching && query.trim() && visible.length === 0 && (
                <div className="px-5 py-10 text-center text-xs text-[#5f6368]">
                  Nothing matched “{query.trim()}”{activeFilter !== 'all' ? ` in ${SOURCE_META[activeFilter].label}` : ''}.
                  {activeFilter !== 'all' && (
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="block mx-auto mt-2 text-[11px] font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                    >
                      Search all sources
                    </button>
                  )}
                </div>
              )}

              {!isSearching &&
                visible.length > 0 &&
                (activeFilter === 'all' ? SOURCE_ORDER.filter((s) => visible.some((r) => r.source === s)) : [activeFilter]).map(
                  (source) => {
                    const rows = visible
                      .map((r, i) => ({ r, i }))
                      .filter(({ r }) => r.source === source);
                    const Icon = SOURCE_META[source].icon;
                    return (
                      <div key={source} className="mb-1">
                        <div
                          className={`px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${SOURCE_META[source].tint}`}
                        >
                          <Icon className="w-3 h-3" />
                          {SOURCE_META[source].label}
                          <span className="text-[#9aa0a6] font-semibold">{rows.length}</span>
                        </div>
                        {rows.map(({ r, i }) => (
                          <button
                            key={r.key}
                            type="button"
                            data-cursor={i}
                            onMouseEnter={() => setCursor(i)}
                            onClick={() => activate(r)}
                            className={`w-full text-left px-4 py-2 flex items-start gap-3 transition-colors cursor-pointer ${
                              cursor === i ? 'bg-[#e8f0fe]' : 'hover:bg-[#f8fafd]'
                            }`}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5">
                                {r.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8] shrink-0" />}
                                <span className="text-xs font-semibold text-[#1f1f1f] truncate">{r.title}</span>
                              </span>
                              <span className="block text-[11px] text-[#5f6368] truncate mt-0.5">{r.subtitle}</span>
                            </span>
                            <span className="shrink-0 flex items-center gap-1.5 pt-0.5">
                              {r.meta && <span className="text-[10px] text-[#9aa0a6] tabular-nums">{r.meta}</span>}
                              {r.href ? (
                                <ExternalLink className="w-3.5 h-3.5 text-[#9aa0a6]" />
                              ) : (
                                <span className="text-[10px] font-semibold text-[#1a73e8]">Open tab</span>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  }
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-[#f8fafd] border-t border-[#f1f3f4] flex items-center justify-between gap-3 text-[11px] text-[#5f6368]">
              <div className="flex items-center gap-2.5 min-w-0">
                <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#dadce0] font-mono text-[10px]">↑↓</kbd>
                <span>navigate</span>
                <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#dadce0] font-mono text-[10px]">↵</kbd>
                <span>open</span>
                <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#dadce0] font-mono text-[10px]">Esc</kbd>
                <span>close</span>
              </div>
              <span className="shrink-0 tabular-nums">
                {isSearching ? '…' : `${visible.length} result${visible.length === 1 ? '' : 's'}`}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
