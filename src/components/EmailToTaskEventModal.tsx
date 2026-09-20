import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Check,
  Video,
  Clock,
  Mail,
  Paperclip,
  CalendarClock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { GmailMessageItem } from '../types/workspace';
import {
  createCalendarEvent,
  createTask,
  createMeetingSpace,
  listTaskLists,
} from '../services/workspace';
import { generateDraftText, AiDraftError } from '../services/aiDraft';
import { ProBadge } from './ProBadge';

interface EmailToTaskEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: GmailMessageItem | null;
  token: string | null;
  onSuccess?: () => void;
}

interface Draft {
  title: string;
  summary: string;
  taskNotes: string;
  suggestedDate?: string; // YYYY-MM-DD, only when the email states it
  suggestedTime?: string; // HH:MM, only when the email states it
}

/**
 * The model turns one email into clean, human-readable event + task copy.
 * Everything it returns must come from the email; anything it can't support
 * it leaves out rather than filling in.
 */
const DRAFTER_INSTRUCTION = `You turn one email into a calendar event and a Google Task for a busy person.
Return ONLY a JSON object. No markdown, no code fences, no commentary. Exactly these keys:
{
  "title": "short imperative title, 3-7 words, no trailing period",
  "summary": "1-2 plain English sentences: what this is about and why it matters, taken from the email",
  "taskNotes": "3-5 short lines as plain text. Line 1 is what to do. The following lines are the key facts the email itself gives (people, amounts, dates, links), one per line, no bullet symbols. The last line is: Source: \"<subject>\" from <sender name>.",
  "suggestedDate": null,
  "suggestedTime": null
}
Rules:
- Use only what is in the email. Never invent names, dates, amounts, commitments or outcomes.
- suggestedDate (YYYY-MM-DD) and suggestedTime (HH:MM, 24h) must be set ONLY when the email explicitly states a meeting or deadline date and time. Otherwise keep both null.
- If the email gives no concrete details, say so plainly in taskNotes instead of filling gaps.`;

const senderName = (from?: string): string => {
  if (!from) return '';
  const m = from.match(/^([^<]+)<([^>]+)>/);
  if (m) return m[1].trim() || m[2];
  return from.trim();
};

const cleanSubject = (subject?: string): string =>
  (subject || '').replace(/^(Re|Fwd|Fw):/i, '').trim();

/**
 * Deterministic draft built strictly from the email's own fields. Used only when
 * the AI is unreachable — it adds no facts the email doesn't contain.
 */
const fallbackDraft = (msg: GmailMessageItem): Draft => {
  const subj = cleanSubject(msg.subject) || 'Follow up';
  const who = senderName(msg.from) || 'unknown sender';
  const lines = [
    `Follow up on "${subj}"`,
    `From: ${msg.from || who}`,
  ];
  if (msg.date) lines.push(`Received: ${new Date(msg.date).toLocaleString()}`);
  if (msg.snippet) lines.push(`Preview: ${msg.snippet.slice(0, 160)}`);
  lines.push(`Source: "${msg.subject || '(no subject)'}" from ${who}`);
  return {
    title: subj,
    summary: `Email from ${who} about "${subj}".`,
    taskNotes: lines.join('\n'),
  };
};

const parseDraft = (raw: string, msg: GmailMessageItem): Draft => {
  const text = raw.replace(/```json|```/g, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('The AI did not return a readable draft.');
  }
  const obj = JSON.parse(text.slice(start, end + 1));
  const fb = fallbackDraft(msg);
  const title =
    typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim() : fb.title;
  const summary = typeof obj.summary === 'string' ? obj.summary.trim() : fb.summary;
  const taskNotes =
    typeof obj.taskNotes === 'string' && obj.taskNotes.trim()
      ? obj.taskNotes.trim()
      : fb.taskNotes;

  let suggestedDate: string | undefined;
  let suggestedTime: string | undefined;
  if (typeof obj.suggestedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.suggestedDate)) {
    const d = new Date(`${obj.suggestedDate}T00:00:00`);
    if (!Number.isNaN(d.getTime())) suggestedDate = obj.suggestedDate;
  }
  if (typeof obj.suggestedTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(obj.suggestedTime)) {
    suggestedTime = obj.suggestedTime;
  }
  return { title, summary, taskNotes, suggestedDate, suggestedTime };
};

