/**
 * Flow Store — zustand state management for flow data.
 * Fetches flows from GET /api/flows, provides context-based filtering,
 * and maps legacy categories to current workbench IDs (FLOW-02).
 */

import { create } from 'zustand';

export interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  chainTemplate?: string;
  usageCount: number;
}

/** Legacy category to current workbench mapping (FLOW-02: archived flows preserved and harvestable) */
const CATEGORY_MAP: Record<string, string> = {
  maintenance: 'work',
  intel: 'explore',
  respect: 'work',
};

/** Normalize legacy categories to current workbench IDs */
function normalizeCategory(category: string): string {
  return CATEGORY_MAP[category] ?? category;
}

interface FlowState {
  flows: FlowDefinition[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  categoryFilter: string | null;

  /** Fetch all flows from backend */
  loadFlows: () => Promise<void>;

  /** Get flows for a specific workbench context (handles legacy category mapping) */
  getFlowsByContext: (context: string) => FlowDefinition[];

  /** Update search query for filtering */
  setSearchQuery: (query: string) => void;

  /** Update category filter */
  setCategoryFilter: (category: string | null) => void;

  /** Add a new flow via POST /api/flows */
  addFlow: (flow: Omit<FlowDefinition, 'id' | 'usageCount'>) => Promise<void>;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  flows: [],
  loading: false,
  error: null,
  searchQuery: '',
  categoryFilter: null,

  loadFlows: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/flows');
      const data = await res.json();
      if (data.success) {
        set({ flows: data.flows ?? [], loading: false });
      } else {
        set({ error: 'Failed to load flows', loading: false });
      }
    } catch {
      set({ error: 'Failed to load flows', loading: false });
    }
  },

  getFlowsByContext: (context: string) => {
    const { flows, searchQuery, categoryFilter } = get();
    let filtered = flows.filter(
      (f) => normalizeCategory(f.category) === context
    );
    if (categoryFilter) {
      filtered = filtered.filter((f) => f.category === categoryFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setCategoryFilter: (category: string | null) => set({ categoryFilter: category }),

  addFlow: async (flow) => {
    const id = flow.name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...flow, id, tags: flow.tags ?? [], usageCount: 0 }),
      });
      if (res.ok) {
        get().loadFlows();
      }
    } catch {
      console.error('[flowStore] Failed to add flow');
    }
  },
}));
