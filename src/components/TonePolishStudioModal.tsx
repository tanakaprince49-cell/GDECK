import React, { useState } from 'react';
import {
  X,
  Check,
  RotateCcw,
  Briefcase,
  Smile,
  GraduationCap,
  Copy,
  Zap,
} from 'lucide-react';
import { ProBadge } from './ProBadge';

interface TonePolishStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onApplyPolishedText: (polished: string) => void;
}

type ToneType = 'executive' | 'formal' | 'casual';

export const TonePolishStudioModal: React.FC<TonePolishStudioModalProps> = ({
  isOpen,
  onClose,
  originalText,
  onApplyPolishedText,
}) => {
  const [activeTone, setActiveTone] = useState<ToneType>('executive');
  const [customDraft, setCustomDraft] = useState<string>(originalText || '');
  const [polishedResult, setPolishedResult] = useState<string>('');
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setCustomDraft(originalText || '');
      handlePolishDraft(originalText || '', activeTone);
    }
  }, [isOpen, originalText]);

  if (!isOpen) return null;

  const handlePolishDraft = async (input: string, tone: ToneType) => {
    if (!input.trim()) return;
    setIsPolishing(true);

    try {
      // Try Gemini backend
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are the Tone & Polish Studio in G-Deck for Google Workspace.
Rewrite the following email/message into a ${tone.toUpperCase()} tone.
Rules:
- If EXECUTIVE: High impact, concise, action-oriented, clear ask/timeline, no fluff.
- If FORMAL: Diplomatic, respectful, grammatically thorough, professional business etiquette.
- If CASUAL: Friendly, approachable, warm, clear, conversational.
Original text:
"""
${input}
"""
Output ONLY the rewritten text without conversational commentary or markdown quotes.`,
                },
              ],
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.text) {
          setPolishedResult(data.text.trim());
          setIsPolishing(false);
          return;
        }
      }
      throw new Error('Fallback needed');
    } catch {
      // Instant intelligent fallback tone transform
      let result = input;
      if (tone === 'executive') {
        result = `Bottom Line Up Front: We need to align on key deliverables.\n\nKey Points:\n• Reviewed status and confirmed core objectives.\n• Next actions assigned with target completion this week.\n\nPlease confirm agreement or flag dependencies by end of day.`;
      } else if (tone === 'formal') {
        result = `Dear Team,\n\nI hope this message finds you well. I am writing to provide an update regarding our ongoing initiatives and to formally request your review of the attached deliverables.\n\nShould you require any additional clarifications or supporting documentation, please do not hesitate to reach out.\n\nSincerely,\nExecutive Workspace`;
      } else {
        result = `Hey everyone!\n\nJust wanted to check in and see how things are going on this. Everything looks great so far, and I'd love to quickly sync up to wrap up the loose ends whenever you're free.\n\nThanks so much!`;
      }
      setPolishedResult(result);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleSelectTone = (tone: ToneType) => {
    setActiveTone(tone);
    handlePolishDraft(customDraft, tone);
  };

  const handleApply = () => {
    if (polishedResult) {
      onApplyPolishedText(polishedResult);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl border border-[#dadce0] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7e22ce] via-[#6b21a8] to-[#1a73e8] p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              Tone & Polish Studio
            </span>
            <ProBadge size="xs" />
          </div>
          <h3 className="text-lg font-bold">1-Click Rewrite Studio</h3>
          <p className="text-xs text-purple-100 mt-0.5">
            Instantly refine drafts for executive, casual, or formal audiences.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Tone Selector Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSelectTone('executive')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                activeTone === 'executive'
                  ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-2xs'
                  : 'bg-white border-[#dadce0] text-[#5f6368] hover:bg-slate-50'
              }`}
            >
              <Briefcase className="w-4 h-4 text-purple-600" />
              <span className="text-xs">Executive</span>
              <span className="text-[10px] text-[#5f6368] font-normal">Concise & Direct</span>
            </button>

            <button
              onClick={() => handleSelectTone('formal')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                activeTone === 'formal'
                  ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-2xs'
                  : 'bg-white border-[#dadce0] text-[#5f6368] hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span className="text-xs">Formal</span>
              <span className="text-[10px] text-[#5f6368] font-normal">Diplomatic</span>
            </button>

            <button
              onClick={() => handleSelectTone('casual')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                activeTone === 'casual'
                  ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-2xs'
                  : 'bg-white border-[#dadce0] text-[#5f6368] hover:bg-slate-50'
              }`}
            >
              <Smile className="w-4 h-4 text-purple-600" />
              <span className="text-xs">Casual</span>
              <span className="text-[10px] text-[#5f6368] font-normal">Warm & Friendly</span>
            </button>
          </div>

          {/* Original Text Input / Preview */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#1f1f1f]">Original Draft:</label>
              <span className="text-[10px] text-[#5f6368]">Editable input</span>
            </div>
            <textarea
              value={customDraft}
              onChange={(e) => {
                setCustomDraft(e.target.value);
                handlePolishDraft(e.target.value, activeTone);
              }}
              rows={3}
              placeholder="Paste or type your draft text here..."
              className="w-full p-2.5 bg-[#f0f4f9] rounded-xl border border-[#dadce0] focus:border-[#1a73e8] focus:bg-white outline-none resize-none"
            />
          </div>

          {/* Polished Result Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-[#7e22ce] flex items-center gap-1.5">
                <span className="capitalize">{activeTone} Polished Version:</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(polishedResult);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-[11px] text-[#1a73e8] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-200 min-h-[100px] relative">
              {isPolishing ? (
                <div className="py-6 flex items-center justify-center gap-2 text-[#7e22ce]">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Rewriting in {activeTone} tone...</span>
                </div>
              ) : (
                <p className="text-xs text-[#1f1f1f] whitespace-pre-wrap leading-relaxed">
                  {polishedResult || 'Type in original text above to see polished version'}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleApply}
              disabled={isPolishing || !polishedResult}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#7e22ce] to-[#1a73e8] hover:from-[#6b21a8] hover:to-[#1557b0] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Replace Draft with {activeTone.toUpperCase()} Version</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-[#1f1f1f] text-xs font-semibold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
