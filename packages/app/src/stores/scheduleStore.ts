/**
 * Schedule Store — zustand state management for scheduled tasks.
 * Fetches tasks from /api/scheduled-tasks, provides CRUD + run-now.
 * No persist — tasks re-fetch on mount from backend.
 */

import { create } from 'zustand';
import type { ScheduledTask, TaskRun } from '@afw/shared';
import type { WorkbenchId } from '@/lib/types';

interface ScheduleState {
  /** Tasks keyed by workbenchId */
  tasks: Record<string, ScheduledTask[]>;
  /** Run history keyed by taskId (last 10) */
  runs: Record<string, TaskRun[]>;
  loading: boolean;
  error: string | null;

  /** Fetch all tasks for a workbench */
  loadTasks: (workbenchId: WorkbenchId) => Promise<void>;
  /** Fetch run history for a task */
  loadRuns: (workbenchId: WorkbenchId, taskId: string) => Promise<void>;
  /** Create a new scheduled task */
  createTask: (
    workbenchId: WorkbenchId,
    data: { name: string; description: string; cronExpression: string; target: { type: 'flow' | 'action'; name: string } }
  ) => Promise<void>;
  /** Update an existing task */
  updateTask: (
    workbenchId: WorkbenchId,
    taskId: string,
    updates: Partial<Pick<ScheduledTask, 'name' | 'description' | 'cronExpression' | 'target'>>
  ) => Promise<void>;
  /** Delete a task */
  deleteTask: (workbenchId: WorkbenchId, taskId: string) => Promise<void>;
  /** Manually trigger a task (Run Now) */
  runNow: (workbenchId: WorkbenchId, taskId: string) => Promise<TaskRun | null>;
  /** Get tasks for a workbench (accessor) */
  getTasksByWorkbench: (workbenchId: WorkbenchId) => ScheduledTask[];
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  tasks: {},
  runs: {},
  loading: false,
  error: null,

  loadTasks: async (workbenchId: WorkbenchId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/scheduled-tasks/${workbenchId}`);
      const data = await res.json();
      if (data.success) {
        set((state) => ({
          tasks: { ...state.tasks, [workbenchId]: data.tasks ?? [] },
          loading: false,
        }));
      } else {
        set({ error: data.error ?? 'Failed to load tasks', loading: false });
      }
    } catch {
      set({ error: 'Failed to load scheduled tasks', loading: false });
    }
  },

  loadRuns: async (workbenchId: WorkbenchId, taskId: string) => {
    try {
      const res = await fetch(`/api/scheduled-tasks/${workbenchId}/${taskId}/runs`);
      const data = await res.json();
      if (data.success) {
        set((state) => ({
          runs: { ...state.runs, [taskId]: data.runs ?? [] },
        }));
      }
    } catch {
      console.error('[scheduleStore] Failed to load runs for task', taskId);
    }
  },

  createTask: async (workbenchId, data) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/scheduled-tasks/${workbenchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success && result.task) {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [workbenchId]: [result.task, ...(state.tasks[workbenchId] ?? [])],
          },
          loading: false,
        }));
      } else {
        set({ error: result.error ?? 'Failed to create task', loading: false });
      }
    } catch {
      set({ error: 'Failed to create task', loading: false });
    }
  },

  updateTask: async (workbenchId, taskId, updates) => {
    try {
      const res = await fetch(`/api/scheduled-tasks/${workbenchId}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await res.json();
      if (result.success && result.task) {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [workbenchId]: (state.tasks[workbenchId] ?? []).map((t) =>
              t.id === taskId ? result.task : t
            ),
          },
        }));
      }
    } catch {
      console.error('[scheduleStore] Failed to update task', taskId);
    }
  },

  deleteTask: async (workbenchId, taskId) => {
    try {
      const res = await fetch(`/api/scheduled-tasks/${workbenchId}/${taskId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [workbenchId]: (state.tasks[workbenchId] ?? []).filter((t) => t.id !== taskId),
          },
        }));
      }
    } catch {
      console.error('[scheduleStore] Failed to delete task', taskId);
    }
  },

  runNow: async (workbenchId, taskId) => {
    try {
      const res = await fetch(`/api/scheduled-tasks/${workbenchId}/${taskId}/run`, {
        method: 'POST',
      });
      const result = await res.json();
      if (result.success && result.run) {
        // Update task's lastStatus and lastRun in local state
        set((state) => ({
          tasks: {
            ...state.tasks,
            [workbenchId]: (state.tasks[workbenchId] ?? []).map((t) =>
              t.id === taskId
                ? { ...t, lastStatus: result.run.status, lastRun: result.run.finishedAt }
                : t
            ),
          },
          // Prepend run to local history
          runs: {
            ...state.runs,
            [taskId]: [result.run, ...(state.runs[taskId] ?? [])].slice(0, 10),
          },
        }));
        return result.run as TaskRun;
      }
      return null;
    } catch {
      console.error('[scheduleStore] Failed to run task', taskId);
      return null;
    }
  },

  getTasksByWorkbench: (workbenchId) => {
    return get().tasks[workbenchId] ?? [];
  },
}));
