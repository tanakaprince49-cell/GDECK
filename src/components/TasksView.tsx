import React, { useState, useEffect, useRef } from 'react';
import { WorkspaceFocusTarget } from '../types/focus';
import {
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Calendar as CalendarIcon,
  Layers,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Star,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  X,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import { TaskList, TaskItem } from '../types/workspace';
import {
  listTaskLists,
  listTasks,
  createTask,
  toggleTaskStatus,
  deleteTask,
} from '../services/workspace';
import { ConfirmModal } from './ConfirmModal';
import { GoogleTasksIcon } from './GoogleIcons';

interface TasksViewProps {
  token: string;
  onBackToOverview?: () => void;
  /** Task to open straight away (from Omni-Search). */
  focusTarget?: WorkspaceFocusTarget | null;
  onFocusHandled?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ token, onBackToOverview, focusTarget, onFocusHandled }) => {
  const [taskLists, setTaskLists] = useState<TaskList[]>([
    { id: 'default', title: 'My Tasks' },
    { id: 'work', title: 'Work & Workspace' },
  ]);
  const [selectedListId, setSelectedListId] = useState<string>('default');
  // Task list chosen from outside (Omni-Search); keeps the list loader from reverting it.
  const focusedListIdRef = useRef<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 't1',
      title: 'Review Google Drive access permissions',
      notes: 'Ensure all team members have correct viewing & edit roles on project folders.',
      due: '2026-09-18T17:00:00.000Z',
      status: 'needsAction',
      updated: new Date().toISOString(),
    },
    {
      id: 't2',
      title: 'Sync quarterly budget in Google Sheets',
      notes: 'Link with accounting data pipeline before next Monday.',
      status: 'needsAction',
      updated: new Date().toISOString(),
    },
    {
      id: 't3',
      title: 'Prepare Google Meet agenda for executive review',
      notes: 'Share presentation deck and slides in advance.',
      due: '2026-09-16T15:00:00.000Z',
      status: 'completed',
      completed: new Date().toISOString(),
      updated: new Date().toISOString(),
    },
  ]);

  const [loadingLists, setLoadingLists] = useState<boolean>(false);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick Inline Add Task State
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskNotes, setNewTaskNotes] = useState<string>('');
  const [newTaskDue, setNewTaskDue] = useState<string>('');

  // Completed section collapsed state
  const [isCompletedExpanded, setIsCompletedExpanded] = useState<boolean>(false);

  // Selected Task Details Panel
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskItem | null>(null);

  const loadTaskLists = async () => {
    if (!token) return;
    setLoadingLists(true);
    setError(null);
    try {
      const lists = await listTaskLists(token);
      if (lists && lists.length > 0) {
        setTaskLists(lists);
        if ((!selectedListId || !lists.some((l) => l.id === selectedListId)) && !focusedListIdRef.current) {
          setSelectedListId(lists[0].id);
        }
      }
    } catch (err: any) {
      console.warn('Using local task lists:', err.message);
    } finally {
      setLoadingLists(false);
    }
  };

  const loadTasks = async (listId: string) => {
    if (!token || !listId || listId === 'default' || listId === 'work') return;
    setLoadingTasks(true);
    setError(null);
    try {
      const items = await listTasks(token, listId);
      if (items) setTasks(items);
    } catch (err: any) {
      console.warn('Using local tasks:', err.message);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Search hit -> switch to the task's own list and open its details.
  useEffect(() => {
    if (!focusTarget || focusTarget.source !== 'tasks') return;
    if (focusTarget.listId) {
      focusedListIdRef.current = focusTarget.listId;
      setSelectedListId(focusTarget.listId);
    }
    if (focusTarget.item) setSelectedTask(focusTarget.item);
    onFocusHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTarget]);

  useEffect(() => {
    loadTaskLists();
  }, [token]);

  useEffect(() => {
    if (selectedListId) {
      loadTasks(selectedListId);
    }
  }, [selectedListId, token]);

  const handleToggleStatus = async (task: TaskItem) => {
    const isCompleted = task.status === 'completed';
    const nextStatus = isCompleted ? 'needsAction' : 'completed';

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              completed: nextStatus === 'completed' ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    if (token && selectedListId && selectedListId !== 'default' && selectedListId !== 'work') {
      try {
        await toggleTaskStatus(token, selectedListId, task.id, !isCompleted);
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: newTaskTitle.trim(),
      notes: newTaskNotes.trim() || undefined,
      due: newTaskDue ? new Date(newTaskDue).toISOString() : undefined,
      status: 'needsAction',
      updated: new Date().toISOString(),
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setNewTaskNotes('');
    setNewTaskDue('');
    setIsAddingTask(false);
    setSuccessMsg('Task added');
    setTimeout(() => setSuccessMsg(null), 2500);

    if (token && selectedListId && selectedListId !== 'default' && selectedListId !== 'work') {
      try {
        await createTask(token, selectedListId, newTask.title, newTask.notes, newTaskDue);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setTasks(tasks.filter((t) => t.id !== deleteTarget.id));
    if (selectedTask?.id === deleteTarget.id) setSelectedTask(null);
    setDeleteTarget(null);

    if (token && selectedListId && selectedListId !== 'default' && selectedListId !== 'work') {
      try {
        await deleteTask(token, selectedListId, deleteTarget.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div
      id="tasks-view"
      className="flex flex-col h-full min-h-0 md:h-[calc(100dvh-5.5rem)] bg-white rounded-2xl overflow-hidden border border-[#dadce0] font-['Google_Sans',Roboto,sans-serif] shadow-sm relative select-none"
    >
      {/* 1. AUTHENTIC GOOGLE TASKS TOP BAR */}
      <header className="h-14 sm:h-16 px-2 sm:px-4 sm:px-6 bg-white border-b border-[#dadce0] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="hidden md:inline-flex p-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer"
              title="Back to Overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBackToOverview}>
            <GoogleTasksIcon className="w-8 h-8" />
            <span className="text-[22px] font-normal text-[#444746] tracking-tight">Tasks</span>
          </div>
        </div>

        {/* List Selector Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {taskLists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedListId(list.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedListId === list.id
                  ? 'bg-[#c2e7ff] text-[#001d35]'
                  : 'bg-[#f0f4f9] hover:bg-[#e1eaf5] text-[#444746]'
              }`}
            >
              {list.title}
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full transition-colors hidden sm:block"
            title="Open in Calendar Tasks"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* 2. DOCK: MAIN TASK LIST + TASK DETAILS SIDEBAR */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Tasks List */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-4">
          {/* "+ Add a task" Blue Pill Button */}
          {!isAddingTask ? (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" />
              <span>Add a task</span>
            </button>
          ) : (
            /* Inline Add Task Card */
            <form
              onSubmit={handleCreateTask}
              className="bg-white rounded-2xl border border-[#dadce0] shadow-[0_2px_8px_rgba(60,64,67,0.15)] p-4 space-y-3 animate-in fade-in"
            >
              <input
                type="text"
                placeholder="Title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
                className="w-full text-sm font-semibold text-[#1f1f1f] outline-none placeholder-[#747775]"
              />
              <textarea
                placeholder="Details"
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                rows={2}
                className="w-full text-xs text-[#1f1f1f] outline-none resize-none placeholder-[#747775]"
              />
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="px-3 py-1.5 text-xs text-[#444746] bg-[#f0f4f9] rounded-lg border border-[#dadce0] outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f1f3f4]">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-1.5 text-xs font-bold text-[#5f6368] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-5 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-40 text-white text-xs font-bold rounded-full cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {/* Active Tasks List */}
          <div className="space-y-1">
            {activeTasks.map((task) => {
              const isSelected = selectedTask?.id === task.id;
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`group p-3 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#f0f4f9] border-[#1a73e8]'
                      : 'border-transparent hover:bg-[#f8fafd] hover:border-[#dadce0]'
                  }`}
                >
                  {/* Circle Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(task);
                    }}
                    className="mt-0.5 w-5 h-5 rounded-full border-2 border-[#747775] hover:border-[#1a73e8] hover:bg-[#e8f0fe] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1f1f1f]">{task.title}</p>
                    {task.notes && (
                      <p className="text-xs text-[#5f6368] line-clamp-1 mt-0.5">{task.notes}</p>
                    )}
                    {task.due && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded-full mt-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(task.due).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(task);
                    }}
                    className="p-1 text-[#747775] hover:text-[#d93025] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Completed Tasks Accordion */}
          {completedTasks.length > 0 && (
            <div className="pt-4 space-y-2 border-t border-[#f1f3f4]">
              <button
                onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                className="flex items-center gap-2 text-xs font-bold text-[#444746] hover:text-[#1f1f1f] cursor-pointer"
              >
                {isCompletedExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span>Completed ({completedTasks.length})</span>
              </button>

              {isCompletedExpanded && (
                <div className="space-y-1 pl-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="group p-3 rounded-xl flex items-start gap-3 hover:bg-[#f8fafd] transition-all cursor-pointer opacity-60"
                    >
                      {/* Completed Blue Checkmark */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(task);
                        }}
                        className="mt-0.5 w-5 h-5 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-through text-[#747775]">{task.title}</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(task);
                        }}
                        className="p-1 text-[#747775] hover:text-[#d93025] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Task Details Side Panel (When a task is selected) */}
        {selectedTask && (
          <aside className="w-80 border-l border-[#dadce0] bg-white p-5 flex flex-col justify-between shrink-0 animate-in slide-in-from-right-5">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#dadce0]">
                <h4 className="text-sm font-bold text-[#1f1f1f]">Task details</h4>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={selectedTask.title}
                  onChange={(e) => {
                    const updated = { ...selectedTask, title: e.target.value };
                    setSelectedTask(updated);
                    setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
                  }}
                  className="w-full text-base font-semibold text-[#1f1f1f] outline-none"
                />

                <textarea
                  value={selectedTask.notes || ''}
                  onChange={(e) => {
                    const updated = { ...selectedTask, notes: e.target.value };
                    setSelectedTask(updated);
                    setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
                  }}
                  placeholder="Add details"
                  rows={4}
                  className="w-full text-xs text-[#444746] outline-none resize-none"
                />

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-[#5f6368] block mb-1">Due date:</span>
                  <input
                    type="date"
                    value={selectedTask.due ? selectedTask.due.split('T')[0] : ''}
                    onChange={(e) => {
                      const updated = {
                        ...selectedTask,
                        due: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      };
                      setSelectedTask(updated);
                      setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
                    }}
                    className="px-3 py-1.5 text-xs text-[#1f1f1f] bg-[#f0f4f9] rounded-lg border border-[#dadce0] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#dadce0] flex items-center justify-between">
              <button
                onClick={() => setDeleteTarget(selectedTask)}
                className="p-2 text-[#d93025] hover:bg-[#fce8e6] rounded-full cursor-pointer transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-1.5 bg-[#1a73e8] text-white text-xs font-bold rounded-full cursor-pointer"
              >
                Done
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete task"
        description="Are you sure you want to delete this task?"
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
