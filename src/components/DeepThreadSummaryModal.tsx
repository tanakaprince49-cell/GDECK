import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Mail,
  Copy,
  Check,
  Clock,
  FileText,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { GmailMessageItem } from '../types/workspace';
import { generateDraftText, AiDraftError } from '../services/aiDraft';
import { ProBadge } from './ProBadge';

interface DeepThreadSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: GmailMessageItem | null;
}

const TLDR_INSTRUCTION = `You write executive TL;DR summaries of email threads.
Return ONLY a JSON object. No markdown, no code fences, no commentary:
{ "tldr": ["...", "..."], "actionItems": ["..."] }
Rules:
- tldr: 3-5 bullets. Each is one plain English sentence with no leading dash or markdown, covering in order what happened, what was decided, and what is still unresolved — only as far as the thread supports.
- actionItems: 0-5 items. Each is a short imperative sentence saying what must happen next, naming who or when only if the thread states it.
- Use only what is in the thread. Never invent people, decisions, dates or commitments.
- If the message is too short to summarise, return {"tldr": [], "actionItems": []}.`;

export const DeepThreadSummaryModal: React.FC<DeepThreadSummaryModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [summaryBullets, setSummaryBullets] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);
  const summarizedForRef = useRef<string | null>(null);

  const summarize = async () => {
    if (!message) return;
    summarizedForRef.current = message.id;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setSummaryBullets([]);
    setActionItems([]);
    try {
      const body = (message.bodyText || message.body || message.snippet || '').slice(0, 4000);
      const text = await generateDraftText(
        [
          `Subject: ${message.subject || '(no subject)'}`,
          `From: ${message.from || 'unknown'}`,
          message.date ? `Date: ${message.date}` : null,
          '',
          'Thread:',
          body || '(no body text available)',
        ]
          .filter((l) => l !== null)
          .join('\n'),
        { systemInstruction: TLDR_INSTRUCTION, signal: controller.signal }
      );

      const clean = text.replace(/```json|```/g, '').trim();
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) {
        throw new Error('The AI did not return a readable summary.');
      }
      const parsed = JSON.parse(clean.slice(start, end + 1));
      const tldr = Array.isArray(parsed.tldr)
        ? parsed.tldr.filter((b: any) => typeof b === 'string' && b.trim()).map((b: string) => b.trim())
        : [];
      const actions = Array.isArray(parsed.actionItems)
        ? parsed.actionItems.filter((a: any) => typeof a === 'string' && a.trim()).map((a: string) => a.trim())
        : [];
      setSummaryBullets(tldr);
      setActionItems(actions);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError(
        err instanceof AiDraftError
          ? err.message
          : 'The AI could not summarize this thread. You can retry, or read the message below.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-summarize the first time a given message is opened; abort when closed.
  useEffect(() => {
    if (!isOpen || !message) {
      abortRef.current?.abort();
      return;
    }
    if (summarizedForRef.current !== message.id) {
      void summarize();
    }
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, message]);

  if (!isOpen || !message) return null;

  const handleCopy = async () => {
    const text = [
      `THREAD TL;DR — ${message.subject || '(no subject)'}`,
      `From: ${message.from || 'unknown'}`,
      '',
      'SUMMARY:',
      summaryBullets.map((b) => `- ${b}`).join('\n') || '(none)',
      '',
      'ACTION ITEMS:',
      actionItems.map((a) => `[ ] ${a}`).join('\n') || '(none)',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Your browser blocked clipboard access.');
    }
  };

  const excerpt = (message.bodyText || message.body || message.snippet || '').slice(0, 600);
  const done = !loading && !error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Thread TL;DR"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#dadce0] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-[#f1f3f4]">
          <div className="w-9 h-9 shrink-0 rounded-2xl bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center">
            <FileText className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-bold text-[#1f1f1f] tracking-tight truncate">Thread TL;DR</h3>
              <ProBadge size="xs" featureTitle="Deep Email Thread Summarization" />
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

        {/* Message context strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 sm:px-6 py-2.5 bg-[#f8fafd] border-b border-[#f1f3f4] text-[11px] text-[#5f6368]">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {message.from?.split('<')[0]?.trim() || message.from || 'Unknown sender'}
          </span>
          {message.date && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(message.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Summarized from the message text
          </span>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-4 space-y-3.5 overflow-y-auto flex-1">
          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-[#fce8e6] border border-[#fad2cf] text-[#c5221f] text-xs font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
              <span className="leading-relaxed flex-1">{error}</span>
              <button
                type="button"
                id="tldr-retry-btn"
                onClick={summarize}
                className="shrink-0 inline-flex items-center gap-1 font-bold underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          <div className="border border-[#dadce0] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#faf5ff] border-b border-[#f3e8ff]">
              <span className="text-xs font-bold text-[#7e22ce] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7e22ce]" />
                What this thread says
              </span>
              <button
                type="button"
                onClick={summarize}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#7e22ce] hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                {summaryBullets.length ? 'Rebuild' : 'Summarize'}
              </button>
            </div>

            <div className="p-4 bg-white space-y-4">
              {loading ? (
                <div className="space-y-2" aria-hidden="true">
                  <div className="h-2.5 bg-[#f1f3f4] rounded-full w-full animate-pulse" />
                  <div className="h-2.5 bg-[#f1f3f4] rounded-full w-11/12 animate-pulse" />
                  <div className="h-2.5 bg-[#f1f3f4] rounded-full w-2/3 animate-pulse" />
                  <p className="text-[11px] text-[#5f6368] pt-1">Reading the thread…</p>
                </div>
              ) : done && summaryBullets.length > 0 ? (
                <>
                  <ul className="space-y-2">
                    {summaryBullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-[#1f1f1f] leading-relaxed">
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-md bg-[#f3e8ff] text-[#7e22ce] text-[10px] font-bold flex items-center justify-center mt-px">
                          {idx + 1}
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  {actionItems.length > 0 && (
                    <div className="pt-3 border-t border-[#f1f3f4]">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#5f6368] mb-2">
                        Action items · {actionItems.length}
                      </h4>
                      <ul className="space-y-1.5">
                        {actionItems.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-[#1f1f1f] leading-relaxed">
                            <span className="shrink-0 w-[14px] h-[14px] mt-0.5 rounded-[4px] border-2 border-[#188038] bg-white" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : done ? (
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  This message is too short to summarize — there is not enough in the thread to
                  write about without guessing, so nothing was made up. The text is below.
                </p>
              ) : (
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  No summary yet. Press Summarize to read this thread in a few lines.
                </p>
              )}
            </div>
          </div>

          {excerpt && (
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">
                Original message
              </span>
              <div className="p-3.5 text-xs leading-relaxed text-[#444746] bg-[#f8fafd] rounded-xl border border-[#e8eaed] whitespace-pre-line max-h-44 overflow-y-auto">
                {excerpt}
                {(message.bodyText || message.body || message.snippet || '').length > 600 ? ' …' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#f8fafd] border-t border-[#f1f3f4] flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#5f6368] truncate">
            {loading ? 'Reading the thread — nothing is sent from here' : 'Written from this message only'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              disabled={!done || (!summaryBullets.length && !actionItems.length)}
              className="px-4 py-2 bg-white hover:bg-[#f1f3f4] border border-[#dadce0] text-[#1f1f1f] text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 inline mr-1" /> : <Copy className="w-3.5 h-3.5 inline mr-1" />}
              {copied ? 'Copied' : 'Copy summary'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
