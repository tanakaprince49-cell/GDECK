import React, { useState } from 'react';
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  Layout,
  Eye,
  FileCode,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { GoogleSitesIcon } from './GoogleIcons';

interface SitesViewProps {
  onBackToOverview?: () => void;
}

interface SiteProject {
  id: string;
  title: string;
  url: string;
  lastEdited: string;
  pagesCount: number;
  published: boolean;
  theme: string;
}

const DEFAULT_SITES: SiteProject[] = [
  {
    id: 'site-1',
    title: 'Acme Corp Team Portal',
    url: 'https://sites.google.com/view/acme-hub',
    lastEdited: '2 hours ago',
    pagesCount: 6,
    published: true,
    theme: 'Modern Glass',
  },
  {
    id: 'site-2',
    title: 'Product Engineering Wiki',
    url: 'https://sites.google.com/view/eng-docs-q4',
    lastEdited: 'Yesterday',
    pagesCount: 14,
    published: true,
    theme: 'Developer Clean',
  },
  {
    id: 'site-3',
    title: 'Employee Onboarding Guide',
    url: 'https://sites.google.com/view/new-hire-hq',
    lastEdited: '3 days ago',
    pagesCount: 4,
    published: false,
    theme: 'Vibrant Corporate',
  },
];

export const SitesView: React.FC<SitesViewProps> = ({ onBackToOverview }) => {
  const [sites, setSites] = useState<SiteProject[]>(DEFAULT_SITES);
  const [selectedSite, setSelectedSite] = useState<SiteProject>(DEFAULT_SITES[0]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newSite: SiteProject = {
      id: `site-${Date.now()}`,
      title: newTitle.trim(),
      url: `https://sites.google.com/view/${newTitle.toLowerCase().replace(/\s+/g, '-')}`,
      lastEdited: 'Just now',
      pagesCount: 1,
      published: false,
      theme: 'Modern Glass',
    };
    setSites([newSite, ...sites]);
    setSelectedSite(newSite);
    setShowCreateModal(false);
    setNewTitle('');
  };

  return (
    <div id="sites-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-indigo-500/10 border border-indigo-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleSitesIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Sites</h2>
            <p className="text-sm text-slate-500">Internal wikis, project portals & responsive team intranet</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs border border-indigo-400/40 flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create Site
          </button>
          <a
            href="https://sites.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-slate-600 hover:text-indigo-600 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Open Google Sites Web"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[520px]">
        {/* Left: Sites Directory */}
        <div className="lg:col-span-4 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-4 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>My Google Sites ({sites.length})</span>
          </div>

          <div className="space-y-2">
            {sites.map((site) => {
              const isSelected = site.id === selectedSite.id;
              return (
                <div
                  key={site.id}
                  onClick={() => setSelectedSite(site)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 shadow-xs'
                      : 'border-slate-200/80 bg-white/70 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold truncate">{site.title}</h4>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        site.published
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {site.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-1">{site.url}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                    <span>{site.pagesCount} pages</span>
                    <span>Edited {site.lastEdited}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Site Details & Page Builder Preview */}
        <div className="lg:col-span-8 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedSite.title}</h3>
              <a
                href={selectedSite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-0.5"
              >
                {selectedSite.url} <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  previewMode
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                {previewMode ? 'Edit Mode' : 'Live Preview'}
              </button>
            </div>
          </div>

          {/* Interactive Portal Preview Container */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-slate-50 shadow-inner">
            {/* Mock Site Nav */}
            <div className="bg-indigo-900 text-white px-6 py-3 flex items-center justify-between">
              <span className="font-bold text-sm tracking-wide">{selectedSite.title}</span>
              <div className="flex gap-4 text-xs opacity-90">
                <span className="cursor-pointer hover:underline">Home</span>
                <span className="cursor-pointer hover:underline">Team Directory</span>
                <span className="cursor-pointer hover:underline">Resources</span>
                <span className="cursor-pointer hover:underline">FAQ</span>
              </div>
            </div>

            {/* Mock Banner */}
            <div className="p-8 bg-gradient-to-r from-indigo-800 to-purple-800 text-white text-center space-y-2">
              <h2 className="text-2xl font-black">Welcome to our Workspace Portal</h2>
              <p className="text-xs text-indigo-200 max-w-md mx-auto">
                Access company policies, sprint documentation, and internal assets in one unified location.
              </p>
            </div>

            {/* Mock Content Blocks */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-xl shadow-2xs border border-slate-100">
                <h5 className="font-bold text-xs text-slate-800">📁 Shared Drive Assets</h5>
                <p className="text-[11px] text-slate-500 mt-1">Direct links to active Q4 pitch folders and templates.</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-2xs border border-slate-100">
                <h5 className="font-bold text-xs text-slate-800">🗓️ Company Calendar</h5>
                <p className="text-[11px] text-slate-500 mt-1">Upcoming all-hands meetings, holidays and milestones.</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-2xs border border-slate-100">
                <h5 className="font-bold text-xs text-slate-800">💬 Communication Guidelines</h5>
                <p className="text-[11px] text-slate-500 mt-1">Chat etiquette and asynchronous update workflows.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Site Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GoogleSitesIcon className="w-6 h-6" />
                <h3 className="text-base font-bold text-slate-900">Create New Google Site</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Site Name / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Engineering Portal"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Site</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
