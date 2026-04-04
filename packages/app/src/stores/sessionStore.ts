import { create } from 'zustand';
import type { WorkbenchId } from '../lib/types';

export type SessionStatus = 'stopped' | 'connecting' | 'idle' | 'running' | 'suspended' | 'error';

export interface WorkbenchSession {
  workbenchId: WorkbenchId;
  sessionId: string | null;
  status: SessionStatus;
  startedAt: string | null;
  lastActivity: string | null;
  error: string | null;
}

interface SessionState {
  sessions: Map<WorkbenchId, WorkbenchSession>;

  /** Update a single workbench session (merge partial) */
  updateSession: (id: WorkbenchId, update: Partial<WorkbenchSession>) => void;

  /** Set status shorthand */
  setStatus: (id: WorkbenchId, status: SessionStatus) => void;

  /** Get a session (returns default 'stopped' if not yet created) */
  getSession: (id: WorkbenchId) => WorkbenchSession;

  /** Status panel collapsed state (per D-04) */
  statusPanelCollapsed: boolean;
  setStatusPanelCollapsed: (collapsed: boolean) => void;
  toggleStatusPanel: () => void;

  /** Count sessions by status */
  getRunningCount: () => number;
  getActiveCount: () => number;
}

function defaultSession(workbenchId: WorkbenchId): WorkbenchSession {
  return {
    workbenchId,
    sessionId: null,
    status: 'stopped',
    startedAt: null,
    lastActivity: null,
    error: null,
  };
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: new Map(),

  updateSession: (id, update) =>
    set((state) => {
      const next = new Map(state.sessions);
      const existing = next.get(id) ?? defaultSession(id);
      next.set(id, { ...existing, ...update });
      return { sessions: next };
    }),

  setStatus: (id, status) =>
    set((state) => {
      const next = new Map(state.sessions);
      const existing = next.get(id) ?? defaultSession(id);
      next.set(id, {
        ...existing,
        status,
        error: status !== 'error' ? null : existing.error,
      });
      return { sessions: next };
    }),

  getSession: (id) => {
    return get().sessions.get(id) ?? defaultSession(id);
  },

  statusPanelCollapsed: true,
  setStatusPanelCollapsed: (collapsed) => set({ statusPanelCollapsed: collapsed }),
  toggleStatusPanel: () => set((s) => ({ statusPanelCollapsed: !s.statusPanelCollapsed })),

  getRunningCount: () => {
    let count = 0;
    for (const s of get().sessions.values()) {
      if (s.status === 'running') count++;
    }
    return count;
  },

  getActiveCount: () => {
    let count = 0;
    for (const s of get().sessions.values()) {
      if (s.status === 'running' || s.status === 'idle' || s.status === 'connecting') count++;
    }
    return count;
  },
}));
