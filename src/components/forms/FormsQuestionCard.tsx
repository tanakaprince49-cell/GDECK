import React from 'react';
import {
  Copy,
  Trash2,
  MoreVertical,
  Circle,
  Square,
  X,
  ChevronDown,
  CircleDot,
  CheckSquare,
  AlignLeft,
  List,
  Sliders,
  GripVertical,
} from 'lucide-react';
import { FormQuestion, FormOption } from './formsData';

interface FormsQuestionCardProps {
  question: FormQuestion;
  isActive: boolean;
  onActivate: () => void;
  onUpdate: (updated: Partial<FormQuestion>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  primaryColor: string;
}

export const FormsQuestionCard: React.FC<FormsQuestionCardProps> = ({
  question,
  isActive,
  onActivate,
  onUpdate,
  onDuplicate,
  onDelete,
  primaryColor,
}) => {
  const handleAddOption = () => {
    const newOpt: FormOption = {
      id: `opt-${Date.now()}`,
      text: `Option ${question.options.length + 1}`,
    };
    onUpdate({ options: [...question.options, newOpt] });
  };

  const handleUpdateOption = (optId: string, text: string) => {
    onUpdate({
      options: question.options.map((o) => (o.id === optId ? { ...o, text } : o)),
    });
  };

  const handleRemoveOption = (optId: string) => {
    if (question.options.length <= 1) return;
    onUpdate({
      options: question.options.filter((o) => o.id !== optId),
    });
  };

  return (
    <div
      onClick={onActivate}
      className={`bg-white rounded-xl border transition-all select-none overflow-hidden ${
        isActive
          ? 'border-[#dadce0] shadow-md border-l-[6px]'
          : 'border-[#dadce0] hover:border-[#bdc1c6] shadow-2xs'
      }`}
      style={{
        borderLeftColor: isActive ? primaryColor : undefined,
      }}
    >
      {/* Drag handle dots at top */}
      <div className="h-5 flex items-center justify-center text-[#bdc1c6] hover:text-[#5f6368] cursor-grab">
        <GripVertical className="w-4 h-4 rotate-90" />
      </div>

      <div className="p-6 pt-1 space-y-5">
        {isActive ? (
          /* ACTIVE EDITING STATE */
          <div className="space-y-4">
            {/* Question Title & Question Type Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 w-full bg-[#f8fafd] border-b-2 border-[#1a73e8] px-3 py-2 rounded-t">
                <input
                  type="text"
                  value={question.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="Question"
                  className="w-full text-base font-medium text-[#1f1f1f] bg-transparent outline-none"
                  autoFocus
                />
              </div>

              {/* Question Type Dropdown */}
              <div className="relative w-full sm:w-56 shrink-0">
                <select
                  value={question.type}
                  onChange={(e) => onUpdate({ type: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-[#f8fafd] border border-[#dadce0] rounded-xl text-xs font-semibold text-[#1f1f1f] outline-none cursor-pointer appearance-none pr-8"
                >
                  <option value="MULTIPLE_CHOICE">Multiple choice</option>
                  <option value="CHECKBOX">Checkboxes</option>
                  <option value="SHORT_ANSWER">Short answer</option>
                  <option value="PARAGRAPH">Paragraph</option>
                  <option value="DROPDOWN">Dropdown</option>
                  <option value="LINEAR_SCALE">Linear scale</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#5f6368] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Question Content Body */}
            <div className="space-y-3 pt-2">
              {/* Multiple Choice & Checkboxes */}
              {(question.type === 'MULTIPLE_CHOICE' ||
                question.type === 'CHECKBOX' ||
                question.type === 'DROPDOWN') && (
                <div className="space-y-2.5">
                  {question.options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-3 group">
                      {question.type === 'MULTIPLE_CHOICE' && (
                        <Circle className="w-4 h-4 text-[#80868b] shrink-0" />
                      )}
                      {question.type === 'CHECKBOX' && (
                        <Square className="w-4 h-4 text-[#80868b] shrink-0" />
                      )}
                      {question.type === 'DROPDOWN' && (
                        <span className="text-xs text-[#80868b] w-4 font-mono">{idx + 1}.</span>
                      )}

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleUpdateOption(opt.id, e.target.value)}
                        className="flex-1 text-sm text-[#1f1f1f] border-b border-transparent focus:border-[#1a73e8] outline-none py-1 hover:border-[#dadce0]"
                      />

                      {question.options.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveOption(opt.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#f0f4f9] rounded-full text-[#5f6368] cursor-pointer transition-opacity"
                          title="Remove option"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add Option Link */}
                  <div className="flex items-center gap-3 pt-1 text-sm">
                    {question.type === 'MULTIPLE_CHOICE' && (
                      <Circle className="w-4 h-4 text-[#dadce0] shrink-0" />
                    )}
                    {question.type === 'CHECKBOX' && (
                      <Square className="w-4 h-4 text-[#dadce0] shrink-0" />
                    )}
                    {question.type === 'DROPDOWN' && (
                      <span className="text-xs text-[#dadce0] w-4 font-mono">
                        {question.options.length + 1}.
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 text-[#5f6368]">
                      <button
                        onClick={handleAddOption}
                        className="text-xs font-semibold hover:text-[#1a73e8] cursor-pointer"
                      >
                        Add option
                      </button>
                      <span>or</span>
                      <button
                        onClick={() => {
                          const otherOpt: FormOption = {
                            id: `opt-other-${Date.now()}`,
                            text: 'Other...',
                          };
                          onUpdate({ options: [...question.options, otherOpt] });
                        }}
                        className="text-xs font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                      >
                        add "Other"
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Short Answer */}
              {question.type === 'SHORT_ANSWER' && (
                <div className="py-2">
                  <div className="w-3/5 border-b border-dotted border-[#80868b] pb-1 text-xs text-[#80868b]">
                    Short answer text
                  </div>
                </div>
              )}

              {/* Paragraph */}
              {question.type === 'PARAGRAPH' && (
                <div className="py-2">
                  <div className="w-4/5 border-b border-dotted border-[#80868b] pb-1 text-xs text-[#80868b]">
                    Long answer text
                  </div>
                </div>
              )}

              {/* Linear Scale */}
              {question.type === 'LINEAR_SCALE' && (
                <div className="py-3 flex items-center gap-6 text-xs text-[#5f6368]">
                  <span>1 (Poor)</span>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="flex flex-col items-center gap-1">
                        <span className="font-mono">{n}</span>
                        <Circle className="w-4 h-4 text-[#80868b]" />
                      </div>
                    ))}
                  </div>
                  <span>5 (Excellent)</span>
                </div>
              )}
            </div>

            {/* Bottom Card Controls */}
            <div className="pt-4 border-t border-[#f1f3f4] flex items-center justify-end gap-3 text-[#5f6368]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="p-2 hover:bg-[#f0f4f9] hover:text-[#1f1f1f] rounded-full cursor-pointer transition-colors"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 hover:bg-[#f0f4f9] hover:text-[#ea4335] rounded-full cursor-pointer transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-[#dadce0] mx-1" />

              {/* Required Switch */}
              <label
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1f1f1f]"
              >
                <span>Required</span>
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => onUpdate({ required: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    question.required ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      question.required ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </div>
              </label>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  alert('Question settings: Description, Go to section based on answer, Shuffle option order');
                }}
                className="p-2 hover:bg-[#f0f4f9] hover:text-[#1f1f1f] rounded-full cursor-pointer"
                title="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* INACTIVE DISPLAY STATE (Clean Respondent View) */
          <div className="space-y-3 cursor-pointer">
            <div className="flex items-start justify-between">
              <p className="text-base font-medium text-[#1f1f1f]">
                {question.title}
                {question.required && <span className="text-[#d93025] ml-1">*</span>}
              </p>
            </div>

            {/* Options view */}
            <div className="space-y-2 pt-1">
              {(question.type === 'MULTIPLE_CHOICE' || question.type === 'CHECKBOX') &&
                question.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-3 text-sm text-[#444746]">
                    {question.type === 'MULTIPLE_CHOICE' ? (
                      <Circle className="w-4 h-4 text-[#80868b] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[#80868b] shrink-0" />
                    )}
                    <span>{opt.text}</span>
                  </div>
                ))}

              {question.type === 'SHORT_ANSWER' && (
                <div className="w-3/5 border-b border-[#dadce0] pb-1 text-xs text-[#80868b]">
                  Short-answer text
                </div>
              )}

              {question.type === 'PARAGRAPH' && (
                <div className="w-4/5 border-b border-[#dadce0] pb-1 text-xs text-[#80868b]">
                  Long-answer text
                </div>
              )}

              {question.type === 'DROPDOWN' && (
                <div className="w-48 px-3 py-2 border border-[#dadce0] rounded-lg text-xs text-[#5f6368] flex items-center justify-between">
                  <span>Choose</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
