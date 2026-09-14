import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  Layout,
  ArrowLeft,
  Loader2,
  Trash2,
  FolderPlus,
  RefreshCw,
} from 'lucide-react';
import { GoogleSitesIcon } from './GoogleIcons';
import { searchUserSites } from '../services/workspace';
import { DriveFile } from '../types/workspace';

interface SitesViewProps {
  token?: string | null;
  onBackToOverview?: () => void;
}

export interface SiteItem {
  id: string;
  title: string;
  url: string;
  lastEdited?: string;
  source: 'google' | 'custom';
}

export const SitesView: React.FC<SitesViewProps> = ({ token, onBackToOverview }) => {
  const [sites, setSites] = useState<SiteItem[]>(() => {
    try {
      const saved = localStorage.getItem('gdeck_custom_sites');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');

  // Fetch real user Google Sites via Google Drive API
  const fetchSites = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const driveSites: DriveFile[] = await searchUserSites(token);
      if (Array.isArray(driveSites)) {
        const mappedSites: SiteItem[] = driveSites.map((item) => ({
          id: item.id,
          title: item.name,
          url: item.webViewLink || `https://sites.google.com/view/${item.id}`,
          lastEdited: item.modifiedTime
            ? new Date(item.modifiedTime).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : undefined,
          source: 'google',
        }));

        setSites((prev) => {
          const customOnly = prev.filter((s) => s.source === 'custom');
          return [...mappedSites, ...customOnly];
        });
      }
    } catch (err) {
      console.warn('Could not fetch Google Sites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [token]);

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formattedUrl =
      newUrl.trim() ||
      `https://sites.google.com/view/${encodeURIComponent(
        newTitle.trim().toLowerCase().replace(/\s+/g, '-')
      )}`;

    const newSite: SiteItem = {
      id: `custom-site-${Date.now()}`,
      title: newTitle.trim(),
      url: formattedUrl,
      lastEdited: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      source: 'custom',
    };

    const updated = [newSite, ...sites];
    setSites(updated);
    try {
      const customOnly = updated.filter((s) => s.source === 'custom');
      localStorage.setItem('gdeck_custom_sites', JSON.stringify(customOnly));
    } catch {}

    setShowCreateModal(false);
    setNewTitle('');
    setNewUrl('');
  };

  const handleDeleteSite = (id: string) => {
    const updated = sites.filter((s) => s.id !== id);
    setSites(updated);
    try {
      const customOnly = updated.filter((s) => s.source === 'custom');
      localStorage.setItem('gdeck_custom_sites', JSON.stringify(customOnly));
    } catch {}
  };

  const filteredSites = sites.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="sites-view" className="space-y-6 font-sans">
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
            <p className="text-sm text-slate-500">
              Manage and access your Google Sites web portals and published pages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Site</span>
          </button>
          <a
            href="https://sites.google.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Create on Google Sites</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search your sites by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 shadow-2xs text-slate-900 font-medium"
          />
        </div>

        <button
          onClick={fetchSites}
          disabled={isLoading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Sites</span>
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-sm flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-600 font-medium">
            Fetching your Google Sites from your account...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSites.length === 0 && (
        <div className="p-12 text-center bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <Globe className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Google Sites Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery
                ? `No sites matched "${searchQuery}".`
                : 'You have not created any Google Sites in this workspace yet. Start building a new site or add an existing URL.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <a
              href="https://sites.google.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Google Site</span>
            </a>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add Custom Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Real Sites Grid */}
      {!isLoading && filteredSites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="bg-white/80 hover:bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <Layout className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{site.title}</h4>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {site.source === 'google' ? 'Google Sites' : 'Custom Portal'}
                      </span>
                    </div>
                  </div>

                  {site.source === 'custom' && (
                    <button
                      onClick={() => handleDeleteSite(site.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Remove site"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 font-mono truncate bg-slate-50 p-2 rounded-xl border border-slate-100">
                  {site.url}
                </p>

                {site.lastEdited && (
                  <p className="text-[11px] text-slate-400">
                    Modified: {site.lastEdited}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-105"
                >
                  <span>Open Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href="https://sites.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-indigo-600 font-medium"
                >
                  Manage on Sites
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Site Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add Site Project</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Portfolio, Engineering Docs..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Site URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://sites.google.com/view/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Leave blank to auto-generate a Google Sites view URL.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Add Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
