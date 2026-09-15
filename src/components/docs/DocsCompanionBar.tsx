import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  CheckCircle,
  Calendar as CalendarIcon,
  BookOpen,
  MapPin,
  Users,
  Check,
  X,
} from 'lucide-react';

interface DocsCompanionBarProps {
  onOpenApp?: (appName: string) => void;
}

export const DocsCompanionBar: React.FC<DocsCompanionBarProps> = ({ onOpenApp }) => {
  const [activeSideTool, setActiveSideTool] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Mini task items for the side companion panel
  const [sideTasks, setSideTasks] = useState([
    { id: '1', title: 'Review executive summary revisions', done: false },
    { id: '2', title: 'Send finalized document to team', done: true },
    { id: '3', title: 'Verify Google Workspace OAuth scopes', done: false },
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  // Mini keep notes for side panel
  const [sideNotes, setSideNotes] = useState([
    { id: '1', title: 'Doc References', content: 'See cloud architecture diagrams in Drive > Engineering Assets.' },
    { id: '2', title: 'Meeting Questions', content: 'Ask about the timeline for cross-tool search.' },
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const toggleTool = (tool: string) => {
    setActiveSideTool(activeSideTool === tool ? null : tool);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setSideTasks([...sideTasks, { id: Date.now().toString(), title: newTaskText.trim(), done: false }]);
    setNewTaskText('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;
    setSideNotes([
      ...sideNotes,
      { id: Date.now().toString(), title: newNoteTitle || 'Untitled note', content: newNoteContent },
    ]);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  return (
    <div className="flex h-full shrink-0 relative">
      {/* Expanded Side Drawer (Keep / Tasks / Calendar) */}
      {activeSideTool && (
        <aside
          aria-label="Google Workspace Companion Panel"
          className="w-72 bg-white border-l border-[#dadce0] flex flex-col h-full shadow-lg z-20 animate-in slide-in-from-right-4 duration-200"
        >
          <div className="h-12 px-4 border-b border-[#dadce0] flex items-center justify-between">
            <span className="text-sm font-medium text-[#1f1f1f] capitalize">
              Google {activeSideTool}
            </span>
            <button
              onClick={() => setActiveSideTool(null)}
              className="p-1 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeSideTool === 'tasks' && (
              <div className="space-y-3">
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Add a task..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#dadce0] outline-none focus:border-[#1a73e8]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#1a73e8] text-white rounded-lg text-xs font-semibold hover:bg-[#1557b0] cursor-pointer"
                  >
                    Add
                  </button>
                </form>
                <div className="space-y-1.5">
                  {sideTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() =>
                        setSideTasks(
                          sideTasks.map((st) => (st.id === t.id ? { ...st, done: !st.done } : st))
                        )
                      }
                      className="p-2 hover:bg-[#f8fafd] rounded-lg border border-transparent hover:border-[#dadce0] flex items-start gap-2.5 cursor-pointer text-xs"
                    >
                      <div
                        className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 ${
                          t.done ? 'bg-[#1a73e8] border-[#1a73e8] text-white' : 'border-[#5f6368]'
                        }`}
                      >
                        {t.done && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`leading-tight ${t.done ? 'line-through text-[#80868b]' : 'text-[#1f1f1f]'}`}>
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSideTool === 'keep' && (
              <div className="space-y-3">
                <form onSubmit={handleAddNote} className="space-y-2 p-2.5 bg-[#f8fafd] rounded-xl border border-[#dadce0]">
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full text-xs font-medium bg-transparent outline-none"
                  />
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Take a note..."
                    rows={2}
                    className="w-full text-xs bg-transparent outline-none resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#1a73e8] text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </form>
                <div className="space-y-2">
                  {sideNotes.map((n) => (
                    <div key={n.id} className="p-3 bg-white rounded-xl border border-[#dadce0] shadow-2xs space-y-1">
                      <p className="text-xs font-semibold text-[#1f1f1f]">{n.title}</p>
                      <p className="text-[11px] text-[#5f6368] whitespace-pre-wrap">{n.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSideTool === 'calendar' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#e8f0fe] rounded-xl text-[#1a73e8]">
                  <p className="font-semibold">Today's Schedule</p>
                  <p className="text-[11px] text-[#444746] mt-0.5">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg border border-[#dadce0] hover:bg-[#f8fafd]">
                    <span className="text-[11px] font-bold text-[#1a73e8]">10:00 AM &ndash; 10:45 AM</span>
                    <p className="font-medium text-[#1f1f1f] mt-0.5">Leadership Weekly Sync</p>
                    <p className="text-[10px] text-[#5f6368]">Google Meet &bull; 4 participants</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#dadce0] hover:bg-[#f8fafd]">
                    <span className="text-[11px] font-bold text-[#188038]">2:00 PM &ndash; 2:30 PM</span>
                    <p className="font-medium text-[#1f1f1f] mt-0.5">Project Proposal Review</p>
                    <p className="text-[10px] text-[#5f6368]">In-Person &bull; Conference Room B</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Iconic Google Workspace Slim Companion Rail (56px) */}
      {!isCollapsed && (
        <aside
          aria-label="Google Workspace Quick Actions Rail"
          className="w-14 bg-white border-l border-[#dadce0] flex flex-col items-center py-3 gap-4 select-none shrink-0"
        >
          <button
            onClick={() => toggleTool('calendar')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              activeSideTool === 'calendar' ? 'bg-[#e8f0fe] shadow-xs' : 'hover:bg-[#f0f4f9]'
            }`}
            title="Google Calendar"
          >
            <img src="/logos/calendar.svg" alt="Calendar" className="w-5 h-5 object-contain" />
          </button>

          <button
            onClick={() => toggleTool('keep')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              activeSideTool === 'keep' ? 'bg-[#e8f0fe] shadow-xs' : 'hover:bg-[#f0f4f9]'
            }`}
            title="Google Keep"
          >
            <img src="/logos/keep.svg" alt="Keep" className="w-5 h-5 object-contain" />
          </button>

          <button
            onClick={() => toggleTool('tasks')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              activeSideTool === 'tasks' ? 'bg-[#e8f0fe] shadow-xs' : 'hover:bg-[#f0f4f9]'
            }`}
            title="Google Tasks"
          >
            <img src="/logos/tasks.svg" alt="Tasks" className="w-5 h-5 object-contain" />
          </button>

          <button
            onClick={() => onOpenApp?.('contacts')}
            className="p-2 rounded-full hover:bg-[#f0f4f9] transition-all cursor-pointer"
            title="Google Contacts"
          >
            <img src="/logos/contacts.svg" alt="Contacts" className="w-5 h-5 object-contain" />
          </button>

          <button
            onClick={() => onOpenApp?.('maps')}
            className="p-2 rounded-full hover:bg-[#f0f4f9] transition-all cursor-pointer"
            title="Google Maps"
          >
            <MapPin className="w-5 h-5 text-[#ea4335]" />
          </button>

          <div className="w-6 h-px bg-[#dadce0] my-1" />

          <button
            onClick={() => alert('Google Workspace Marketplace Add-ons ready')}
            className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full transition-all cursor-pointer"
            title="Get add-ons"
          >
            <Plus className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Bottom Rail Collapser */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full transition-all cursor-pointer"
            title="Hide side panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </aside>
      )}

      {/* Floating Expand Tab if Rail is Collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute bottom-4 right-0 p-1.5 bg-white border border-[#dadce0] rounded-l-lg shadow-sm text-[#5f6368] hover:text-[#1a73e8] z-20 cursor-pointer"
          title="Show side panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
