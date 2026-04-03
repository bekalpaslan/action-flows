import { create } from 'zustand';
import type { WorkbenchId } from '../lib/types';
import type { AutonomyLevel } from '@afw/shared';
import { DEFAULT_AUTONOMY_LEVELS } from '@afw/shared';

interface ValidationStoreState {
  /** Per-workbench autonomy levels */
  autonomyLevels: Map<WorkbenchId, AutonomyLevel>;

  /** Set autonomy level for a workbench */
  setAutonomyLevel: (id: WorkbenchId, level: AutonomyLevel) => void;

  /** Get autonomy level for a workbench (defaults from shared constants) */
  getAutonomyLevel: (id: WorkbenchId) => AutonomyLevel;
}

/** Initialize autonomy levels from shared defaults */
function createDefaultAutonomyLevels(): Map<WorkbenchId, AutonomyLevel> {
  const map = new Map<WorkbenchId, AutonomyLevel>();
  for (const [key, value] of Object.entries(DEFAULT_AUTONOMY_LEVELS)) {
    map.set(key as WorkbenchId, value);
  }
  return map;
}

export const useValidationStore = create<ValidationStoreState>((set, get) => ({
  autonomyLevels: createDefaultAutonomyLevels(),

  setAutonomyLevel: (id, level) =>
    set((state) => {
      const next = new Map(state.autonomyLevels);
      next.set(id, level);
      return { autonomyLevels: next };
    }),

  getAutonomyLevel: (id) => {
    return get().autonomyLevels.get(id) ?? (DEFAULT_AUTONOMY_LEVELS[id] as AutonomyLevel | undefined) ?? 'supervised';
  },
}));
