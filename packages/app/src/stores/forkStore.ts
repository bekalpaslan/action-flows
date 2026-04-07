/**
 * Fork Store — zustand state management for session fork metadata.
 *
 * No persist — forks are ephemeral session data, re-fetched from backend.
 * Tracks per-session forks, active branch, and forkUnavailable degradation flag.
 */
import { create } from 'zustand';
import type { ForkMetadata, ForkId, MergeResolution } from '@afw/shared';

interface ForkState {
  /** Forks indexed by parent session ID */
  forksByParent: Record<string, ForkMetadata[]>;

  /** Active branch per parent session (parentSessionId -> active sessionId) */
  activeBranchBySession: Record<string, string>;

  /** Loading state */
  loading: boolean;

  /** Error message */
  error: string | null;

  /** True when backend returns 503 FORK_SESSION_UNAVAILABLE — Phase 6 not available */
  forkUnavailable: boolean;

  /** Fetch forks for a parent session from backend */
  loadForks: (parentSessionId: string) => Promise<void>;

  /** Create a new fork. Returns null on failure. */
  createFork: (
    parentSessionId: string,
    workbenchId: string,
    description: string,
    forkPointMessageId?: string,
  ) => Promise<ForkMetadata | null>;

  /** Switch the active branch for a parent session */
  switchBranch: (parentSessionId: string, targetSessionId: string) => void;

  /** Merge a fork back to parent */
  mergeFork: (forkId: string, resolution: MergeResolution, manualContent?: string) => Promise<void>;

  /** Discard a fork */
  discardFork: (forkId: string) => Promise<void>;

  /** Rename a fork */
  renameFork: (forkId: string, description: string) => Promise<void>;

  /** Get forks for a session (non-reactive selector helper) */
  getForksForSession: (parentSessionId: string) => ForkMetadata[];

  /** Get the active branch session ID for a parent session */
  getActiveBranch: (parentSessionId: string) => string;

  /** Check if a message is a fork point */
  isForkPoint: (parentSessionId: string, messageId: string) => boolean;
}

export const useForkStore = create<ForkState>((set, get) => ({
  forksByParent: {},
  activeBranchBySession: {},
  loading: false,
  error: null,
  forkUnavailable: false,

  loadForks: async (parentSessionId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/forks/${parentSessionId}`);
      const data = await res.json();
      if (data.success) {
        set((state) => ({
          forksByParent: {
            ...state.forksByParent,
            [parentSessionId]: data.forks ?? [],
          },
          loading: false,
        }));
      } else {
        set({ error: data.error ?? 'Failed to load forks', loading: false });
      }
    } catch {
      set({ error: 'Failed to load forks', loading: false });
    }
  },

  createFork: async (parentSessionId, workbenchId, description, forkPointMessageId) => {
    set({ loading: true, error: null, forkUnavailable: false });
    try {
      const res = await fetch('/api/forks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentSessionId, workbenchId, description, forkPointMessageId }),
      });
      const data = await res.json();

      if (res.status === 503 && data.code === 'FORK_SESSION_UNAVAILABLE') {
        set({
          forkUnavailable: true,
          error: data.error,
          loading: false,
        });
        return null;
      }

      if (!res.ok || !data.success) {
        set({ error: data.error ?? 'Failed to create fork', loading: false });
        return null;
      }

      const fork = data.fork as ForkMetadata;
      set((state) => ({
        forksByParent: {
          ...state.forksByParent,
          [parentSessionId]: [...(state.forksByParent[parentSessionId] ?? []), fork],
        },
        activeBranchBySession: {
          ...state.activeBranchBySession,
          [parentSessionId]: fork.forkSessionId,
        },
        loading: false,
      }));
      return fork;
    } catch {
      set({ error: 'Failed to create fork', loading: false });
      return null;
    }
  },

  switchBranch: (parentSessionId, targetSessionId) => {
    set((state) => ({
      activeBranchBySession: {
        ...state.activeBranchBySession,
        [parentSessionId]: targetSessionId,
      },
    }));
  },

  mergeFork: async (forkId, resolution, manualContent) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/forks/${forkId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, manualContent }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        set({ error: data.error ?? 'Failed to merge fork', loading: false });
        return;
      }

      const mergedFork = data.fork as ForkMetadata;

      // Update fork status in local state and switch back to main
      set((state) => {
        const parentId = mergedFork.parentSessionId;
        const forks = (state.forksByParent[parentId] ?? []).map((f) =>
          f.id === mergedFork.id ? mergedFork : f,
        );
        return {
          forksByParent: {
            ...state.forksByParent,
            [parentId]: forks,
          },
          activeBranchBySession: {
            ...state.activeBranchBySession,
            [parentId]: parentId, // Switch back to main
          },
          loading: false,
        };
      });
    } catch {
      set({ error: 'Failed to merge fork', loading: false });
    }
  },

  discardFork: async (forkId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/forks/${forkId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        set({ error: data.error ?? 'Failed to discard fork', loading: false });
        return;
      }

      // Remove from local state and switch to main if this was the active branch
      set((state) => {
        let parentId: string | null = null;
        const nextForksByParent = { ...state.forksByParent };

        for (const [pid, forks] of Object.entries(nextForksByParent)) {
          const idx = forks.findIndex((f) => f.id === forkId);
          if (idx !== -1) {
            parentId = pid;
            nextForksByParent[pid] = forks.filter((f) => f.id !== forkId);
            break;
          }
        }

        const nextActive = { ...state.activeBranchBySession };
        if (parentId) {
          // Find the discarded fork to check if it was active
          const wasFork = state.forksByParent[parentId]?.find((f) => f.id === forkId);
          if (wasFork && nextActive[parentId] === wasFork.forkSessionId) {
            nextActive[parentId] = parentId; // Switch back to main
          }
        }

        return {
          forksByParent: nextForksByParent,
          activeBranchBySession: nextActive,
          loading: false,
        };
      });
    } catch {
      set({ error: 'Failed to discard fork', loading: false });
    }
  },

  renameFork: async (forkId, description) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/forks/${forkId}/description`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        set({ error: data.error ?? 'Failed to rename fork' });
        return;
      }

      const updatedFork = data.fork as ForkMetadata;
      set((state) => {
        const parentId = updatedFork.parentSessionId;
        const forks = (state.forksByParent[parentId] ?? []).map((f) =>
          f.id === updatedFork.id ? updatedFork : f,
        );
        return {
          forksByParent: {
            ...state.forksByParent,
            [parentId]: forks,
          },
        };
      });
    } catch {
      set({ error: 'Failed to rename fork' });
    }
  },

  getForksForSession: (parentSessionId) => {
    return get().forksByParent[parentSessionId] ?? [];
  },

  getActiveBranch: (parentSessionId) => {
    return get().activeBranchBySession[parentSessionId] ?? parentSessionId;
  },

  isForkPoint: (parentSessionId, messageId) => {
    const forks = get().forksByParent[parentSessionId] ?? [];
    return forks.some((f) => f.forkPointMessageId === messageId);
  },
}));
