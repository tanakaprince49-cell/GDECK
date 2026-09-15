import React, { useState } from 'react';
import { List, ChevronLeft, ChevronRight, Plus, AlignLeft } from 'lucide-react';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

interface DocsOutlineProps {
  headings: HeadingItem[];
  onHeadingClick: (text: string) => void;
  summary: string;
  onSummaryChange: (summary: string) => void;
}

export const DocsOutline: React.FC<DocsOutlineProps> = ({
  headings,
  onHeadingClick,
  summary,
  onSummaryChange,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);

  return (
    <div className="relative shrink-0 flex items-start select-none">
      {isOpen ? (
        <aside
          aria-label="Document Outline and Navigation"
          className="w-56 bg-[#f9fbfd] border-r border-[#dadce0] p-4 flex flex-col h-full overflow-y-auto text-xs space-y-5"
        >
          {/* Header with collapse button */}
          <div className="flex items-center justify-between text-[#444746]">
            <span className="font-semibold text-xs tracking-tight">Document outline</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-[#e8eaed] rounded-full cursor-pointer text-[#5f6368]"
              title="Close document outline"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Summary Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">
              <span>Summary</span>
              {!isEditingSummary && (
                <button
                  onClick={() => setIsEditingSummary(true)}
                  className="hover:text-[#1a73e8] cursor-pointer"
                  title="Edit summary"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isEditingSummary ? (
              <div className="space-y-1">
                <textarea
                  value={summary}
                  onChange={(e) => onSummaryChange(e.target.value)}
                  placeholder="Add a summary..."
                  className="w-full p-2 bg-white rounded border border-[#dadce0] text-xs outline-none focus:border-[#1a73e8] resize-none"
                  rows={3}
                />
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => setIsEditingSummary(false)}
                    className="px-2 py-0.5 bg-[#1a73e8] text-white rounded text-[10px] font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => setIsEditingSummary(true)}
                className="text-xs text-[#5f6368] italic hover:text-[#1f1f1f] cursor-pointer"
              >
                {summary || 'Add a summary to this document'}
              </p>
            )}
          </div>

          <div className="h-px bg-[#dadce0]" />

          {/* Headings Outline */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">
              Headings ({headings.length})
            </p>

            {headings.length === 0 ? (
              <p className="text-xs text-[#80868b] leading-relaxed">
                Headings you add to the document will appear here.
              </p>
            ) : (
              <div className="space-y-1">
                {headings.map((h, idx) => (
                  <button
                    key={idx}
                    onClick={() => onHeadingClick(h.text)}
                    className={`w-full text-left truncate py-1 px-1.5 rounded hover:bg-[#e8f0fe] hover:text-[#1a73e8] text-[#444746] transition-colors cursor-pointer ${
                      h.level === 1 ? 'font-semibold text-xs' : h.level === 2 ? 'pl-3 text-[11px]' : 'pl-5 text-[11px]'
                    }`}
                    title={h.text}
                  >
                    {h.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      ) : (
        /* Floating Tab to expand outline */
        <button
          onClick={() => setIsOpen(true)}
          className="mt-3 ml-2 p-1.5 bg-white border border-[#dadce0] rounded-full shadow-xs text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#f0f4f9] transition-all cursor-pointer z-10"
          title="Show document outline"
        >
          <List className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
