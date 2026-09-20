import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Layers,
  RefreshCw,
  Search,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Globe,
  CheckCircle2,
  AlertCircle,
  Pin,
} from 'lucide-react';
import { ToolDefinition } from '../constants/tools';
import {
  searchDrawings,
  searchSites,
  searchUserPhotos,
  listDriveFiles,
  type WorkspacePhotoItem,
} from '../services/workspace';
import type { DriveFile } from '../types/workspace';

interface WorkspaceAppViewProps {
  tool: ToolDefinition;
  userEmail?: string | null;
  token?: string | null;
  onBackToOverview: () => void;
  onNavigateTab?: (tab: string) => void;
}

type RowItem = {
  id: string;
  name: string;
  subtitle?: string;
  linkTab?: string;
  thumb?: string;
};

/**
 * In-app surface for secondary Workspace tools.
 * NEVER opens google.com in a new tab — everything stays inside G-Deck.
 * Where we have Drive/API coverage we list live files; otherwise we show a
 * focused in-deck workspace with shortcuts into related built-in tools.
 */
export const WorkspaceAppView: React.FC<WorkspaceAppViewProps> = ({
  tool,
  userEmail,
  token,
  onBackToOverview,
  onNavigateTab,
}) => {
  const Icon = tool.icon;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<RowItem[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setNote('Connect Google Workspace to load live data for this tool inside G-Deck.');
      return;
    }
    setLoading(true);
    setError(null);
    setNote(null);
    try {
      let rows: RowItem[] = [];
      const q = query.trim().toLowerCase();

      const mapDrive = (files: DriveFile[], linkTab?: string): RowItem[] =>
        files.map((f) => ({
          id: f.id,
          name: f.name || 'Untitled',
          subtitle: f.modifiedTime
            ? `Updated ${new Date(f.modifiedTime).toLocaleString()}`
            : undefined,
          linkTab,
          thumb: f.thumbnailLink || f.iconLink,
        }));

      switch (tool.id) {
        case 'photos': {
          const photos: WorkspacePhotoItem[] = await searchUserPhotos(token);
          rows = photos.map((p) => ({
            id: p.id,
            name: p.name || 'Photo',
            subtitle: p.modifiedTime
              ? new Date(p.modifiedTime).toLocaleString()
              : p.mimeType,
            linkTab: 'drive',
            thumb: p.thumbnailLink,
          }));
          break;
        }
        case 'sites': {
          rows = mapDrive(await searchSites(token), 'drive');
          break;
        }
        case 'drawings': {
          rows = mapDrive(await searchDrawings(token), 'drive');
          break;
        }
        case 'classroom':
        case 'analytics':
        case 'searchconsole':
        case 'youtube':
        case 'trends':
        case 'finance':
        case 'maps':
        case 'translate': {
          // No public user-data API we can safely embed — stay in-deck with related tools.
          setNote(
            `${tool.name} runs inside G-Deck. Use the related Workspace tools below — nothing opens on google.com.`
          );
          rows = [];
          break;
        }
        default: {
          // Generic Drive listing filtered by name
          const files = await listDriveFiles(token, query || undefined);
          rows = mapDrive(files.slice(0, 40), 'drive');
          break;
        }
      }

      if (q && rows.length) {
        rows = rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.subtitle || '').toLowerCase().includes(q)
        );
      }
      setItems(rows);
    } catch (err: any) {
      setError(err?.message || `Could not load ${tool.name} inside G-Deck.`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, tool.id, tool.name, query]);

  useEffect(() => {
    load();
  }, [load]);

  const related: { id: string; label: string }[] = (() => {
    switch (tool.id) {
      case 'photos':
        return [
          { id: 'drive', label: 'Open Drive' },
          { id: 'docs', label: 'Open Docs' },
        ];
      case 'sites':
      case 'drawings':
        return [
          { id: 'drive', label: 'Open Drive' },
          { id: 'docs', label: 'Open Docs' },
          { id: 'slides', label: 'Open Slides' },
        ];
      case 'classroom':
        return [
          { id: 'drive', label: 'Class files in Drive' },
          { id: 'docs', label: 'Docs' },
          { id: 'forms', label: 'Forms' },
          { id: 'calendar', label: 'Calendar' },
        ];
      case 'youtube':
        return [
          { id: 'drive', label: 'Videos in Drive' },
          { id: 'docs', label: 'Scripts in Docs' },
        ];
      case 'analytics':
      case 'searchconsole':
      case 'trends':
        return [
          { id: 'sheets', label: 'Reports in Sheets' },
          { id: 'docs', label: 'Notes in Docs' },
        ];
      case 'finance':
        return [
          { id: 'sheets', label: 'Track in Sheets' },
          { id: 'docs', label: 'Notes in Docs' },
        ];
      case 'maps':
        return [
          { id: 'calendar', label: 'Events in Calendar' },
          { id: 'contacts', label: 'Contacts' },
        ];
      case 'translate':
        return [
          { id: 'docs', label: 'Translate in Docs' },
          { id: 'gmail', label: 'Mail in Gmail' },
        ];
      default:
        return [
          { id: 'drive', label: 'Drive' },
          { id: 'gmail', label: 'Gmail' },
          { id: 'calendar', label: 'Calendar' },
        ];
    }
  })();

  const openRelated = (tab: string) => {
    if (onNavigateTab) onNavigateTab(tab);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-in fade-in duration-300 h-full min-h-0 overflow-y-auto p-3 sm:p-0">
      {/* Header — always in-deck, never external */}
      <div className="bg-white rounded-3xl border border-[#dadce0] p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToOverview}
            className="p-2 rounded-full hover:bg-[#f1f3f4] text-[#1f1f1f] cursor-pointer shrink-0"
            aria-label="Back to Home"
            title="Back to Home"
            id={`${tool.id}-back-to-overview-btn`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-[#f8fafd] border border-[#dadce0] p-2 flex items-center justify-center shrink-0">
            <Icon className="w-8 h-8 object-contain" alt={tool.name} />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1f1f1f] truncate">{tool.name}</h1>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${tool.badgeColor}`}>
                {tool.badge}
              </span>
              <span className="text-[11px] font-semibold text-[#188038] bg-[#e6f4ea] px-2 py-0.5 rounded-full border border-[#ceead6] inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Inside G-Deck
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5f6368]">{tool.desc}</p>
            {userEmail ? (
              <p className="text-[11px] text-[#80868b] truncate">Signed in as {userEmail}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="px-4 py-2.5 rounded-full border border-[#dadce0] text-[#1f1f1f] hover:bg-[#f1f3f4] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#1a73e8]' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-[#dadce0] px-3 py-2 flex items-center gap-2 shadow-2xs">
        <Search className="w-4 h-4 text-[#5f6368] shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') load();
          }}
          placeholder={`Search ${tool.shortName} inside G-Deck…`}
          className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-[#9aa0a6] py-1.5"
        />
      </div>

      {/* Related in-deck tools */}
      <div className="flex flex-wrap gap-2">
        {related.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => openRelated(r.id)}
            className="px-3 py-1.5 rounded-full bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1a73e8] text-xs font-semibold cursor-pointer border border-[#d2e3fc]"
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-[#c5221f] bg-[#fce8e6] border border-[#f5c6cb] rounded-2xl px-3.5 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {note && !error && (
        <div className="flex items-start gap-2 text-xs text-[#1f1f1f] bg-[#e8f0fe] border border-[#d2e3fc] rounded-2xl px-3.5 py-2.5">
          <Layers className="w-4 h-4 shrink-0 mt-0.5 text-[#1a73e8]" />
          <span>{note}</span>
        </div>
      )}

      {/* Live list */}
      <div className="bg-white rounded-3xl border border-[#dadce0] shadow-xs overflow-hidden min-h-[240px]">
        <div className="px-4 py-3 border-b border-[#f1f3f4] flex items-center justify-between">
          <span className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">
            {loading ? 'Loading…' : `${items.length} item${items.length === 1 ? '' : 's'} in G-Deck`}
          </span>
          <span className="text-[11px] text-[#80868b] inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#188038]" />
            No external Google tabs
          </span>
        </div>

        {loading ? (
          <div className="p-10 flex flex-col items-center gap-3 text-[#5f6368] text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-[#1a73e8]" />
            Loading {tool.shortName}…
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f8fafd] border border-[#dadce0] flex items-center justify-center">
              <FolderOpen className="w-7 h-7 text-[#5f6368]" />
            </div>
            <h3 className="text-base font-bold text-[#1f1f1f]">All set inside G-Deck</h3>
            <p className="text-xs text-[#5f6368] max-w-sm mx-auto leading-relaxed">
              {tool.name} stays in this deck. Use the related tools above or pin {tool.shortName} from the ☰ menu
              so it lives on your Home dashboard.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {related.slice(0, 3).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => openRelated(r.id)}
                  className="px-4 py-2 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold cursor-pointer"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[#f1f3f4] max-h-[min(60vh,28rem)] overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => item.linkTab && openRelated(item.linkTab)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafd] text-left cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f8fafd] border border-[#dadce0] overflow-hidden flex items-center justify-center shrink-0">
                    {item.thumb ? (
                      <img src={item.thumb} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : tool.id === 'photos' ? (
                      <ImageIcon className="w-5 h-5 text-[#5f6368]" />
                    ) : tool.id === 'sites' ? (
                      <Globe className="w-5 h-5 text-[#5f6368]" />
                    ) : (
                      <FileText className="w-5 h-5 text-[#5f6368]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1f1f1f] truncate">{item.name}</p>
                    {item.subtitle ? (
                      <p className="text-[11px] text-[#5f6368] truncate">{item.subtitle}</p>
                    ) : null}
                  </div>
                  <Pin className="w-3.5 h-3.5 text-[#dadce0] shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
