import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomWorkbench } from '@afw/shared';

interface CustomWorkbenchState {
  /** Flat array of custom workbenches (no Map to avoid serialization issues) */
  workbenches: CustomWorkbench[];
  loading: boolean;
  error: string | null;

  /** Fetch custom workbenches from backend */
  loadWorkbenches: () => Promise<void>;

  /** Create a new custom workbench */
  createWorkbench: (data: {
    name: string;
    iconName: string;
    greeting: string;
    tone: string;
    systemPromptSnippet: string;
  }) => Promise<CustomWorkbench | null>;

  /** Update an existing custom workbench */
  updateWorkbench: (id: string, updates: Partial<CustomWorkbench>) => Promise<void>;

  /** Delete a custom workbench */
  deleteWorkbench: (id: string) => Promise<void>;

  /** Get a workbench by ID */
  getWorkbenchById: (id: string) => CustomWorkbench | undefined;
}

export const useCustomWorkbenchStore = create<CustomWorkbenchState>()(
  persist(
    (set, get) => ({
      workbenches: [],
      loading: false,
      error: null,

      loadWorkbenches: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch('/api/custom-workbenches');
          if (!res.ok) throw new Error('Failed to load custom workbenches');
          const data = await res.json();
          set({ workbenches: data.workbenches ?? [], loading: false });
        } catch (err) {
          console.error('[CustomWorkbenchStore] Load error:', err);
          set({ loading: false, error: 'Failed to load custom workbenches' });
        }
      },

      createWorkbench: async (data) => {
        set({ error: null });
        try {
          const res = await fetch('/api/custom-workbenches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (res.status === 409) {
            set({ error: 'A workbench with this name already exists.' });
            return null;
          }

          if (!res.ok) throw new Error('Failed to create workbench');

          const json = await res.json();
          const created = json.workbench as CustomWorkbench;

          set((state) => ({
            workbenches: [...state.workbenches, created],
          }));

          return created;
        } catch (err) {
          console.error('[CustomWorkbenchStore] Create error:', err);
          set({ error: 'Failed to create workbench' });
          return null;
        }
      },

      updateWorkbench: async (id, updates) => {
        set({ error: null });
        try {
          const res = await fetch(`/api/custom-workbenches/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });

          if (res.status === 409) {
            set({ error: 'A workbench with this name already exists.' });
            return;
          }

          if (!res.ok) throw new Error('Failed to update workbench');

          const json = await res.json();
          const updated = json.workbench as CustomWorkbench;

          set((state) => ({
            workbenches: state.workbenches.map((wb) =>
              wb.id === id ? updated : wb
            ),
          }));
        } catch (err) {
          console.error('[CustomWorkbenchStore] Update error:', err);
          set({ error: 'Failed to update workbench' });
        }
      },

      deleteWorkbench: async (id) => {
        set({ error: null });
        try {
          const res = await fetch(`/api/custom-workbenches/${id}`, {
            method: 'DELETE',
          });

          if (!res.ok) throw new Error('Failed to delete workbench');

          set((state) => ({
            workbenches: state.workbenches.filter((wb) => wb.id !== id),
          }));
        } catch (err) {
          console.error('[CustomWorkbenchStore] Delete error:', err);
          set({ error: 'Failed to delete workbench' });
        }
      },

      getWorkbenchById: (id) => {
        return get().workbenches.find((wb) => wb.id === id);
      },
    }),
    {
      name: 'afw-custom-workbenches',
      partialize: (state) => ({ workbenches: state.workbenches }),
    }
  )
);
