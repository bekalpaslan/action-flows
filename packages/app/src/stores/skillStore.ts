/**
 * Skill Store — zustand state management with persist middleware
 * for per-workbench skills CRUD.
 *
 * Uses Record<string, Skill[]> (not Map) for JSON serialization
 * compatibility with the persist middleware (RESEARCH.md Pitfall 6).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Skill } from '@afw/shared';
import type { WorkbenchId } from '@/lib/types';

interface SkillState {
  /** Skills indexed by workbenchId */
  skills: Record<string, Skill[]>;
  loading: boolean;
  error: string | null;

  /** Load skills from backend for a specific workbench */
  loadSkills: (workbenchId: WorkbenchId) => Promise<void>;

  /** Create a new skill via POST /api/skills/:workbenchId */
  addSkill: (
    workbenchId: WorkbenchId,
    skill: { name: string; description: string; trigger: string; action: string }
  ) => Promise<void>;

  /** Update an existing skill via PUT /api/skills/:workbenchId/:skillId */
  updateSkill: (
    workbenchId: WorkbenchId,
    skillId: string,
    updates: Partial<{ name: string; description: string; trigger: string; action: string }>
  ) => Promise<void>;

  /** Delete a skill via DELETE /api/skills/:workbenchId/:skillId */
  deleteSkill: (workbenchId: WorkbenchId, skillId: string) => Promise<void>;

  /** Get skills for a workbench (returns empty array if none) */
  getSkillsByWorkbench: (workbenchId: WorkbenchId) => Skill[];
}

export const useSkillStore = create<SkillState>()(
  persist(
    (set, get) => ({
      skills: {},
      loading: false,
      error: null,

      loadSkills: async (workbenchId: WorkbenchId) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`/api/skills/${workbenchId}`);
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              skills: { ...state.skills, [workbenchId]: data.skills ?? [] },
              loading: false,
            }));
          } else {
            set({ error: data.error ?? 'Failed to load skills', loading: false });
          }
        } catch {
          set({ error: 'Failed to load skills', loading: false });
        }
      },

      addSkill: async (workbenchId, skill) => {
        // Optimistic update: prepend a placeholder
        const optimisticSkill: Skill = {
          id: `temp-${Date.now()}` as unknown as Skill['id'],
          workbenchId,
          name: skill.name,
          description: skill.description,
          trigger: skill.trigger,
          action: skill.action,
          createdAt: new Date().toISOString(),
        };
        const prevSkills = get().skills[workbenchId] ?? [];

        set((state) => ({
          skills: {
            ...state.skills,
            [workbenchId]: [optimisticSkill, ...prevSkills],
          },
          error: null,
        }));

        try {
          const res = await fetch(`/api/skills/${workbenchId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(skill),
          });
          const data = await res.json();
          if (data.success && data.skill) {
            // Replace optimistic placeholder with real skill
            set((state) => ({
              skills: {
                ...state.skills,
                [workbenchId]: [
                  data.skill,
                  ...(state.skills[workbenchId] ?? []).filter(
                    (s: Skill) => s.id !== optimisticSkill.id
                  ),
                ],
              },
            }));
          } else {
            // Revert optimistic update
            set((state) => ({
              skills: { ...state.skills, [workbenchId]: prevSkills },
              error: data.error ?? 'Failed to create skill',
            }));
          }
        } catch {
          // Revert optimistic update
          set((state) => ({
            skills: { ...state.skills, [workbenchId]: prevSkills },
            error: 'Failed to create skill',
          }));
        }
      },

      updateSkill: async (workbenchId, skillId, updates) => {
        set({ error: null });
        try {
          const res = await fetch(`/api/skills/${workbenchId}/${skillId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          const data = await res.json();
          if (data.success && data.skill) {
            set((state) => ({
              skills: {
                ...state.skills,
                [workbenchId]: (state.skills[workbenchId] ?? []).map((s: Skill) =>
                  s.id === skillId ? data.skill : s
                ),
              },
            }));
          } else {
            set({ error: data.error ?? 'Failed to update skill' });
          }
        } catch {
          set({ error: 'Failed to update skill' });
        }
      },

      deleteSkill: async (workbenchId, skillId) => {
        set({ error: null });
        try {
          const res = await fetch(`/api/skills/${workbenchId}/${skillId}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              skills: {
                ...state.skills,
                [workbenchId]: (state.skills[workbenchId] ?? []).filter(
                  (s: Skill) => s.id !== skillId
                ),
              },
            }));
          } else {
            set({ error: data.error ?? 'Failed to delete skill' });
          }
        } catch {
          set({ error: 'Failed to delete skill' });
        }
      },

      getSkillsByWorkbench: (workbenchId) => {
        return get().skills[workbenchId] ?? [];
      },
    }),
    {
      name: 'afw-skills',
    }
  )
);
