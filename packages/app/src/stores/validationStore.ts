import { create } from 'zustand';
import type { WorkbenchId } from '@/lib/types';

export type AutonomyLevel = 'full' | 'supervised' | 'manual';

interface ValidationState {
  autonomyLevels: Map<WorkbenchId, AutonomyLevel>;
  setAutonomyLevel: (workbenchId: WorkbenchId, level: AutonomyLevel) => void;
}

export const useValidationStore = create<ValidationState>((set) => ({
  autonomyLevels: new Map<WorkbenchId, AutonomyLevel>([
    ['work', 'supervised'],
    ['explore', 'supervised'],
    ['review', 'supervised'],
    ['pm', 'supervised'],
    ['settings', 'manual'],
    ['archive', 'manual'],
    ['studio', 'full'],
  ]),
  setAutonomyLevel: (workbenchId, level) =>
    set((state) => {
      const next = new Map(state.autonomyLevels);
      next.set(workbenchId, level);
      return { autonomyLevels: next };
    }),
}));
