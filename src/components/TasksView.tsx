import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  RefreshCw,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ListTodo,
  ArrowLeft,
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
}

export const TasksView: React.FC<TasksViewProps> = ({ token, onBackToOverview }) => {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loadingLists, setLoadingLists] = useState<boolean>(true);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskNotes, setNewTaskNotes] = useState<string>('');
  const [newTaskDue, setNewTaskDue] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<TaskItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadTaskLists = async () => {
    setLoadingLists(true);
    setError(null);
    try {
      const lists = await listTaskLists(token);
      setTaskLists(lists);
      if (lists.length > 0 && !selectedListId) {
        setSelectedListId(lists[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task lists');
    } finally {
      setLoadingLists(false);
    }
  };

  const loadTasks = async (listId: string) => {
    if (!listId) return;
    setLoadingTasks(true);
    setError(null);
    try {
      const items = await listTasks(token, listId);
      setTasks(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadTaskLists();
  }, [token]);

  useEffect(() => {
    if (selectedListId) {
      loadTasks(selectedListId);
    }
  }, [selectedListId, token]);

  const handleToggleStatus = async (task: TaskItem) => {
    if (!selectedListId) return;
    const isCompleted = task.status === 'completed';
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: isCompleted ? 'needsAction' : 'completed' } : t
        )
      );
      await toggleTaskStatus(token, selectedListId, task.id, !isCompleted);
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
      loadTasks(selectedListId);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedListId) return;
    setIsAdding(true);
    try {
      await createTask(token, selectedListId, newTaskTitle.trim(), newTaskNotes, newTaskDue);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDue('');
      setSuccessMsg('Task added successfully!');
      loadTasks(selectedListId);
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setIsAdding(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !selectedListId) return;
    setIsDeleting(true);
    try {
      await deleteTask(token, selectedListId, deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSuccessMsg('Task deleted.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div id="tasks-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="tasks-back-to-overview-btn"
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
            <GoogleTasksIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Tasks</h2>
            <p className="text-sm text-slate-500">Track to-dos, manage checklists, and mark items done</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {taskLists.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium hidden md:inline">List:</span>
              <select
                id="task-list-selector"
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="text-xs bg-white/70 backdrop-blur-md border border-white/90 rounded-xl px-3 py-2 font-semibold text-slate-700 shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                {taskLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => selectedListId && loadTasks(selectedListId)}
            disabled={loadingTasks}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loadingTasks ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50/80 backdrop-blur-md border border-red-200/80 text-red-700 rounded-2xl text-sm flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50/80 backdrop-blur-md border border-emerald-200/80 text-emerald-700 rounded-2xl text-sm flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Add Task Form */}
      <form
        onSubmit={handleCreateTask}
        className="bg-white/75 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            id="new-task-title-input"
            type="text"
            placeholder="Add a new task (e.g. Prepare presentation slides)..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 text-sm bg-white/70 backdrop-blur-md border border-white/90 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
          />
          <input
            id="new-task-due-input"
            type="date"
            value={newTaskDue}
            onChange={(e) => setNewTaskDue(e.target.value)}
            className="text-xs bg-white/70 backdrop-blur-md border border-white/90 rounded-xl px-3.5 py-2.5 text-slate-700 shadow-2xs"
            title="Optional due date"
          />
          <button
            id="submit-new-task-btn"
            type="submit"
            disabled={!newTaskTitle.trim() || isAdding}
            className="px-5 py-2.5 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-blue-400/40 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </form>

      {/* Tasks List */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] overflow-hidden">
        {loadingTasks || loadingLists ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
            <p className="text-sm font-medium">Loading Google Tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ListTodo className="w-12 h-12 stroke-1 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No tasks in this list</p>
            <p className="text-xs text-slate-400 mt-1">
              Add your first task using the input field above
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Active tasks */}
            {activeTasks.map((task) => (
              <div
                key={task.id}
                id={`task-item-${task.id}`}
                className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                    title="Mark as completed"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 break-words">{task.title}</p>
                    {task.notes && (
                      <p className="text-xs text-slate-500 mt-0.5 break-words">{task.notes}</p>
                    )}
                    {task.due && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 font-medium">
                        <Clock className="w-3 h-3" /> Due {new Date(task.due).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setDeleteTarget(task)}
                  className="p-1.5 text-slate-300 group-hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Completed tasks header & list */}
            {completedTasks.length > 0 && (
              <div className="bg-slate-50/50 p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Completed ({completedTasks.length})
              </div>
            )}

            {completedTasks.map((task) => (
              <div
                key={task.id}
                id={`task-item-${task.id}`}
                className="p-3.5 hover:bg-slate-50/50 transition-colors flex items-start justify-between gap-3 opacity-60 group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="mt-0.5 text-blue-600 hover:text-slate-400 transition-colors shrink-0"
                    title="Mark as incomplete"
                  >
                    <CheckSquare className="w-5 h-5 fill-blue-50 text-blue-600" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500 line-through break-words">
                      {task.title}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDeleteTarget(task)}
                  className="p-1.5 text-slate-300 group-hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Deleting Task */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Google Task"
        description={`Are you sure you want to permanently delete the task "${deleteTarget?.title}"?`}
        confirmLabel="Yes, Delete Task"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
