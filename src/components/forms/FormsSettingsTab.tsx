import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FormsSettingsTabProps {
  confirmationMessage: string;
  onConfirmationMessageChange: (msg: string) => void;
  primaryColor: string;
}

export const FormsSettingsTab: React.FC<FormsSettingsTabProps> = ({
  confirmationMessage,
  onConfirmationMessageChange,
  primaryColor,
}) => {
  const [isQuiz, setIsQuiz] = useState(false);
  const [collectEmails, setCollectEmails] = useState('responder');
  const [allowEdit, setAllowEdit] = useState(false);
  const [limitOneResponse, setLimitOneResponse] = useState(true);
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [isEditingConfirm, setIsEditingConfirm] = useState(false);

  return (
    <div className="w-full max-w-[770px] mx-auto space-y-4 select-none text-[#1f1f1f]">
      {/* 1. Make this a quiz card */}
      <div className="bg-white rounded-xl border border-[#dadce0] p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1f1f1f]">Make this a quiz</h3>
            <p className="text-xs text-[#5f6368] mt-0.5">
              Assign point values, set answers, and automatically provide feedback
            </p>
          </div>
          <button
            onClick={() => setIsQuiz(!isQuiz)}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              isQuiz ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                isQuiz ? 'left-4.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Responses settings */}
      <div className="bg-white rounded-xl border border-[#dadce0] p-6 shadow-2xs space-y-5">
        <h3 className="text-sm font-bold text-[#1f1f1f]">Responses</h3>
        <p className="text-xs text-[#5f6368] -mt-3">Manage how responses are collected and protected</p>

        <div className="space-y-4 pt-2 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#1f1f1f]">Collect email addresses</p>
              <p className="text-[#5f6368]">Senders are required to provide their email</p>
            </div>
            <select
              value={collectEmails}
              onChange={(e) => setCollectEmails(e.target.value)}
              className="px-3 py-1.5 bg-[#f8fafd] border border-[#dadce0] rounded-lg text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="none">Do not collect</option>
              <option value="verified">Verified (Google SSO)</option>
              <option value="responder">Responder input</option>
            </select>
          </div>

          <div className="h-px bg-[#f1f3f4]" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#1f1f1f]">Allow response editing</p>
              <p className="text-[#5f6368]">Responses can be changed after being submitted</p>
            </div>
            <button
              onClick={() => setAllowEdit(!allowEdit)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                allowEdit ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  allowEdit ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-[#f1f3f4]" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#1f1f1f]">Limit to 1 response</p>
              <p className="text-[#5f6368]">Requires respondents to sign in to Google</p>
            </div>
            <button
              onClick={() => setLimitOneResponse(!limitOneResponse)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                limitOneResponse ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  limitOneResponse ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Presentation settings */}
      <div className="bg-white rounded-xl border border-[#dadce0] p-6 shadow-2xs space-y-5">
        <h3 className="text-sm font-bold text-[#1f1f1f]">Presentation</h3>
        <p className="text-xs text-[#5f6368] -mt-3">Manage how the form and responses are presented</p>

        <div className="space-y-4 pt-2 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#1f1f1f]">Show progress bar</p>
              <p className="text-[#5f6368]">Displays respondent progress across multi-page forms</p>
            </div>
            <button
              onClick={() => setShowProgressBar(!showProgressBar)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                showProgressBar ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  showProgressBar ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-[#f1f3f4]" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#1f1f1f]">Shuffle question order</p>
              <p className="text-[#5f6368]">Randomize question order for each respondent</p>
            </div>
            <button
              onClick={() => setShuffleQuestions(!shuffleQuestions)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                shuffleQuestions ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  shuffleQuestions ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-[#f1f3f4]" />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#1f1f1f]">Confirmation message</p>
              {!isEditingConfirm && (
                <button
                  onClick={() => setIsEditingConfirm(true)}
                  className="text-xs font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingConfirm ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={confirmationMessage}
                  onChange={(e) => onConfirmationMessageChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#dadce0] rounded-xl outline-none focus:border-[#1a73e8]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingConfirm(false)}
                    className="px-4 py-1.5 bg-[#1a73e8] text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#5f6368] italic">{confirmationMessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
