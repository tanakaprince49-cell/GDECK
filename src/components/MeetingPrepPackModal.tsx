import { usePlan } from '../context/PlanContext';
import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  CalendarClock,
  FileText,
  Mail,
  Users,
  Clock,
  MapPin,
  Check,
  Copy,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { CalendarEvent } from '../types/workspace';
import { listDriveFiles, listGmailMessages } from '../services/workspace';
import { generateDraftText, describeEventWindow, AiDraftError } from '../services/aiDraft';
import { ProBadge } from './ProBadge';

interface PrepDoc {
  id?: string;
  name?: string;
  mimeType?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  owners?: { displayName?: string }[];
}

interface PrepMail {
  id?: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

interface MeetingPrepPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  token: string;
}

const PREP_INSTRUCTION = `You prepare busy executives for a meeting, using only the material supplied.
Return plain text only — no markdown symbols such as * or #, no preamble, no closing remarks.
Use exactly these four sections, each starting on its own line with the label and a colon:
AGREED AGENDA: one or two sentences on what this meeting is for, from the invite.
CONTEXT FROM YOUR FILES: 2-4 bullets (-) of the most relevant facts from the supplied Drive/Gmail excerpts, each ending with its source title in parentheses.
TALKING POINTS: 3-5 bullets (-).
WATCH-OUTS: up to 3 bullets (-) of risks, open questions or people who have not accepted the invite.
Never invent facts, names, figures or dates. If the excerpts are empty or unrelated, write "No prior documents found for this meeting." as the single bullet under CONTEXT and derive the rest from the invite alone.`;

