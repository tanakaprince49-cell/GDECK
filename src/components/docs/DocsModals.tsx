import React, { useState } from 'react';
import { Plus, Lock, Unlock, Globe, Copy, Check, Search, FileText, Settings, X, ArrowRight } from 'lucide-react';
import { DriveFile } from '../../types/workspace';
import { DOC_TEMPLATES, DocTemplate } from './docsData';
import { GoogleDocsIcon, GoogleSlidesIcon, GoogleFormsIcon, GoogleSheetsIcon } from '../GoogleIcons';

// --- 1. Authentic Google Workspace Share Dialog ---
export const DocsShareModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  docTitle: string;
  webViewLink?: string;
  accessLevel?: 'restricted' | 'anyone';
  onAccessLevelChange?: (level: 'restricted' | 'anyone') => void;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}> = ({
  isOpen,
  onClose,
  docTitle,
  webViewLink,
  accessLevel = 'restricted',
  onAccessLevelChange,
  userName,
  userEmail,
  userPhoto,
}) => {
  const [currentLevel, setCurrentLevel] = useState<'restricted' | 'anyone'>(accessLevel);
  const [generalRole, setGeneralRole] = useState<'viewer' | 'commenter' | 'editor'>('viewer');
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer' | 'commenter'>('editor');
  const [collaborators, setCollaborators] = useState<Array<{ email: string; role: 'editor' | 'viewer' | 'commenter' }>>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [editorsCanShare, setEditorsCanShare] = useState(true);
  const [viewersCanCopy, setViewersCanCopy] = useState(true);

  // Sync state if accessLevel changes externally
  React.useEffect(() => {
    setCurrentLevel(accessLevel);
  }, [accessLevel]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(webViewLink || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAccessChange = (newLevel: 'restricted' | 'anyone') => {
    setCurrentLevel(newLevel);
    onAccessLevelChange?.(newLevel);
  };

  const handleAddCollaborator = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return;
    if (!collaborators.some((c) => c.email.toLowerCase() === inviteEmail.trim().toLowerCase())) {
      setCollaborators((prev) => [...prev, { email: inviteEmail.trim(), role: inviteRole }]);
    }
    setInviteEmail('');
  };

  const handleRemoveCollaborator = (email: string) => {
    setCollaborators((prev) => prev.filter((c) => c.email !== email));
  };

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'You');
  const displayEmail = userEmail || 'Account owner';
  const initialLetter = (displayName || 'U').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in">
      <div className="w-full max-w-[540px] bg-white rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.18)] border border-[#dadce0] overflow-hidden flex flex-col text-[#1f1f1f]">
        
        {/* Settings Sub-Panel View */}
        {showSettings ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f3f4]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 -ml-2 rounded-full hover:bg-[#f0f4f9] text-[#444746] transition-colors cursor-pointer"
                  title="Back"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <h3 className="text-lg font-medium text-[#1f1f1f] font-['Google_Sans',Roboto,sans-serif]">
                  Share with people settings
                </h3>
              </div>
            </div>

            <div className="space-y-4 text-sm text-[#1f1f1f]">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editorsCanShare}
                  onChange={(e) => setEditorsCanShare(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#0b57d0] rounded border-gray-300 focus:ring-[#0b57d0]"
                />
                <div>
                  <p className="font-medium text-[#1f1f1f]">Editors can change permissions and share</p>
                  <p className="text-xs text-[#5f6368] mt-0.5">Allow anyone with edit access to invite new people or change access settings.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={viewersCanCopy}
                  onChange={(e) => setViewersCanCopy(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#0b57d0] rounded border-gray-300 focus:ring-[#0b57d0]"
                />
                <div>
                  <p className="font-medium text-[#1f1f1f]">Viewers and commenters can see the option to download, print, and copy</p>
                  <p className="text-xs text-[#5f6368] mt-0.5">Control whether viewers can export or save local copies.</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#f1f3f4]">
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white rounded-full text-sm font-medium transition-colors cursor-pointer shadow-xs"
              >
                Back to Share
              </button>
            </div>
          </div>
        ) : (
          /* Main Share Dialog View */
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-normal text-[#1f1f1f] font-['Google_Sans',Roboto,sans-serif] truncate max-w-[380px]" title={docTitle}>
                Share &ldquo;{docTitle}&rdquo;
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 rounded-full hover:bg-[#f0f4f9] text-[#444746] transition-colors cursor-pointer"
                  title="Share with people settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-[#f0f4f9] text-[#444746] transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Add People Input Form */}
            <form onSubmit={handleAddCollaborator} className="relative">
              <div className="flex items-center gap-2 border border-[#747775] focus-within:border-[#0b57d0] focus-within:ring-2 focus-within:ring-[#0b57d0]/20 rounded-xl px-3.5 py-2 bg-white transition-all">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Add people, groups, and calendar events"
                  className="flex-1 text-sm bg-transparent outline-none text-[#1f1f1f] placeholder:text-[#5f6368]"
                />
                {inviteEmail.trim() && (
                  <div className="flex items-center gap-2">
                    <select
                      value={inviteRole}
                      onChange={(e: any) => setInviteRole(e.target.value)}
                      className="text-xs font-medium text-[#444746] bg-[#f0f4f9] px-2 py-1 rounded-md border border-[#dadce0] outline-none cursor-pointer"
                    >
                      <option value="editor">Editor</option>
                      <option value="commenter">Commenter</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium rounded-full cursor-pointer transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </form>

            {/* People with Access */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-semibold text-[#444746] uppercase tracking-wider">People with access</p>
              
              <div className="max-h-40 overflow-y-auto space-y-3 pr-1">
                {/* Real User (Owner) */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {userPhoto ? (
                      <img src={userPhoto} alt={displayName} className="w-9 h-9 rounded-full object-cover border border-[#dadce0]" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#0b57d0] text-white flex items-center justify-center font-medium text-sm shrink-0">
                        {initialLetter}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1f1f1f] truncate">
                        {displayName} <span className="text-xs text-[#5f6368] font-normal">(you)</span>
                      </p>
                      <p className="text-xs text-[#5f6368] truncate">{displayEmail}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#5f6368] bg-[#f0f4f9] px-2.5 py-1 rounded-full shrink-0">
                    Owner
                  </span>
                </div>

                {/* Added Collaborators */}
                {collaborators.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#1e8e3e] text-white flex items-center justify-center font-medium text-sm shrink-0">
                        {c.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1f1f1f] truncate">{c.email}</p>
                        <p className="text-xs text-[#5f6368] capitalize">{c.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={c.role}
                        onChange={(e: any) => {
                          const newRole = e.target.value;
                          setCollaborators((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, role: newRole } : item))
                          );
                        }}
                        className="text-xs font-medium text-[#444746] bg-[#f0f4f9] px-2 py-1 rounded-md border border-[#dadce0] outline-none cursor-pointer"
                      >
                        <option value="editor">Editor</option>
                        <option value="commenter">Commenter</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemoveCollaborator(c.email)}
                        className="p-1 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors cursor-pointer"
                        title="Remove access"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Access Box */}
            <div className="space-y-2 pt-3 border-t border-[#f1f3f4]">
              <p className="text-xs font-semibold text-[#444746] uppercase tracking-wider">General access</p>
              
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#f8fafd] border border-[#dadce0] hover:border-[#b4b7b9] transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      currentLevel === 'anyone'
                        ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
                        : 'bg-[#e8eaed] text-[#444746]'
                    }`}
                  >
                    {currentLevel === 'anyone' ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <select
                      value={currentLevel}
                      onChange={(e: any) => handleAccessChange(e.target.value)}
                      className="text-sm font-semibold text-[#1f1f1f] bg-transparent outline-none cursor-pointer py-0.5 border-b border-dashed border-[#5f6368]/50 hover:border-[#0b57d0]"
                    >
                      <option value="restricted">Restricted</option>
                      <option value="anyone">Anyone with the link</option>
                    </select>
                    <p className="text-xs text-[#5f6368] mt-0.5 line-clamp-1">
                      {currentLevel === 'restricted'
                        ? 'Only people with access can open with the link'
                        : 'Anyone on the Internet with the link can view'}
                    </p>
                  </div>
                </div>

                {currentLevel === 'anyone' && (
                  <select
                    value={generalRole}
                    onChange={(e: any) => setGeneralRole(e.target.value)}
                    className="text-xs font-semibold text-[#137333] bg-[#e6f4ea] px-3 py-1.5 rounded-lg border border-[#ceead6] outline-none cursor-pointer shrink-0"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="commenter">Commenter</option>
                    <option value="editor">Editor</option>
                  </select>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#f1f3f4]">
              <button
                onClick={handleCopyLink}
                className={`px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 cursor-pointer transition-all border ${
                  copied
                    ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
                    : 'bg-white hover:bg-[#f0f4f9] text-[#0b57d0] border-[#747775]'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-[#137333]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link copied' : 'Copy link'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-7 py-2.5 bg-[#0b57d0] hover:bg-[#0842a0] active:bg-[#06327d] text-white rounded-full text-sm font-medium cursor-pointer transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 2. Google Drive Universal Workspace Picker / Open Modal ---
export const DocsPickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  docs: DriveFile[];
  onSelectDoc: (doc: DriveFile) => void;
  onNewDoc: () => void;
  title?: string;
  appType?: 'docs' | 'slides' | 'forms' | 'sheets';
  emptyText?: string;
}> = ({
  isOpen,
  onClose,
  docs,
  onSelectDoc,
  onNewDoc,
  title,
  appType = 'docs',
  emptyText,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredDocs = docs.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  const getAppConfig = () => {
    switch (appType) {
      case 'slides':
        return {
          title: title || 'Google Slides • Google Drive',
          icon: <GoogleSlidesIcon className="w-6 h-6" />,
          placeholder: 'Search presentations in Drive...',
          newButtonText: 'Blank presentation',
          buttonColor: 'bg-[#ea4335] hover:bg-[#d93025]',
          openColor: 'text-[#ea4335]',
          defaultEmpty: 'No presentations found in Drive. Create a new presentation to get started.',
        };
      case 'forms':
        return {
          title: title || 'Google Forms • Google Drive',
          icon: <GoogleFormsIcon className="w-6 h-6" />,
          placeholder: 'Search forms in Drive...',
          newButtonText: 'Blank form',
          buttonColor: 'bg-[#673ab7] hover:bg-[#5e35b1]',
          openColor: 'text-[#673ab7]',
          defaultEmpty: 'No forms found in Drive. Create a new form to get started.',
        };
      case 'sheets':
        return {
          title: title || 'Google Sheets • Google Drive',
          icon: <GoogleSheetsIcon className="w-6 h-6" />,
          placeholder: 'Search spreadsheets in Drive...',
          newButtonText: 'Blank spreadsheet',
          buttonColor: 'bg-[#188038] hover:bg-[#137333]',
          openColor: 'text-[#188038]',
          defaultEmpty: 'No spreadsheets found in Drive. Create a new spreadsheet to get started.',
        };
      case 'docs':
      default:
        return {
          title: title || 'Google Docs • Google Drive',
          icon: <GoogleDocsIcon className="w-6 h-6" />,
          placeholder: 'Search documents in Drive...',
          newButtonText: 'Blank doc',
          buttonColor: 'bg-[#1a73e8] hover:bg-[#1557b0]',
          openColor: 'text-[#1a73e8]',
          defaultEmpty: 'No documents found in Drive. Create a new document to get started.',
        };
    }
  };

  const config = getAppConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-[#dadce0] space-y-4 text-[#1f1f1f]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {config.icon}
            <h3 className="text-base font-bold text-[#1f1f1f]">{config.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f0f4f9] text-[#5f6368] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5f6368] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={config.placeholder}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-[#dadce0] outline-none focus:border-[#1a73e8] bg-[#f8fafd]"
            />
          </div>
          <button
            onClick={() => {
              onNewDoc();
              onClose();
            }}
            className={`px-4 py-2.5 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs transition-colors ${config.buttonColor}`}
          >
            <Plus className="w-4 h-4" />
            <span>{config.newButtonText}</span>
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-[#f1f3f4]">
          {filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#5f6368] flex flex-col items-center gap-2">
              <div className="p-3 bg-[#f8fafd] rounded-full">
                {config.icon}
              </div>
              <p>{emptyText || config.defaultEmpty}</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  onSelectDoc(doc);
                  onClose();
                }}
                className="p-3 hover:bg-[#f2f6fc] rounded-xl flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0">{config.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1f1f1f] truncate">{doc.name}</p>
                    <p className="text-[11px] text-[#5f6368]">
                      {doc.modifiedTime ? `Modified ${new Date(doc.modifiedTime).toLocaleDateString()}` : config.title}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-bold shrink-0 ml-2 ${config.openColor}`}>Open</span>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#f0f4f9] hover:bg-[#e8eaed] text-[#444746] rounded-full text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 3. Word Count Modal ---
export const DocsWordCountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  words: number;
  characters: number;
  charsNoSpaces: number;
  pages: number;
  showWordCountFloating: boolean;
  onToggleFloating: (v: boolean) => void;
}> = ({ isOpen, onClose, words, characters, charsNoSpaces, pages, showWordCountFloating, onToggleFloating }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in">
      <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-[#dadce0] space-y-4 text-[#1f1f1f]">
        <h3 className="text-base font-bold text-[#1f1f1f]">Word count</h3>
        <div className="space-y-2 text-xs text-[#444746]">
          <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
            <span>Pages</span>
            <span className="font-semibold text-[#1f1f1f]">{pages}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
            <span>Words</span>
            <span className="font-semibold text-[#1f1f1f]">{words}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
            <span>Characters</span>
            <span className="font-semibold text-[#1f1f1f]">{characters}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
            <span>Characters excluding spaces</span>
            <span className="font-semibold text-[#1f1f1f]">{charsNoSpaces}</span>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-[#444746] cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={showWordCountFloating}
            onChange={(e) => onToggleFloating(e.target.checked)}
            className="rounded text-[#1a73e8]"
          />
          <span>Display word count while typing</span>
        </label>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#1a73e8] text-white rounded-full text-xs font-bold cursor-pointer hover:bg-[#1557b0]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4. Template Gallery Modal ---
export const DocsTemplateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DocTemplate) => void;
}> = ({ isOpen, onClose, onSelectTemplate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl border border-[#dadce0] space-y-4 text-[#1f1f1f]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1f1f1f]">Template gallery</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#f0f4f9] text-[#5f6368]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {DOC_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate(tmpl);
                onClose();
              }}
              className="group border border-[#dadce0] hover:border-[#1a73e8] rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer bg-[#f8fafd] hover:bg-white"
            >
              <div className="space-y-2">
                <div className="h-28 bg-white border border-[#dadce0] rounded-lg p-2.5 shadow-2xs overflow-hidden text-[7px] text-[#5f6368] font-mono select-none">
                  <div className="font-bold text-[8px] text-[#1f1f1f] mb-1">{tmpl.title}</div>
                  <div className="w-3/4 h-1.5 bg-[#e8eaed] rounded-xs mb-1" />
                  <div className="w-full h-1 bg-[#f1f3f4] rounded-xs mb-0.5" />
                  <div className="w-5/6 h-1 bg-[#f1f3f4] rounded-xs mb-0.5" />
                  <div className="w-2/3 h-1 bg-[#f1f3f4] rounded-xs" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1f1f1f] group-hover:text-[#1a73e8] transition-colors">
                    {tmpl.title}
                  </h4>
                  <p className="text-[11px] text-[#5f6368] mt-0.5">{tmpl.desc}</p>
                </div>
              </div>
              <span className="text-[11px] text-[#1a73e8] font-semibold flex items-center gap-1 mt-3">
                Use template <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 5. Insert Link Modal ---
export const DocsLinkModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onApplyLink: (text: string, url: string) => void;
  initialText?: string;
}> = ({ isOpen, onClose, onApplyLink, initialText = '' }) => {
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onApplyLink(text.trim() || url.trim(), url.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#dadce0] space-y-4 text-[#1f1f1f]"
      >
        <h3 className="text-base font-bold text-[#1f1f1f]">Insert link</h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-[#5f6368]">Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Display text"
              className="w-full px-3 py-2 mt-1 rounded-xl border border-[#dadce0] outline-none focus:border-[#1a73e8]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#5f6368]">Link</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 mt-1 rounded-xl border border-[#dadce0] outline-none focus:border-[#1a73e8]"
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-[#5f6368] hover:bg-[#f0f4f9]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-[#1a73e8] text-white rounded-full text-xs font-bold hover:bg-[#1557b0] shadow-xs"
          >
            Apply
          </button>
        </div>
      </form>
    </div>
  );
};

// --- 6. Page Setup Modal ---
export const DocsPageSetupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  orientation: 'portrait' | 'landscape';
  onOrientationChange: (o: 'portrait' | 'landscape') => void;
  pageSize: string;
  onPageSizeChange: (s: string) => void;
}> = ({ isOpen, onClose, orientation, onOrientationChange, pageSize, onPageSizeChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#dadce0] space-y-4 text-[#1f1f1f]">
        <h3 className="text-base font-bold text-[#1f1f1f]">Page setup</h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-[#5f6368] uppercase">Orientation</label>
            <div className="flex gap-4 mt-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="orient"
                  checked={orientation === 'portrait'}
                  onChange={() => onOrientationChange('portrait')}
                />
                <span>Portrait</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="orient"
                  checked={orientation === 'landscape'}
                  onChange={() => onOrientationChange('landscape')}
                />
                <span>Landscape</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#5f6368] uppercase">Paper size</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(e.target.value)}
              className="w-full px-3 py-2 mt-1 rounded-xl border border-[#dadce0] outline-none"
            >
              <option value="letter">Letter (8.5" x 11")</option>
              <option value="a4">A4 (8.27" x 11.69")</option>
              <option value="legal">Legal (8.5" x 14")</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#5f6368] uppercase">Margins (inches)</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs text-[#5f6368]">
              <div>Top: 1"</div>
              <div>Bottom: 1"</div>
              <div>Left: 1"</div>
              <div>Right: 1"</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1a73e8] text-white rounded-full text-xs font-bold cursor-pointer hover:bg-[#1557b0]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
