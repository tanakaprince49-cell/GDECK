import React, { useState, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Trash2,
  ExternalLink,
  Pin,
  CheckCircle2,
  Tag,
  Palette,
  ArrowLeft,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { GoogleKeepIcon } from './GoogleIcons';

interface NoteItem {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  color: string;
  updatedAt: string;
}

const COLOR_OPTIONS = [
  { name: 'Default', bg: 'bg-white', border: 'border-slate-200' },
  { name: 'Yellow', bg: 'bg-amber-50', border: 'border-amber-200' },
  { name: 'Green', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { name: 'Blue', bg: 'bg-sky-50', border: 'border-sky-200' },
  { name: 'Purple', bg: 'bg-purple-50', border: 'border-purple-200' },
  { name: 'Pink', bg: 'bg-rose-50', border: 'border-rose-200' },
];

interface KeepViewProps {
  onBackToOverview?: () => void;
}

export const KeepView: React.FC<KeepViewProps> = ({ onBackToOverview }) => {
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('workspace_hub_keep_notes');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: '1',
        title: 'Project Roadmap Ideas',
        content: '• Integrate Google Sheets data pipeline\n• Schedule team sync on Calendar\n• Review incoming Form responses',
        isPinned: true,
        color: 'bg-amber-50',
        updatedAt: new Date().toLocaleDateString(),
      },
      {
        id: '2',
        title: 'Meeting Notes & Action Items',
        content: 'Shared Drive files organized. All team permissions updated.',
        isPinned: false,
        color: 'bg-sky-50',
        updatedAt: new Date().toLocaleDateString(),
      },
    ];
  });

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-white');

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<NoteItem | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('workspace_hub_keep_notes', JSON.stringify(notes));
    } catch {
      // ignore
    }
  }, [notes]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;

    const newNote: NoteItem = {
      id: Date.now().toString(),
      title: newTitle.trim() || 'Untitled Note',
      content: newContent.trim(),
      isPinned: false,
      color: selectedColor,
      updatedAt: new Date().toLocaleDateString(),
    };

    setNotes([newNote, ...notes]);
    setNewTitle('');
    setNewContent('');
    setSelectedColor('bg-white');
  };

  const togglePin = (id: string) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setNotes(notes.filter((n) => n.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);

  return (
    <div id="keep-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="keep-back-to-overview-btn"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-amber-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-amber-500/10 border border-amber-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleKeepIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Keep Notes</h2>
            <p className="text-sm text-slate-500">Capture quick thoughts, checklists, and synced scratchpad notes</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://keep.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_4px_14px_rgba(245,158,11,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-amber-400/40 cursor-pointer hover:scale-105"
            title="Open Google Keep in Web"
          >
            <ExternalLink className="w-4 h-4" />
            Open Google Keep
          </a>
        </div>
      </div>


      {/* New Note Composer */}
      <form
        onSubmit={handleAddNote}
        className="bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] space-y-3 max-w-2xl mx-auto"
      >
        <input
          id="keep-note-title"
          type="text"
          placeholder="Title..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full text-sm font-semibold bg-transparent border-0 border-b border-slate-100 pb-2 focus:ring-0 focus:outline-hidden text-slate-900"
        />
        <textarea
          id="keep-note-content"
          rows={3}
          placeholder="Take a note..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="w-full text-xs bg-transparent border-0 focus:ring-0 focus:outline-hidden resize-none text-slate-700"
        />

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedColor(c.bg)}
                className={`w-5 h-5 rounded-full border ${c.bg} ${
                  selectedColor === c.bg ? 'ring-2 ring-amber-500 scale-110' : 'border-slate-300'
                } transition-all`}
                title={c.name}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={!newTitle.trim() && !newContent.trim()}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" /> Save Note
          </button>
        </div>
      </form>

      {/* Notes Grid */}
      <div className="space-y-6">
        {pinnedNotes.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 fill-slate-400" /> Pinned Notes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onTogglePin={() => togglePin(note.id)}
                  onDelete={() => setDeleteTarget(note)}
                />
              ))}
            </div>
          </div>
        )}

        {otherNotes.length > 0 && (
          <div className="space-y-3">
            {pinnedNotes.length > 0 && (
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Others
              </h4>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onTogglePin={() => togglePin(note.id)}
                  onDelete={() => setDeleteTarget(note)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for deleting note */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Note"
        description={`Are you sure you want to permanently delete the note "${deleteTarget?.title}"?`}
        confirmLabel="Yes, Delete"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

const NoteCard: React.FC<{
  note: NoteItem;
  onTogglePin: () => void;
  onDelete: () => void;
}> = ({ note, onTogglePin, onDelete }) => {
  return (
    <div
      className={`p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${note.color} group`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-slate-900 leading-snug">{note.title}</h4>
          <button
            onClick={onTogglePin}
            className={`p-1 rounded-md transition-colors ${
              note.isPinned
                ? 'text-amber-600'
                : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-600'
            }`}
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-600' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
          {note.content}
        </p>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-200/40 flex items-center justify-between text-[11px] text-slate-400">
        <span>{note.updatedAt}</span>
        <button
          onClick={onDelete}
          className="p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all rounded"
          title="Delete note"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
