import React, { useState, useEffect, useRef } from 'react';
import {
  Lightbulb,
  Bell,
  Tag,
  Archive,
  Trash2,
  Search,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  CheckSquare,
  Image as ImageIcon,
  Pin,
  CheckCircle2,
  Palette,
  ArrowLeft,
  X,
  Plus,
  Copy,
  ExternalLink,
  MoreVertical,
  Check,
} from 'lucide-react';
import { GoogleKeepIcon } from './GoogleIcons';
import { ConfirmModal } from './ConfirmModal';

interface NoteItem {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  color: string;
  updatedAt: string;
  isArchived?: boolean;
}

const KEEP_COLORS = [
  { id: 'default', name: 'Default', bg: 'bg-white', border: 'border-[#dadce0]' },
  { id: 'coral', name: 'Coral', bg: 'bg-[#faafa8]', border: 'border-[#f28b82]' },
  { id: 'peach', name: 'Peach', bg: 'bg-[#f39f76]', border: 'border-[#fbbc04]' },
  { id: 'sand', name: 'Sand', bg: 'bg-[#fff8b8]', border: 'border-[#fff475]' },
  { id: 'mint', name: 'Mint', bg: 'bg-[#e2f6cb]', border: 'border-[#ccff90]' },
  { id: 'sage', name: 'Sage', bg: 'bg-[#b4ddd3]', border: 'border-[#a7ffeb]' },
  { id: 'fog', name: 'Fog', bg: 'bg-[#d4e4ed]', border: 'border-[#cbf0f8]' },
  { id: 'storm', name: 'Storm', bg: 'bg-[#aeccdc]', border: 'border-[#aecbfa]' },
  { id: 'dusk', name: 'Dusk', bg: 'bg-[#d3bfdb]', border: 'border-[#d7aefb]' },
  { id: 'blossom', name: 'Blossom', bg: 'bg-[#f6e2dd]', border: 'border-[#fdcfe8]' },
];

const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'n1',
    title: 'Workspace Hub Sprint Goals',
    content: '1. Launch authentic Google Material Design 3 interfaces\n2. Integrate Drive file upload & streaming\n3. Bi-directional sync across all 10 tools',
    isPinned: true,
    color: 'bg-[#fff8b8]',
    updatedAt: new Date().toLocaleDateString(),
  },
  {
    id: 'n2',
    title: 'Grocery & Team Snacks',
    content: '• Cold brew coffee beans\n• Sparkling lime water\n• Dark chocolate almonds\n• Oat milk',
    isPinned: false,
    color: 'bg-[#e2f6cb]',
    updatedAt: new Date().toLocaleDateString(),
  },
  {
    id: 'n3',
    title: 'Important Meeting Codes',
    content: 'Weekly Architecture Review: meet.google.com/hub-sync-exec\nSecurity Office Hours: meet.google.com/sec-team-room',
    isPinned: false,
    color: 'bg-[#d4e4ed]',
    updatedAt: new Date().toLocaleDateString(),
  },
];