export const MeetingPrepPackModal: React.FC<MeetingPrepPackModalProps> = ({
  isOpen,
  onClose,
  event,
  token,
}) => {
  const { isPro, requirePro } = usePlan();

  // Free users: never keep this Pro surface open — instant paywall.
  React.useEffect(() => {
    if (!isOpen) return;
    if (!isPro) {
      onClose();
      requirePro(
        'Meeting Prep Packs',
        'One-click briefing with relevant emails, Drive files, and attendee details.',
      );
    }
  }, [isOpen, isPro, onClose, requirePro]);

  const [driveFiles, setDriveFiles] = useState<PrepDoc[]>([]);
  const [gmailMessages, setGmailMessages] = useState<PrepMail[]>([]);
  const [brief, setBrief] = useState<string>('');
  const [isGathering, setIsGathering] = useState<boolean>(false);
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);
  const ranForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !isPro || !event) {
      abortRef.current?.abort();
      return;
    }
    if (ranForRef.current === event.id) return;
    ranForRef.current = event.id;
    void build();

    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isPro, event]);

  const build = async () => {
    if (!event) return;
    setError(null);
    setCopied(false);
    setIsGathering(true);

    // Search each provider with the meeting's own words. One failing source must not
    // take the whole pack down with it.
    const words = (event.summary || '').split(/\s+/).filter((w) => w.length > 3).slice(0, 4);
    const phrase = words.join(' ');

    // Drive matches a name substring, so a long title rarely hits. Try the full phrase
    // first, then the single most distinctive word.
    let files: PrepDoc[] = [];
    if (phrase) {
      files = await listDriveFiles(token, phrase).catch(() => [] as PrepDoc[]);
      if (files.length === 0 && words.length > 1) {
        files = await listDriveFiles(token, words[0]).catch(() => [] as PrepDoc[]);
      }
    }
    files = files.slice(0, 4);

    const mails = (
      phrase
        ? await listGmailMessages(token, 4, `subject:${phrase}`).catch(() => [] as PrepMail[])
        : []
    ).slice(0, 4);
    setDriveFiles(files);
    setGmailMessages(mails);
    setIsGathering(false);

    const fileLines = files
      .map((f, i) => `${i + 1}. ${f.name || 'Untitled'}${f.modifiedTime ? ` (updated ${new Date(f.modifiedTime).toLocaleDateString()})` : ''}`)
      .join('\n');
    const mailLines = mails
      .map((m, i) => `${i + 1}. "${m.subject || '(no subject)'}"${m.date ? ` [${m.date}]` : ''} — ${(m.snippet || '').slice(0, 240)}`)
      .join('\n');

    setIsDrafting(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const text = await generateDraftText(
        [
          describeEventWindow(event),
          `\nRelated Drive files:\n${fileLines || 'none found'}`,
          `\nRelated Gmail threads:\n${mailLines || 'none found'}`,
          '\nWrite the prep pack now.',
        ].join('\n'),
        { systemInstruction: PREP_INSTRUCTION, signal: controller.signal, maxOutputTokens: 1000, tag: 'prep-pack' }
      );
      setBrief(text);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setBrief('');
      setError(
        err instanceof AiDraftError
          ? `${err.message} The sources below were still gathered from your account.`
          : 'The AI brief could not be generated. The sources below were still gathered.'
      );
    } finally {
      setIsDrafting(false);
    }
  };

  if (!isOpen || !event) return null;
  if (!isPro) return null;

  const attendees = event.attendees || [];
  const pending = attendees.filter((a: any) => a.responseStatus && a.responseStatus !== 'accepted').length;

  const handleCopy = async () => {
    const pack = [
      `MEETING: ${event.summary || 'Untitled'}`,
      `WHEN: ${event.start?.dateTime ? new Date(event.start.dateTime).toLocaleString() : 'not set'}`,
      event.location ? `WHERE: ${event.location}` : '',
      attendees.length ? `ATTENDEES: ${attendees.map((a: any) => a.email).join(', ')}` : '',
      brief ? `\nPREP PACK\n${brief}` : '',
      driveFiles.length
        ? `\nDRIVE (${driveFiles.length})\n${driveFiles.map((f) => `${f.name || 'Untitled'}${f.webViewLink ? ` — ${f.webViewLink}` : ''}`).join('\n')}`
        : '',
      gmailMessages.length
        ? `\nGMAIL (${gmailMessages.length})\n${gmailMessages.map((m) => m.subject || '(no subject)').join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(pack);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Your browser blocked clipboard access.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Meeting prep pack"
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
              <h3 className="text-base font-bold text-[#1f1f1f] tracking-tight truncate">Meeting prep pack</h3>
              <ProBadge size="xs" featureTitle="Meeting Prep Packs" />
            </div>
            <p className="text-xs text-[#5f6368] leading-snug truncate">{event.summary || 'This meeting'}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meeting context */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 sm:px-6 py-2.5 bg-[#f8fafd] border-b border-[#f1f3f4] text-[11px] text-[#5f6368]">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleString() : 'Time not set'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {event.location || 'No location'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {attendees.length ? `${attendees.length} invited${pending ? ` · ${pending} yet to respond` : ''}` : 'No invitees listed'}
          </span>
        </div>

        <div className="px-5 sm:px-6 py-4 space-y-3 overflow-y-auto flex-1">
          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-[#fce8e6] border border-[#fad2cf] text-[#c5221f] text-xs font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
              <span className="leading-relaxed flex-1">{error}</span>
              <button onClick={() => setError(null)} className="shrink-0 font-bold underline cursor-pointer">Dismiss</button>
            </div>
          )}

          {/* The brief */}
          <div className="border border-[#dadce0] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#faf5ff] border-b border-[#f3e8ff]">
              <span className="text-xs font-bold text-[#7e22ce] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7e22ce]" />
                Brief &amp; talking points
              </span>
              <button
                type="button"
                onClick={build}
                disabled={isDrafting || isGathering}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#7e22ce] hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isDrafting || isGathering ? 'animate-spin' : ''}`} />
                Rebuild
              </button>
            </div>

            {isGathering ? (
              <div className="p-4 space-y-2">
                <p className="text-xs font-semibold text-[#1f1f1f]">Gathering your sources</p>
                <div className="flex flex-col gap-1.5 text-[11px] text-[#5f6368]">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
                    Searching Drive for “{event.summary}”
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-[#ea4335] border-t-transparent rounded-full animate-spin" />
                    Scanning Gmail for related threads
                  </span>
                </div>
              </div>
            ) : isDrafting ? (
              <div className="p-4">
                <p className="text-xs font-semibold text-[#1f1f1f] mb-3">
                  Reading {driveFiles.length + gmailMessages.length} source{driveFiles.length + gmailMessages.length === 1 ? '' : 's'} and writing your brief
                </p>
                <div className="space-y-2" aria-hidden="true">
                  <div className="h-2.5 bg-[#f1f3f4] rounded-full w-full animate-pulse" />
                  <div className="h-2.5 bg-[#f1f3f4] rounded-full w-11/12 animate-pulse" />
                  <div className="h-2.5 bg-[#f1f3f4] rounded-full w-2/3 animate-pulse" />
                  <div className="h-2.5 bg-[#f1f3f4] rounded-full w-5/6 animate-pulse" />
                </div>
              </div>
            ) : brief ? (
              <div className="p-4 bg-white">
                <p className="text-xs text-[#1f1f1f] leading-relaxed font-body whitespace-pre-line">{brief}</p>
              </div>
            ) : (
              <div className="p-4 bg-white">
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  No brief yet. Press Rebuild to generate one from this invite and the sources below.
                </p>
              </div>
            )}
          </div>

          {/* Sources */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#f8fafd] border border-[#e8eaed] rounded-2xl p-3.5 space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Drive · {driveFiles.length}
              </h4>
              {driveFiles.length === 0 ? (
                <p className="text-[11px] text-[#5f6368]">No files matched “{event.summary}”.</p>
              ) : (
                <ul className="space-y-1.5">
                  {driveFiles.map((f, i) => (
                    <li key={f.id || `${f.name}-${i}`} className="text-xs">
                      {(<span className="text-[#1f1f1f] leading-snug break-words">{f.name || 'Untitled'}</span>
                      )}
                      {f.owners?.[0]?.displayName && (
                        <span className="block text-[10px] text-[#9aa0a6]">owned by {f.owners[0].displayName}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-[#fef7f7] border border-[#fad2cf] rounded-2xl p-3.5 space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Gmail · {gmailMessages.length}
              </h4>
              {gmailMessages.length === 0 ? (
                <p className="text-[11px] text-[#5f6368]">No email threads matched this meeting.</p>
              ) : (
                <ul className="space-y-2">
                  {gmailMessages.map((m, i) => {
                    const subject = m.subject || '(no subject)';
                    const from = m.from || '';
                    const date = m.date || '';
                    return (
                      <li key={m.id || i} className="text-xs">
                        <span className="block font-semibold text-[#1f1f1f] leading-snug break-words">{subject}</span>
                        {from && <span className="block text-[10px] text-[#9aa0a6] truncate">{from}</span>}
                        {date && <span className="block text-[10px] text-[#9aa0a6]">{date}</span>}
                        {m.snippet && <span className="block text-[11px] text-[#5f6368] leading-snug mt-0.5">{m.snippet}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {attendees.length > 0 && (
            <div className="bg-[#f8fafd] border border-[#e8eaed] rounded-2xl p-3.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#5f6368] mb-2">
                Who’s coming · {attendees.length}
              </h4>
              <ul className="flex flex-wrap gap-1.5">
                {attendees.map((a: any, i: number) => {
                  const state = a.responseStatus || 'unknown';
                  const tone =
                    state === 'accepted'
                      ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
                      : state === 'declined'
                        ? 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]'
                        : 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]';
                  return (
                    <li
                      key={`${a.email || i}`}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] ${tone}`}
                      title={a.email}
                    >
                      {state === 'accepted' && <Check className="w-3 h-3" />}
                      <span className="max-w-[24ch] truncate">{a.displayName || a.email}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#f8fafd] border-t border-[#f1f3f4] flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#5f6368] truncate">
            {isGathering || isDrafting
              ? 'Working — nothing is sent or saved from here'
              : driveFiles.length + gmailMessages.length > 0
                ? `Built from ${driveFiles.length} file${driveFiles.length === 1 ? '' : 's'} and ${gmailMessages.length} thread${gmailMessages.length === 1 ? '' : 's'} in your account`
                : brief
                  ? 'Nothing in Drive or Gmail matched this title — the brief comes from the invite alone'
                  : 'Nothing found for this title, and no brief generated yet'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#f1f3f4] border border-[#dadce0] text-[#1f1f1f] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              disabled={!brief && driveFiles.length === 0 && gmailMessages.length === 0}
              className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy prep pack'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
