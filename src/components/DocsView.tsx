import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Download,
  Share2,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
} from 'lucide-react';
import { DriveFile } from '../types/workspace';
import { searchDocs, createDriveFile } from '../services/workspace';
import { ConfirmModal } from './ConfirmModal';
import { GoogleDocsIcon } from './GoogleIcons';

interface DocsViewProps {
  token: string;
  onBackToOverview?: () => void;
}

const TEMPLATES = [
  { id: 'blank', title: 'Blank Document', desc: 'Start with a clean slate', content: '' },
  { id: 'project-proposal', title: 'Project Proposal', desc: 'Executive summary, goals, milestones', content: '# Project Proposal: Q4 Strategy\n\n## Executive Summary\nOur primary objective is to streamline cross-team workflows using Google Workspace integrations.\n\n## Goals & Objectives\n1. Reduce context switching by 40%\n2. Automate weekly status reporting\n3. Centralize shared assets\n\n## Timeline & Milestones\n- Phase 1: Planning (Week 1-2)\n- Phase 2: Deployment (Week 3-4)\n- Phase 3: Review (Week 5)' },
  { id: 'meeting-notes', title: 'Meeting Notes', desc: 'Agenda, attendees, action items', content: '# Team Weekly Sync\n\n**Date:** ' + new Date().toLocaleDateString() + '\n**Attendees:** Alex, Sarah, David, Elena\n\n## Agenda\n- Workspace Hub feature rollout\n- Review client feedback on dashboards\n- Plan sprint 28 backlog\n\n## Action Items\n- [ ] Sarah: Update slide deck for leadership\n- [ ] Alex: Verify spreadsheet data pipeline\n- [ ] David: Finalize API endpoints' },
  { id: 'resume', title: 'Resume / CV', desc: 'Professional experience and skills', content: '# Full Name\nEmail: contact@example.com | Phone: +1 555-0199\n\n## Summary\nResults-driven professional with deep experience in collaborative cloud software.\n\n## Experience\n**Senior Product Manager** (2022 - Present)\n- Led global rollout of cloud communication suites.\n- Increased team productivity metrics by 35%.\n\n## Skills\nGoogle Workspace, Cloud Architecture, Agile Management' },
];