const tomorrowISO = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const EmailToTaskEventModal: React.FC<EmailToTaskEventModalProps> = ({
  isOpen,
  onClose,
  message,
  token,
  onSuccess,
}) => {
  const [eventTitle, setEventTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [taskNotes, setTaskNotes] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>(tomorrowISO());
  const [eventTime, setEventTime] = useState<string>('14:00');
  const [durationMins, setDurationMins] = useState<number>(30);
  const [createTaskItem, setCreateTaskItem] = useState<boolean>(true);
  const [createCalendarEvt, setCreateCalendarEvt] = useState<boolean>(true);
  const [includeMeetLink, setIncludeMeetLink] = useState<boolean>(true);

  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [draftSource, setDraftSource] = useState<'ai' | 'fallback' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const draftedForRef = useRef<string | null>(null);

  // Re-seed whenever a different email is opened; the modal stays mounted in GmailView.
  useEffect(() => {
    if (!isOpen || !message) {
      abortRef.current?.abort();
      return;
    }
    if (draftedForRef.current === message.id) return;
    draftedForRef.current = message.id;

    setEventDate(tomorrowISO());
    setEventTime('14:00');
    setDurationMins(30);
    setCreateTaskItem(true);
    setCreateCalendarEvt(true);
    setIncludeMeetLink(true);
    setEventTitle('');
    setSummary('');
    setTaskNotes('');
    setDraftSource(null);
    setStatus(null);
    void generate();

    return () => {
      abortRef.current?.abort();
      setIsDrafting(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, message]);

  const generate = async () => {
    if (!message) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsDrafting(true);
    setStatus(null);
    try {
      const body = (message.bodyText || message.body || message.snippet || '').slice(0, 3000);
      const text = await generateDraftText(
        [
          `Subject: ${message.subject || '(no subject)'}`,
          `From: ${message.from || 'unknown'}`,
          `To: ${message.to || 'me'}`,
          message.date ? `Date: ${message.date}` : null,
          '',
          'Body:',
          body || '(no body text available — work from the subject and sender only)',
        ]
          .filter((l) => l !== null)
          .join('\n'),
        { systemInstruction: DRAFTER_INSTRUCTION, signal: controller.signal, maxOutputTokens: 500, tag: 'email-to-task' }
      );
      const d = parseDraft(text, message);
      setEventTitle(d.title);
      setSummary(d.summary);
      setTaskNotes(d.taskNotes);
      if (d.suggestedDate) setEventDate(d.suggestedDate);
      if (d.suggestedTime) setEventTime(d.suggestedTime);
      setDraftSource('ai');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      const fb = fallbackDraft(message);
      setEventTitle(fb.title);
      setSummary(fb.summary);
      setTaskNotes(fb.taskNotes);
      setDraftSource('fallback');
      setStatus({
        tone: 'error',
        text:
          (err instanceof AiDraftError ? err.message : 'The AI draft could not be generated.') +
          ' A structured draft from the email’s own details is ready below — read and edit it before creating.',
      });
    } finally {
      setIsDrafting(false);
    }
  };

  if (!isOpen || !message) return null;

  const handleCreate = async () => {
    if (!token) {
      setStatus({ tone: 'error', text: 'Connect Google first — creating needs an active session.' });
      return;
    }
    if (!eventTitle.trim()) {
      setStatus({ tone: 'error', text: 'Give the event and task a title first.' });
      return;
    }
    setIsSubmitting(true);
    setStatus(null);

    try {
      const start = new Date(`${eventDate}T${eventTime || '09:00'}:00`);
      const end = new Date(start.getTime() + durationMins * 60000);

      // A real Google Meet space, not a made-up link nobody can join.
      let meetLink = '';
      if (includeMeetLink) {
        try {
          const space = await createMeetingSpace(token);
          meetLink = space?.meetingUri || '';
        } catch {
          meetLink = '';
        }
      }

      if (createCalendarEvt) {
        const desc = [
          `From: ${message.from || 'unknown'}`,
          message.date ? `Date: ${message.date}` : null,
          `Subject: ${message.subject || '(no subject)'}`,
          summary || null,
          includeMeetLink
            ? meetLink
              ? `Google Meet: ${meetLink}`
              : 'Google Meet: a meeting link was requested but could not be created'
            : null,
        ]
          .filter((l) => l)
          .join('\n');

        await createCalendarEvent(token, {
          summary: eventTitle.trim(),
          description: desc,
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
          location: meetLink ? 'Google Meet' : undefined,
        });
      }

      if (createTaskItem) {
        const lists = await listTaskLists(token);
        const listId = lists?.[0]?.id || '@default';
        const notes = [
          taskNotes.trim() || summary || eventTitle.trim(),
          `Meeting: ${start.toLocaleDateString()} at ${eventTime || '09:00'}`,
          meetLink ? `Meet: ${meetLink}` : null,
        ]
          .filter((l) => l)
          .join('\n');

        await createTask(token, listId, eventTitle.trim(), notes, end.toISOString());
      }

      setStatus({ tone: 'ok', text: 'Done — the calendar event and Google Task were created.' });
      onSuccess?.();
      setTimeout(onClose, 1600);
    } catch (err: any) {
      setStatus({
        tone: 'error',
        text: `Google could not complete this: ${err?.message || 'request failed'}. Nothing may have been created — check Calendar and Tasks before retrying.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventDescriptionPreview = [
    `From: ${message.from || 'unknown'}`,
    message.date ? `Date: ${message.date}` : null,
    `Subject: ${message.subject || '(no subject)'}`,
    summary || null,
    includeMeetLink ? 'Google Meet: a real meeting link is added when you create it' : null,
  ]
    .filter((l) => l)
    .join('\n');

  const fieldClass =
    'w-full px-3 py-2.5 text-xs bg-white rounded-xl border border-[#dadce0] text-[#1f1f1f] outline-none transition-colors focus:border-[#1a73e8] focus:ring-2 focus:ring-[#e8f0fe]';

  const who = senderName(message.from);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Convert email to task and event"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#dadce0] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-[#f1f3f4]">
          <div className="w-9 h-9 shrink-0 rounded-2xl bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center">
            <CalendarClock className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-bold text-[#1f1f1f] tracking-tight truncate">
                Email to task &amp; event
              </h3>
              <ProBadge size="xs" featureTitle="1-Click Email to Task & Event" />
            </div>
            <p className="text-xs text-[#5f6368] leading-snug truncate">
              {message.subject || 'This email'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email context strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 sm:px-6 py-2.5 bg-[#f8fafd] border-b border-[#f1f3f4] text-[11px] text-[#5f6368]">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {who || message.from || 'Unknown sender'}
          </span>
          {message.date && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(message.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          )}
          {message.hasAttachments && (
            <span className="inline-flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              {message.attachments?.length || 1} attachment{(message.attachments?.length || 0) === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-4 space-y-3.5 overflow-y-auto flex-1">
          {status && (
            <div
              className={`px-3 py-2.5 rounded-xl text-xs font-medium flex items-start gap-2 ${
                status.tone === 'ok'
                  ? 'bg-[#e6f4ea] border border-[#ceead6] text-[#137333]'
                  : 'bg-[#fce8e6] border border-[#fad2cf] text-[#c5221f]'
              }`}
            >
              {status.tone === 'ok' ? (
                <Check className="w-4 h-4 shrink-0 mt-px" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
              )}
              <span className="leading-relaxed flex-1">{status.text}</span>
              <button onClick={() => setStatus(null)} className="shrink-0 font-bold underline cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {/* AI draft */}
          <div className="border border-[#dadce0] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#faf5ff] border-b border-[#f3e8ff]">
              <span className="text-xs font-bold text-[#7e22ce] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7e22ce]" />
                Drafted from this email
              </span>
              <button
                type="button"
                onClick={generate}
                disabled={isDrafting}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#7e22ce] hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isDrafting ? 'animate-spin' : ''}`} />
                {eventTitle || taskNotes ? 'Redraft' : 'Drafting…'}
              </button>
            </div>

            <div className="p-4 space-y-3 bg-white">
              <div className="relative">
                <label htmlFor="ete-title" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">
                  Title for event &amp; task
                </label>
                <input
                  id="ete-title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Review Q3 invoice before Friday"
                  className={fieldClass}
                />
              </div>

              <div className="relative">
                <label htmlFor="ete-task-notes" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">
                  Task details — exactly what will be saved to Google Tasks
                </label>
                <textarea
                  id="ete-task-notes"
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  rows={5}
                  placeholder="Readable lines: what to do, then the key facts from the email."
                  className="w-full p-3.5 text-xs leading-relaxed text-[#1f1f1f] bg-[#f8fafd] rounded-xl border border-[#dadce0] outline-none resize-y transition-colors focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#e8f0fe]"
                />
                {isDrafting && (
                  <div className="absolute inset-0 rounded-xl bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-center px-6">
                    <div className="w-5 h-5 border-2 border-[#7e22ce] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-semibold text-[#1f1f1f]">Reading the email and drafting…</p>
                    <p className="text-[11px] text-[#5f6368]">Nothing is created until you press the button below.</p>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-[#5f6368] leading-relaxed">
                {draftSource === 'ai'
                  ? 'Written by AI from the email text — nothing invented, but read it over and edit anything before you create.'
                  : 'You can edit every field before creating.'}
              </p>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="ete-date" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">
                Date
              </label>
              <input
                id="ete-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="ete-time" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">
                Time
              </label>
              <input
                id="ete-time"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="ete-duration" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">
                Duration
              </label>
              <select
                id="ete-duration"
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
                className={fieldClass}
              >
                {[15, 30, 45, 60, 90].map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* What to create */}
          <div className="bg-[#f8fafd] border border-[#e8eaed] rounded-2xl p-3.5 space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createCalendarEvt}
                onChange={(e) => setCreateCalendarEvt(e.target.checked)}
                className="w-4 h-4 text-[#1a73e8] cursor-pointer"
              />
              <span className="font-semibold text-xs text-[#1f1f1f]">Create a Google Calendar event</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createTaskItem}
                onChange={(e) => setCreateTaskItem(e.target.checked)}
                className="w-4 h-4 text-[#1a73e8] cursor-pointer"
              />
              <span className="font-semibold text-xs text-[#1f1f1f]">Create a Google Task with these details</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeMeetLink}
                onChange={(e) => setIncludeMeetLink(e.target.checked)}
                className="w-4 h-4 text-[#1a73e8] cursor-pointer"
              />
              <span className="font-semibold text-xs text-[#1f1f1f] inline-flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#188038]" />
                Add a real Google Meet link to both
              </span>
            </label>
          </div>

          {createCalendarEvt && (
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">
                Calendar event description (preview)
              </span>
              <div className="p-3.5 text-xs leading-relaxed text-[#444746] bg-[#f8fafd] rounded-xl border border-[#e8eaed] whitespace-pre-line">
                {eventDescriptionPreview}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#f8fafd] border-t border-[#f1f3f4] flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#5f6368] truncate">
            {isDrafting
              ? 'Drafting — nothing is created yet'
              : 'Creates a Calendar event and a Task in your Google account'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#f1f3f4] border border-[#dadce0] text-[#1f1f1f] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting || isDrafting || (!createTaskItem && !createCalendarEvt)}
              className="px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
              {isSubmitting ? 'Creating…' : 'Create event & task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
