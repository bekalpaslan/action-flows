/**
 * Healing Store — zustand state for self-healing pipeline.
 *
 * Manages healing quotas, attempt history, and pending approval state.
 * No persist: re-fetches from backend on mount.
 */

import { create } from 'zustand';
import type { HealingQuota, HealingAttempt } from '@afw/shared';

interface HealingState {
  /** Quota per workbench-flow pair (key: `${workbenchId}:${flowId}`) */
  quotas: Record<string, HealingQuota>;
  /** Recent healing attempts */
  attempts: HealingAttempt[];
  /** Approval ID for the currently pending healing approval (shown in chat) */
  pendingApprovalId: string | null;
  /** Full attempt object for the pending approval */
  pendingAttempt: HealingAttempt | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;

  /** Load quota for a specific workbench-flow pair from backend */
  loadQuota: (workbenchId: string, flowId: string) => Promise<void>;
  /** Load healing history from backend */
  loadHistory: () => Promise<void>;
  /** Resolve a pending approval (approve or decline) */
  resolveApproval: (approvalId: string, decision: 'approved' | 'declined') => Promise<void>;
  /** Set a pending approval from the healing watcher */
  addPendingApproval: (attempt: HealingAttempt, approvalId: string) => void;
  /** Clear pending approval state */
  clearPendingApproval: () => void;
  /** Get quota for a specific workbench-flow pair (from cache) */
  getQuota: (workbenchId: string, flowId: string) => HealingQuota | null;
  /** Count of active circuit breakers (quotas exhausted) */
  getActiveCircuitBreakerCount: () => number;
  /** Success rate of resolved healing attempts */
  getSuccessRate: () => number;
}

export const useHealingStore = create<HealingState>((set, get) => ({
  quotas: {},
  attempts: [],
  pendingApprovalId: null,
  pendingAttempt: null,
  loading: false,
  error: null,

  loadQuota: async (workbenchId: string, flowId: string) => {
    try {
      const res = await fetch(`/api/healing/quota/${workbenchId}/${flowId}`);
      const data = await res.json();
      if (data.success) {
        const key = `${workbenchId}:${flowId}`;
        set((state) => ({
          quotas: { ...state.quotas, [key]: data.quota },
        }));
      }
    } catch (err) {
      console.error('[healingStore] Failed to load quota:', err);
    }
  },

  loadHistory: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/healing/history?limit=50');
      const data = await res.json();
      if (data.success) {
        set({ attempts: data.attempts ?? [], loading: false });
      } else {
        set({ error: 'Failed to load healing history', loading: false });
      }
    } catch {
      set({ error: 'Failed to load healing history', loading: false });
    }
  },

  resolveApproval: async (approvalId: string, decision: 'approved' | 'declined') => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/healing/resolve/${approvalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (data.success) {
        set({ pendingApprovalId: null, pendingAttempt: null, loading: false });
        // Reload history to show resolved attempt
        get().loadHistory();
      } else {
        set({ error: data.error ?? 'Failed to resolve approval', loading: false });
      }
    } catch {
      set({ error: 'Failed to resolve approval', loading: false });
    }
  },

  addPendingApproval: (attempt: HealingAttempt, approvalId: string) => {
    set({ pendingApprovalId: approvalId, pendingAttempt: attempt });
  },

  clearPendingApproval: () => {
    set({ pendingApprovalId: null, pendingAttempt: null });
  },

  getQuota: (workbenchId: string, flowId: string) => {
    const key = `${workbenchId}:${flowId}`;
    return get().quotas[key] ?? null;
  },

  getActiveCircuitBreakerCount: () => {
    const { quotas } = get();
    return Object.values(quotas).filter(
      (q) => q.attemptsUsed >= q.maxAttempts
    ).length;
  },

  getSuccessRate: () => {
    const { attempts } = get();
    const resolved = attempts.filter(
      (a) => a.status === 'succeeded' || a.status === 'failed' || a.status === 'approved'
    );
    if (resolved.length === 0) return 0;
    const succeeded = resolved.filter(
      (a) => a.status === 'succeeded' || a.status === 'approved'
    ).length;
    return Math.round((succeeded / resolved.length) * 100);
  },
}));
