import React, { useState } from 'react';
import { X, Pencil, CheckCircle2 } from 'lucide-react';
import { FormQuestion } from './formsData';

interface FormsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  questions: FormQuestion[];
  primaryColor: string;
  bgColor: string;
  fontFamily: string;
  confirmationMessage: string;
}

export const FormsPreviewModal: React.FC<FormsPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  questions,
  primaryColor,
  bgColor,
  fontFamily,
  confirmationMessage,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex flex-col p-4 sm:p-8"
      style={{ backgroundColor: bgColor, fontFamily }}
    >
      {/* Floating Edit Switcher at bottom right */}
      <button
        onClick={onClose}
        className="fixed bottom-6 right-6 z-50 p-3.5 bg-white rounded-full shadow-2xl border border-[#dadce0] text-[#5f6368] hover:text-[#1a73e8] flex items-center gap-2 text-xs font-semibold cursor-pointer hover:scale-105 transition-all"
        title="Edit this form"
      >
        <Pencil className="w-4 h-4 text-[#1a73e8]" />
        <span className="hidden sm:inline">Edit this form</span>
      </button>

      {/* Top Banner & Container */}
      <div className="w-full max-w-[640px] mx-auto space-y-4 my-auto">
        {submitted ? (
          /* Confirmation Screen */
          <div className="bg-white rounded-xl border border-[#dadce0] overflow-hidden shadow-sm">
            <div className="h-2.5 w-full" style={{ backgroundColor: primaryColor }} />
            <div className="p-8 space-y-4">
              <h2 className="text-2xl font-bold text-[#1f1f1f]">{title}</h2>
              <p className="text-sm text-[#444746]">{confirmationMessage}</p>
              <button
                onClick={handleReset}
                className="text-xs font-semibold text-[#1a73e8] hover:underline cursor-pointer pt-2 block"
              >
                Submit another response
              </button>
            </div>
          </div>
        ) : (
          /* Live Form Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title Card */}
            <div className="bg-white rounded-xl border border-[#dadce0] overflow-hidden shadow-2xs">
              <div className="h-2.5 w-full" style={{ backgroundColor: primaryColor }} />
              <div className="p-6 space-y-3">
                <h1 className="text-3xl font-bold text-[#1f1f1f]">{title}</h1>
                <p className="text-sm text-[#444746] leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
                <div className="pt-2 border-t border-[#f1f3f4] text-xs text-[#d93025]">
                  * Indicates required question
                </div>
              </div>
            </div>

            {/* Questions Cards */}
            {questions.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-[#dadce0] p-6 shadow-2xs space-y-4"
              >
                <p className="text-base font-medium text-[#1f1f1f]">
                  {q.title} {q.required && <span className="text-[#d93025]">*</span>}
                </p>

                {/* Multiple choice */}
                {q.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-3 pt-1">
                    {q.options.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-3 text-sm text-[#1f1f1f] cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          required={q.required}
                          value={opt.text}
                          onChange={() => setAnswers({ ...answers, [q.id]: opt.text })}
                          className="w-4 h-4 text-[#673ab7] focus:ring-[#673ab7]"
                        />
                        <span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkbox */}
                {q.type === 'CHECKBOX' && (
                  <div className="space-y-3 pt-1">
                    {q.options.map((opt) => {
                      const currentSelected = (answers[q.id] as string[]) || [];
                      return (
                        <label
                          key={opt.id}
                          className="flex items-center gap-3 text-sm text-[#1f1f1f] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={currentSelected.includes(opt.text)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...currentSelected, opt.text]
                                : currentSelected.filter((v) => v !== opt.text);
                              setAnswers({ ...answers, [q.id]: updated });
                            }}
                            className="w-4 h-4 rounded text-[#673ab7] focus:ring-[#673ab7]"
                          />
                          <span>{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Short answer */}
                {q.type === 'SHORT_ANSWER' && (
                  <input
                    type="text"
                    required={q.required}
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Your answer"
                    className="w-full sm:w-2/3 border-b border-[#dadce0] focus:border-[#1a73e8] py-1 text-sm outline-none bg-transparent"
                  />
                )}

                {/* Paragraph */}
                {q.type === 'PARAGRAPH' && (
                  <textarea
                    required={q.required}
                    rows={2}
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Your answer"
                    className="w-full border-b border-[#dadce0] focus:border-[#1a73e8] py-1 text-sm outline-none bg-transparent resize-none"
                  />
                )}
              </div>
            ))}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg text-white font-semibold text-sm shadow-xs hover:shadow-md cursor-pointer transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                Submit
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-[#5f6368] hover:text-[#1f1f1f] cursor-pointer"
              >
                Clear form
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