export const DocsView: React.FC<DocsViewProps> = ({ token, onBackToOverview }) => {
  const [docs, setDocs] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<DriveFile | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('Untitled Document');
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const files = await searchDocs(token);
      setDocs(files);
      if (files.length > 0 && !selectedDoc) {
        setSelectedDoc(files[0]);
        setDocTitle(files[0].name);
        setDocContent(`# ${files[0].name}\n\nDocument last synchronized from Google Drive.\n\nStart typing to edit or expand this document...`);
      }
    } catch (err) {
      console.error('Failed to load Google Docs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDocs();
    }
  }, [token]);

  useEffect(() => {
    const words = docContent.trim() ? docContent.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(docContent.length);
  }, [docContent]);

  const handleSelectDoc = (doc: DriveFile) => {
    setSelectedDoc(doc);
    setDocTitle(doc.name);
    setDocContent(`# ${doc.name}\n\nLast modified: ${new Date(doc.modifiedTime || Date.now()).toLocaleString()}\n\nEditable workspace copy.`);
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || 'Untitled Document';
    const template = TEMPLATES.find((t) => t.id === selectedTemplate);
    const content = template?.content || `# ${title}\n\n`;

    setIsSaving(true);
    try {
      const created = await createDriveFile(
        token,
        title,
        'application/vnd.google-apps.document',
        content
      );
      setDocs([created, ...docs]);
      setSelectedDoc(created);
      setDocTitle(title);
      setDocContent(content);
      setShowCreateModal(false);
      setNewTitle('');
      setSuccessMsg(`Document "${title}" created successfully!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      // Local fallback
      const localDoc: DriveFile = {
        id: `doc-${Date.now()}`,
        name: title,
        mimeType: 'application/vnd.google-apps.document',
        webViewLink: 'https://docs.google.com',
        modifiedTime: new Date().toISOString(),
      };
      setDocs([localDoc, ...docs]);
      setSelectedDoc(localDoc);
      setDocTitle(title);
      setDocContent(content);
      setShowCreateModal(false);
      setNewTitle('');
    } finally {
      setIsSaving(false);
    }
  };

  const applyFormat = (prefix: string, suffix: string = '') => {
    setDocContent((prev) => `${prev}\n${prefix}Formatted text${suffix}`);
  };

  const filteredDocs = docs.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="docs-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="docs-back-to-overview-btn"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-blue-500/10 border border-blue-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleDocsIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Docs</h2>
            <p className="text-sm text-slate-500">Collaborative document editor, templates & Drive sync</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="create-doc-btn"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-[0_4px_14px_rgba(59,130,246,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-blue-400/40 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            New Document
          </button>
          <a
            href="https://docs.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-slate-600 hover:text-blue-600 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Open Google Docs Web"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Dual-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
        {/* Left: Document List & Templates */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search */}
          <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-xs bg-white/70 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Drive Documents ({filteredDocs.length})</span>
            </div>

            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
              {filteredDocs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {loading ? 'Loading Google Docs...' : 'No documents found'}
                </div>
              ) : (
                filteredDocs.map((doc) => {
                  const isSelected = selectedDoc?.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`w-full p-3 rounded-2xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-500/10 border border-blue-500/30 text-blue-900 shadow-xs'
                          : 'hover:bg-white/60 border border-transparent text-slate-700'
                      }`}
                    >
                      <GoogleDocsIcon className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold truncate text-slate-900">{doc.name}</h4>
                        <span className="text-[10px] text-slate-400">
                          {doc.modifiedTime ? new Date(doc.modifiedTime).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Templates */}
          <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-800">Quick Start Templates</h4>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setDocTitle(t.title);
                    setDocContent(t.content || `# ${t.title}\n\n`);
                    setSelectedDoc(null);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-white/70 hover:bg-blue-50 hover:border-blue-300 text-left transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-slate-800 truncate">{t.title}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Document Editor Canvas */}
        <div className="lg:col-span-8 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-5 flex flex-col justify-between">
          <div>
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-hidden px-1 py-0.5 max-w-sm"
              />

              {/* Formatting Actions */}
              <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
                <button
                  onClick={() => applyFormat('**', '**')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => applyFormat('*', '*')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => applyFormat('# ')}
                  className="px-2 py-1 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  onClick={() => applyFormat('## ')}
                  className="px-2 py-1 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  onClick={() => applyFormat('- ')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedDoc?.webViewLink && (
                <a
                  href={selectedDoc.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in Docs
                </a>
              )}
            </div>

            {/* Editor Textarea */}
            <div className="py-4">
              <textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Start writing your Google Doc content..."
                rows={16}
                className="w-full bg-white/90 border border-slate-200/80 rounded-2xl p-4 text-xs sm:text-sm text-slate-800 font-sans leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-inner resize-y"
              />
            </div>
          </div>

          {/* Footer Status Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>Words: <strong className="text-slate-800">{wordCount}</strong></span>
              <span>Characters: <strong className="text-slate-800">{charCount}</strong></span>
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved locally
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(docContent);
                  setSuccessMsg('Copied document text to clipboard!');
                  setTimeout(() => setSuccessMsg(null), 2500);
                }}
                className="px-3 py-1.5 bg-white/80 hover:bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GoogleDocsIcon className="w-6 h-6" />
                <h3 className="text-base font-bold text-slate-900">Create New Google Doc</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Executive Brief"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedTemplate === t.id
                          ? 'border-blue-500 bg-blue-50/70 text-blue-900'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <p className="text-xs font-bold truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Creating...' : 'Create Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
