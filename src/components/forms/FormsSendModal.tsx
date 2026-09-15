import React, { useState } from 'react';
import { X, Mail, Link as LinkIcon, Code, Copy, Check, Lock, Globe, Unlock } from 'lucide-react';

interface FormsSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  primaryColor: string;
  accessLevel?: 'restricted' | 'anyone';
  onAccessLevelChange?: (level: 'restricted' | 'anyone') => void;
}

export const FormsSendModal: React.FC<FormsSendModalProps> = ({
  isOpen,
  onClose,
  formTitle,
  primaryColor,
  accessLevel = 'restricted',
  onAccessLevelChange,
}) => {
  const [sendTab, setSendTab] = useState<'email' | 'link' | 'embed'>('link');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState(formTitle);
  const [emailMessage, setEmailMessage] = useState("I've invited you to fill out a form:");
  const [shortenUrl, setShortenUrl] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formUrl = shortenUrl
    ? 'https://forms.gle/xK7mP9qZ'
    : `https://docs.google.com/forms/d/e/1FAIpQLSe-workspace-hub/viewform`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAccessLevel = () => {
    if (onAccessLevelChange) {
      onAccessLevelChange(accessLevel === 'anyone' ? 'restricted' : 'anyone');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-3 sm:p-4 animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#dadce0] space-y-4 sm:space-y-5 text-[#1f1f1f]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-medium text-[#1f1f1f]">Send & Share form</h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                accessLevel === 'anyone'
                  ? 'bg-[#e6f4ea] text-[#137333] border border-[#34a853]'
                  : 'bg-[#f1f3f4] text-[#5f6368]'
              }`}
            >
              {accessLevel === 'anyone' ? (
                <>
                  <Unlock className="w-3 h-3 text-[#137333]" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-[#5f6368]" />
                  <span>Restricted</span>
                </>
              )}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#f0f4f9] text-[#5f6368] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* General Access / Link Privacy Indicator Box */}
        <div
          onClick={toggleAccessLevel}
          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            accessLevel === 'anyone'
              ? 'bg-[#e6f4ea]/40 border-[#34a853]/40 hover:bg-[#e6f4ea]/70'
              : 'bg-[#f8fafd] border-[#dadce0] hover:bg-[#f1f3f4]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                accessLevel === 'anyone' ? 'bg-[#ceead6] text-[#137333]' : 'bg-[#e8eaed] text-[#5f6368]'
              }`}
            >
              {accessLevel === 'anyone' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1f1f1f]">
                {accessLevel === 'anyone'
                  ? 'Anyone with the link (Public)'
                  : 'Restricted (Collaborators only)'}
              </p>
              <p className="text-[11px] text-[#5f6368]">
                {accessLevel === 'anyone'
                  ? 'Anyone on the internet with this link can view and respond'
                  : 'Only designated collaborators can open this form'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
              accessLevel === 'anyone'
                ? 'bg-[#188038] text-white hover:bg-[#137333]'
                : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
            }`}
          >
            {accessLevel === 'anyone' ? 'Make Restricted' : 'Make Public'}
          </button>
        </div>

        {/* Send Via Tabs */}
        <div className="flex items-center gap-3 sm:gap-6 border-b border-[#dadce0] pb-2 text-xs font-semibold">
          <span className="text-[#5f6368] hidden xs:inline">Send via</span>
          <button
            onClick={() => setSendTab('link')}
            className={`p-2 rounded-lg flex items-center gap-1.5 cursor-pointer ${
              sendTab === 'link' ? 'bg-[#f0f4f9] text-[#1a73e8]' : 'text-[#5f6368]'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Link</span>
          </button>
          <button
            onClick={() => setSendTab('email')}
            className={`p-2 rounded-lg flex items-center gap-1.5 cursor-pointer ${
              sendTab === 'email' ? 'bg-[#f0f4f9] text-[#1a73e8]' : 'text-[#5f6368]'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>
          <button
            onClick={() => setSendTab('embed')}
            className={`p-2 rounded-lg flex items-center gap-1.5 cursor-pointer ${
              sendTab === 'embed' ? 'bg-[#f0f4f9] text-[#1a73e8]' : 'text-[#5f6368]'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Embed HTML</span>
          </button>
        </div>

        {/* Tab Content */}
        {sendTab === 'link' && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[#5f6368] font-semibold block mb-1">Form Link</label>
              <input
                type="text"
                readOnly
                value={formUrl}
                className="w-full px-3 py-2 bg-[#f8fafd] border border-[#dadce0] rounded-xl text-xs font-mono select-all outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-[#444746]">
              <input
                type="checkbox"
                checked={shortenUrl}
                onChange={(e) => setShortenUrl(e.target.checked)}
                className="rounded text-[#673ab7]"
              />
              <span>Shorten URL</span>
            </label>
          </div>
        )}

        {sendTab === 'email' && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#5f6368] font-semibold block mb-1">To</label>
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="Email addresses"
                className="w-full px-3 py-2 border border-[#dadce0] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="text-[#5f6368] font-semibold block mb-1">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 border border-[#dadce0] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="text-[#5f6368] font-semibold block mb-1">Message</label>
              <textarea
                rows={2}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="w-full px-3 py-2 border border-[#dadce0] rounded-xl outline-none resize-none"
              />
            </div>
          </div>
        )}

        {sendTab === 'embed' && (
          <div className="space-y-3 text-xs">
            <label className="text-[#5f6368] font-semibold block">Embed HTML</label>
            <textarea
              readOnly
              rows={3}
              value={`<iframe src="${formUrl}" width="640" height="800" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`}
              className="w-full px-3 py-2 bg-[#f8fafd] border border-[#dadce0] rounded-xl font-mono text-[11px] outline-none"
            />
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f1f3f4]">
          {sendTab === 'link' ? (
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-[#f0f4f9] hover:bg-[#e8eaed] text-[#1a73e8] rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#188038]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to clipboard' : 'Copy'}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#5f6368] hover:bg-[#f0f4f9] cursor-pointer"
            >
              Done
            </button>
            <button
              onClick={() => {
                alert('Form link copied and shared!');
                onClose();
              }}
              className="px-6 py-2 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer hover:shadow-md transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              Share Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