export const KeepView: React.FC<{ onBackToOverview?: () => void }> = ({ onBackToOverview }) => {
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('google_keep_notes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_NOTES;
  });

  const [activeNav, setActiveNav] = useState<'notes' | 'reminders' | 'archive' | 'trash'>('notes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGrid, setIsGrid] = useState<boolean>(true);

  // Composer expanded state
  const [isComposerExpanded, setIsComposerExpanded] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newColor, setNewColor] = useState<string>('bg-white');
  const [newIsPinned, setNewIsPinned] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  // Selected note for editing modal
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NoteItem | null>(null);

  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('google_keep_notes', JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const handleSaveNewNote = () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsComposerExpanded(false);
      return;
    }
    const note: NoteItem = {
      id: `note-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      isPinned: newIsPinned,
      color: newColor,
      updatedAt: new Date().toLocaleDateString(),
    };
    setNotes([note, ...notes]);
    setNewTitle('');
    setNewContent('');
    setNewColor('bg-white');
    setNewIsPinned(false);
    setIsComposerExpanded(false);
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)));
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(notes.map((n) => (n.id === id ? { ...n, isArchived: !n.isArchived } : n)));
  };

  const filteredNotes = notes.filter((n) => {
    if (activeNav === 'archive') return n.isArchived;
    if (n.isArchived) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  return (
    <div
      id="keep-view"
      className="flex flex-col h-[calc(100vh-5.5rem)] bg-white rounded-2xl overflow-hidden border border-[#dadce0] font-['Google_Sans',Roboto,sans-serif] shadow-sm relative select-none"
    >
      {/* 1. AUTHENTIC GOOGLE KEEP TOP BAR */}
      <header className="h-16 px-4 sm:px-6 bg-white border-b border-[#dadce0] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
              title="Back to Overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBackToOverview}>
            <GoogleKeepIcon className="w-8 h-8" />
            <span className="text-[22px] font-normal text-[#444746] tracking-tight">Keep</span>
          </div>
        </div>

        {/* Real Keep Search Bar */}
        <div className="flex-1 max-w-2xl mx-2">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-[#5f6368] absolute left-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search in Keep..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-12 pr-10 bg-[#f1f3f4] hover:bg-[#e8eaed] focus:bg-white text-sm text-[#1f1f1f] rounded-lg border border-transparent focus:border-[#dadce0] focus:shadow-md outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 text-[#5f6368] hover:text-[#1f1f1f] rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsGrid(!isGrid)}
            className="p-2 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full transition-colors cursor-pointer"
            title={isGrid ? 'List view' : 'Grid view'}
          >
            {isGrid ? <ListIcon className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
          </button>
          <a
            href="https://keep.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full transition-colors cursor-pointer hidden sm:block"
            title="Open Keep on web"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* 2. DOCK: LEFT SIDEBAR + NOTES CANVAS */}
      <div className="flex flex-1 overflow-hidden">
        {/* Authentic Left Navigation Sidebar */}
        <aside className="w-60 shrink-0 p-3 hidden md:flex flex-col justify-between bg-white border-r border-[#dadce0]">
          <nav className="space-y-0.5 text-xs font-semibold text-[#444746]">
            <button
              onClick={() => setActiveNav('notes')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-r-full cursor-pointer transition-colors ${
                activeNav === 'notes' ? 'bg-[#feefc3] text-[#202124] font-bold' : 'hover:bg-[#f1f3f4]'
              }`}
            >
              <Lightbulb className="w-5 h-5 text-[#fbbc04]" />
              <span>Notes</span>
            </button>
            <button
              onClick={() => setActiveNav('reminders')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-r-full cursor-pointer transition-colors ${
                activeNav === 'reminders' ? 'bg-[#feefc3] text-[#202124] font-bold' : 'hover:bg-[#f1f3f4]'
              }`}
            >
              <Bell className="w-5 h-5 text-[#5f6368]" />
              <span>Reminders</span>
            </button>
            <button
              onClick={() => setActiveNav('archive')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-r-full cursor-pointer transition-colors ${
                activeNav === 'archive' ? 'bg-[#feefc3] text-[#202124] font-bold' : 'hover:bg-[#f1f3f4]'
              }`}
            >
              <Archive className="w-5 h-5 text-[#5f6368]" />
              <span>Archive</span>
            </button>
          </nav>

          <div className="p-3 text-[11px] text-[#747775]">
            Google Keep Notes Sync
          </div>
        </aside>

        {/* Center Scrollable Notes Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center">
          {/* Authentic "Take a note..." Expandable Card */}
          <div
            ref={composerRef}
            className={`w-full max-w-xl rounded-xl border border-[#dadce0] shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_2px_6px_2px_rgba(60,64,67,0.15)] transition-all mb-8 ${newColor}`}
          >
            {!isComposerExpanded ? (
              <div
                onClick={() => setIsComposerExpanded(true)}
                className="px-4 py-3 flex items-center justify-between text-[#747775] text-sm font-medium cursor-pointer"
              >
                <span>Take a note...</span>
                <div className="flex items-center gap-3 text-[#5f6368]">
                  <CheckSquare className="w-5 h-5 hover:text-black" />
                  <ImageIcon className="w-5 h-5 hover:text-black" />
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    placeholder="Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    autoFocus
                    className="w-full text-base font-semibold text-[#1f1f1f] bg-transparent outline-none placeholder-[#747775]"
                  />
                  <button
                    onClick={() => setNewIsPinned(!newIsPinned)}
                    className="p-1 text-[#5f6368] hover:text-black rounded-full"
                  >
                    <Pin className={`w-4 h-4 ${newIsPinned ? 'fill-black text-black' : ''}`} />
                  </button>
                </div>

                <textarea
                  placeholder="Take a note..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  className="w-full text-sm text-[#1f1f1f] bg-transparent outline-none resize-none placeholder-[#747775]"
                />

                {/* Composer Footer Actions */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#5f6368] relative">
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-1.5 hover:bg-black/10 rounded-full cursor-pointer"
                      title="Background options"
                    >
                      <Palette className="w-4 h-4" />
                    </button>

                    {showColorPicker && (
                      <div className="absolute top-8 left-0 z-50 p-2 bg-white rounded-xl shadow-lg border border-[#dadce0] flex gap-1">
                        {KEEP_COLORS.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setNewColor(c.bg);
                              setShowColorPicker(false);
                            }}
                            className={`w-6 h-6 rounded-full border border-[#dadce0] ${c.bg} hover:scale-110 transition-transform`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveNewNote}
                    className="px-5 py-1.5 hover:bg-black/10 text-xs font-bold text-[#1f1f1f] rounded cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes Masonry Display */}
          <div className="w-full max-w-5xl space-y-8">
            {/* Pinned Section */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-[#747775] uppercase tracking-wider px-2">Pinned</h5>
                <div className={isGrid ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-3'}>
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onTogglePin={handleTogglePin}
                      onArchive={handleArchive}
                      onDelete={(n) => setDeleteTarget(n)}
                      onClick={() => setEditingNote(note)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Notes Section */}
            {otherNotes.length > 0 && (
              <div className="space-y-3">
                {pinnedNotes.length > 0 && (
                  <h5 className="text-xs font-bold text-[#747775] uppercase tracking-wider px-2">Others</h5>
                )}
                <div className={isGrid ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-3'}>
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onTogglePin={handleTogglePin}
                      onArchive={handleArchive}
                      onDelete={(n) => setDeleteTarget(n)}
                      onClick={() => setEditingNote(note)}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredNotes.length === 0 && (
              <div className="text-center py-24 text-[#747775] space-y-3">
                <Lightbulb className="w-16 h-16 stroke-1 mx-auto text-[#dadce0]" />
                <p className="text-base font-semibold">Notes you add appear here</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* EDIT NOTE MODAL */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div
            className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-[#dadce0] space-y-4 ${editingNote.color}`}
          >
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                className="w-full text-base font-bold bg-transparent outline-none text-[#1f1f1f]"
              />
              <button
                onClick={() => setEditingNote({ ...editingNote, isPinned: !editingNote.isPinned })}
                className="p-1 text-[#5f6368] hover:text-black rounded-full"
              >
                <Pin className={`w-4 h-4 ${editingNote.isPinned ? 'fill-black text-black' : ''}`} />
              </button>
            </div>
            <textarea
              value={editingNote.content}
              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
              rows={6}
              className="w-full text-xs sm:text-sm bg-transparent outline-none resize-none text-[#1f1f1f] leading-relaxed"
            />
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-1">
                {KEEP_COLORS.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setEditingNote({ ...editingNote, color: c.bg })}
                    className={`w-5 h-5 rounded-full border border-[#dadce0] ${c.bg}`}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  setNotes(notes.map((n) => (n.id === editingNote.id ? editingNote : n)));
                  setEditingNote(null);
                }}
                className="px-5 py-2 bg-black/10 hover:bg-black/20 text-[#1f1f1f] rounded-full text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete note"
        description="Are you sure you want to delete this note?"
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={() => {
          if (deleteTarget) {
            setNotes(notes.filter((n) => n.id !== deleteTarget.id));
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

const NoteCard: React.FC<{
  note: NoteItem;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onArchive: (id: string, e: React.MouseEvent) => void;
  onDelete: (n: NoteItem) => void;
  onClick: () => void;
}> = ({ note, onTogglePin, onArchive, onDelete, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border border-[#dadce0] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group relative ${note.color}`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold text-[#1f1f1f] truncate">{note.title || 'Untitled'}</h4>
          <button
            onClick={(e) => onTogglePin(note.id, e)}
            className="p-1 text-[#5f6368] hover:text-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-black text-black opacity-100' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-[#444746] whitespace-pre-wrap leading-relaxed">{note.content}</p>
      </div>

      <div className="pt-4 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-[#5f6368]">
        <button
          onClick={(e) => onArchive(note.id, e)}
          className="p-1.5 hover:bg-black/10 rounded-full cursor-pointer"
          title="Archive"
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note);
          }}
          className="p-1.5 hover:bg-black/10 hover:text-[#d93025] rounded-full cursor-pointer"
          title="Delete note"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
