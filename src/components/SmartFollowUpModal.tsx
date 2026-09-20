import React, { useEffect, useRef, useState } from 'react';
import { X, Mail, Send, Check, Copy, Users, Clock, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import { CalendarEvent } from '../types/workspace';
import { sendGmailMessage } from '../services/workspace';
import { generateDraftText, describeEventWindow, AiDraftError } from '../services/aiDraft';
import { ProBadge } from './ProBadge';

interface SmartFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  token: string | null;
  onSuccess?: () => void;
}

const joinAttendees = (event: CalendarEvent | null) =>
  (event?.attendees || []).map((a: any) => a.email).filter(Boolean).join(', ');

const DRAFTER_INSTRUCTION = `You write post-meeting follow-up emails for busy executives using G-Deck.
Return ONLY the email body. No subject line, no markdown, no code fences, no preamble, no explanation.
Structure: a greeting line; two or three sentences recapping what the meeting covered; a numbered list of action items naming an owner and a date only when the meeting details support it; then one short closing line.
120-200 words, warm and professional plain text. Never invent attendees, commitments, dates or outcomes that are not present in the details you are given. If the details are thin, write a brief note asking attendees to confirm next steps.`;

export const SmartFollowUpModal: React.FC<SmartFollowUpModalProps> = ({
  isOpen,
  onClose,
  event,
  token,
  onSuccess,
}) => {
  // Seed from the event on mount so the first paint is already correct, then keep the
  // fields in sync whenever a different meeting is opened.
  const [subject, setSubject] = useState<string>(() => `Follow-up & action items: ${event?.summary || 'our meeting'}`);
  const [recipients, setRecipients] = useState<string>(() => joinAttendees(event));
  const [emailBody, setEmailBody] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const generatedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !event) {
      abortRef.current?.abort();
      return;
    }

    setSubject(`Follow-up & action items: ${event.summary || 'our meeting'}`);
    setRecipients(joinAttendees(event));
    setStatus(null);

    // Only auto-draft the first time a given meeting is opened, so regenerating stays explicit.
    if (generatedForRef.current !== event.id) {
      generatedForRef.current = event.id;
      setEmailBody('');
      void generate();
    }

    return () => {
      abortRef.current?.abort();
      setIsGenerating(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, event]);

  const generate = async () => {
    if (!event) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setStatus(null);
    try {
      const text = await generateDraftText(
        `${describeEventWindow(event)}\n\nDraft the follow-up email to send to all attendees.`,
        { systemInstruction: DRAFTER_INSTRUCTION, signal: controller.signal }
      );
      setEmailBody(text);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      generatedForRef.current = null;
      setStatus({
        tone: 'error',
        text: err instanceof AiDraftError ? err.message : 'Could not reach the AI service. You can still write the draft yourself below.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen || !event) return null;

  const attendeeCount = (event.attendees || []).length;

  const handleSend = async () => {
    if (!token) {
      setStatus({ tone: 'error', text: 'Connect Gmail first — sending needs an active Google session.' });
      return;
    }
    if (!recipients.trim()) {
      setStatus({ tone: 'error', text: 'Add at least one recipient before sending.' });
      return;
    }
    if (!emailBody.trim()) {
      setStatus({ tone: 'error', text: 'The draft is empty. Generate it or write it first.' });
      return;
    }

    setIsSending(true);
    setStatus(null);
    try {
      await sendGmailMessage(token, recipients, subject, emailBody);
      setStatus({ tone: 'ok', text: `Follow-up sent to ${attendeeCount || 'the'} attendee${attendeeCount === 1 ? '' : 's'}.` });
      onSuccess?.();
      setTimeout(onClose, 1600);
    } catch (err: any) {
      // The draft stays on screen so nothing is lost; no silent "success".
      setStatus({
        tone: 'error',
        text: `Gmail could not send this: ${err?.message || 'request failed'}. Your draft is still here — copy it, or try again.`,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`To: ${recipients}\nSubject: ${subject}\n\n${emailBody}`);
      setStatus({ tone: 'ok', text: 'Draft copied to your clipboard.' });
      setTimeout(() => setStatus(null), 2000);
    } catch {
      setStatus({ tone: 'error', text: 'Your browser blocked clipboard access.' });
    }
  };

  const fieldClass =
    'w-full px-3 py-2.5 text-xs bg-white rounded-xl border border-[#dadce0] text-[#1f1f1f] outline-none transition-colors focus:border-[#1a73e8] focus:ring-2 focus:ring-[#e8f0fe]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Smart follow-up"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#dadce0] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-[#f1f3f4]">
          <div className="w-9 h-9 shrink-0 rounded-2xl bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center">
            <Mail className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-bold text-[#1f1f1f] tracking-tight truncate">Smart follow-up</h3>
              <ProBadge size="xs" featureTitle="Smart Follow-Up Generator" />
            </div>
            <p className="text-xs text-[#5f6368] leading-snug truncate">
              {event.summary || 'This meeting'}
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
            {attendeeCount} attendee{attendeeCount === 1 ? '' : 's'}
          </span>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-4 space-y-3 overflow-y-auto flex-1">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="followup-recipients" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">
                To
              </label>
              <input
                id="followup-recipients"
                type="text"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder={attendeeCount ? '' : 'no attendees on the invite — add addresses'}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="followup-subject" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">
                Subject
              </label>
              <input
                id="followup-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5f6368]">Draft</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={generate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#7e22ce] hover:bg-[#faf5ff] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  {emailBody ? 'Regenerate' : 'Generate'}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!emailBody}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#5f6368] hover:bg-[#f1f3f4] transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={12}
                placeholder={isGenerating ? '' : "Nothing drafted yet — press Generate to draft this from the real meeting details."}
                className="w-full p-3.5 text-xs leading-relaxed text-[#1f1f1f] bg-[#f8fafd] rounded-2xl border border-[#dadce0] outline-none resize-y transition-colors focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#e8f0fe]"
              />
              {isGenerating && (
                <div className="absolute inset-0 rounded-2xl bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2.5 text-center px-6">
                  <div className="w-5 h-5 border-2 border-[#7e22ce] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold text-[#1f1f1f]">Drafting from this meeting’s details</p>
                  <p className="text-[11px] text-[#5f6368] max-w-xs">
                    Reading the invite, its agenda and attendee list. Nothing is sent yet.
                  </p>
                </div>
              )}
            </div>
            <p className="text-[11px] text-[#5f6368] mt-1.5">
              Written from the invite only. Edit anything before sending — this goes to real people.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#f8fafd] border-t border-[#f1f3f4] flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#5f6368] truncate">
            {token ? 'Sends from your connected Gmail' : 'Gmail not connected'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#f1f3f4] border border-[#dadce0] text-[#1f1f1f] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || isGenerating || !emailBody.trim()}
              className="px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending…' : 'Send follow-up'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
