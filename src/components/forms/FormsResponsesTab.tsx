import React, { useState } from 'react';
import { MoreVertical, Download, Trash2, FileSpreadsheet, Inbox } from 'lucide-react';
import { FormQuestion, FormResponseItem } from './formsData';
import { GoogleSheetsIcon } from '../GoogleIcons';

interface FormsResponsesTabProps {
  questions: FormQuestion[];
  primaryColor: string;
  responses?: FormResponseItem[];
  onClearResponses?: () => void;
}

export const FormsResponsesTab: React.FC<FormsResponsesTabProps> = ({
  questions,
  primaryColor,
  responses = [],
  onClearResponses,
}) => {
  const [acceptingResponses, setAcceptingResponses] = useState(true);
  const [viewSubTab, setViewSubTab] = useState<'summary' | 'question' | 'individual'>('summary');
  const [currentIndividualIndex, setCurrentIndividualIndex] = useState(0);

  const responseCount = responses.length;

  return (
    <div className="w-full max-w-[770px] mx-auto space-y-4 select-none">
      {/* Top Responses Header Card */}
      <div className="bg-white rounded-xl border border-[#dadce0] p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-normal text-[#1f1f1f] font-['Google_Sans',Roboto,sans-serif]">
              {responseCount} {responseCount === 1 ? 'response' : 'responses'}
            </h2>
            <p className="text-xs text-[#5f6368] mt-0.5">
              {responseCount === 0 ? 'Waiting for responses' : 'Live responses recorded'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Link to Sheets Button */}
            <button
              onClick={() => alert('Opening linked Google Spreadsheet for form responses...')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#dadce0] hover:bg-[#f8fafd] text-xs font-semibold text-[#1f1f1f] cursor-pointer shadow-2xs transition-colors"
              title="Link to Sheets"
            >
              <GoogleSheetsIcon className="w-5 h-5" />
              <span>Link to Sheets</span>
            </button>

            {/* Accepting Responses Toggle */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-[#1f1f1f]">
                {acceptingResponses ? 'Accepting responses' : 'Not accepting responses'}
              </span>
              <button
                onClick={() => setAcceptingResponses(!acceptingResponses)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  acceptingResponses ? 'bg-[#188038]' : 'bg-[#dadce0]'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    acceptingResponses ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={() => alert('Download responses (.csv) • Print all responses')}
              className="p-1.5 hover:bg-[#f0f4f9] rounded-full text-[#5f6368] cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {responseCount > 0 && (
          /* Sub-tabs: Summary / Question / Individual */
          <div className="flex items-center gap-6 border-t border-[#f1f3f4] pt-3 text-xs font-semibold">
            <button
              onClick={() => setViewSubTab('summary')}
              className={`pb-1 cursor-pointer transition-colors ${
                viewSubTab === 'summary'
                  ? 'text-[#1a73e8] border-b-2 border-[#1a73e8]'
                  : 'text-[#5f6368] hover:text-[#1f1f1f]'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setViewSubTab('question')}
              className={`pb-1 cursor-pointer transition-colors ${
                viewSubTab === 'question'
                  ? 'text-[#1a73e8] border-b-2 border-[#1a73e8]'
                  : 'text-[#5f6368] hover:text-[#1f1f1f]'
              }`}
            >
              Question
            </button>
            <button
              onClick={() => setViewSubTab('individual')}
              className={`pb-1 cursor-pointer transition-colors ${
                viewSubTab === 'individual'
                  ? 'text-[#1a73e8] border-b-2 border-[#1a73e8]'
                  : 'text-[#5f6368] hover:text-[#1f1f1f]'
              }`}
            >
              Individual
            </button>
          </div>
        )}
      </div>

      {/* When 0 responses: Authentic Google Forms Empty State */}
      {responseCount === 0 ? (
        <div className="bg-white rounded-xl border border-[#dadce0] p-12 shadow-2xs text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#f0f4f9] text-[#5f6368] mx-auto flex items-center justify-center">
            <Inbox className="w-8 h-8 text-[#5f6368]" />
          </div>
          <h3 className="text-base font-medium text-[#1f1f1f] font-['Google_Sans',Roboto,sans-serif]">
            Waiting for responses
          </h3>
          <p className="text-xs text-[#5f6368] max-w-sm mx-auto">
            Share this form using the Send button above or preview it to submit responses.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Charts breakdown */}
          {viewSubTab === 'summary' && (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="bg-white rounded-xl border border-[#dadce0] p-6 shadow-2xs space-y-4">
                  <div className="border-b border-[#f1f3f4] pb-2">
                    <p className="text-sm font-semibold text-[#1f1f1f]">{q.title}</p>
                    <p className="text-[11px] text-[#5f6368]">{responseCount} responses</p>
                  </div>

                  {/* Multiple Choice / Checkbox Percentage Bars */}
                  {q.options && q.options.length > 0 ? (
                    <div className="space-y-3 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const matchCount = responses.filter((r) => {
                          const ans = r.answers?.[q.id];
                          if (Array.isArray(ans)) return ans.includes(opt.text);
                          return ans === opt.text;
                        }).length;
                        const pct = responseCount > 0 ? Math.round((matchCount / responseCount) * 100) : 0;
                        const colors = ['#4285f4', '#34a853', '#fbbc05', '#ea4335', '#a142f4', '#24c1e0'];
                        const barColor = colors[oIdx % colors.length];

                        return (
                          <div key={opt.id} className="space-y-1">
                            <div className="flex justify-between text-xs text-[#1f1f1f]">
                              <span className="font-medium">{opt.text}</span>
                              <span className="text-[#5f6368] font-mono">
                                {matchCount} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-3 bg-[#f1f3f4] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: barColor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Text / Paragraph Responses list */
                    <div className="space-y-2 pt-1">
                      {responses.map((r) => (
                        <div key={r.id} className="p-3 bg-[#f8fafd] rounded-lg border border-[#dadce0] text-xs text-[#1f1f1f]">
                          <p className="leading-relaxed">{(r.answers as any)[q.id] || 'No response recorded'}</p>
                          <span className="text-[10px] text-[#80868b] mt-1 block">&bull; {r.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Individual Responses View */}
          {viewSubTab === 'individual' && responses[currentIndividualIndex] && (
            <div className="bg-white rounded-xl border border-[#dadce0] p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1f3f4]">
                <span className="text-xs font-semibold text-[#1f1f1f]">
                  Respondent {currentIndividualIndex + 1} of {responseCount}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentIndividualIndex === 0}
                    onClick={() => setCurrentIndividualIndex(currentIndividualIndex - 1)}
                    className="px-2.5 py-1 text-xs border border-[#dadce0] rounded-lg disabled:opacity-30 cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    disabled={currentIndividualIndex === responseCount - 1}
                    onClick={() => setCurrentIndividualIndex(currentIndividualIndex + 1)}
                    className="px-2.5 py-1 text-xs border border-[#dadce0] rounded-lg disabled:opacity-30 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-[#5f6368]">
                  Submitted: {responses[currentIndividualIndex].timestamp} ({responses[currentIndividualIndex].email || 'Anonymous'})
                </p>

                {questions.map((q) => (
                  <div key={q.id} className="p-3.5 bg-[#f8fafd] rounded-xl border border-[#dadce0] space-y-1">
                    <p className="text-xs font-semibold text-[#1f1f1f]">{q.title}</p>
                    <p className="text-xs text-[#1a73e8] font-medium">
                      {Array.isArray((responses[currentIndividualIndex].answers as any)[q.id])
                        ? ((responses[currentIndividualIndex].answers as any)[q.id] as string[]).join(', ')
                        : (responses[currentIndividualIndex].answers as any)[q.id] || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
