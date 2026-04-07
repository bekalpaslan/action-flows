import { create } from 'zustand';
import type { WorkbenchId } from '@/lib/types';
import type { ViolationSignal, AutonomyLevel as SharedAutonomyLevel } from '@afw/shared';
import { DEFAULT_AUTONOMY_LEVELS } from '@afw/shared';

export type AutonomyLevel = SharedAutonomyLevel;

interface ValidationStoreState {
  violations: Map<WorkbenchId, ViolationSignal[]>;
  autonomyLevels: Map<WorkbenchId, SharedAutonomyLevel>;
  addViolation: (workbenchId: WorkbenchId, violation: ViolationSignal) => void;
  resolveViolation: (workbenchId: WorkbenchId, violationId: string) => void;
  clearViolations: (workbenchId: WorkbenchId) => void;
  setAutonomyLevel: (workbenchId: WorkbenchId, level: SharedAutonomyLevel) => void;
  getAutonomyLevel: (workbenchId: WorkbenchId) => SharedAutonomyLevel;
}

/** Initialize autonomy levels from shared defaults */
function buildDefaultAutonomyLevels(): Map<WorkbenchId, SharedAutonomyLevel> {
  const map = new Map<WorkbenchId, SharedAutonomyLevel>();
  for (const [key, value] of Object.entries(DEFAULT_AUTONOMY_LEVELS)) {
    map.set(key as WorkbenchId, value);
  }
  return map;
}

export const useValidationStore = create<ValidationStoreState>((set, get) => ({
  violations: new Map(),
  autonomyLevels: buildDefaultAutonomyLevels(),

  addViolation: (workbenchId, violation) =>
    set((state) => {
      const next = new Map(state.violations);
      const existing = next.get(workbenchId) ?? [];
      next.set(workbenchId, [...existing, violation]);
      return { violations: next };
    }),

  resolveViolation: (workbenchId, violationId) =>
    set((state) => {
      const existing = state.violations.get(workbenchId);
      if (!existing) return state;

      const next = new Map(state.violations);
      next.set(
        workbenchId,
        existing.map((v) =>
          v.id === violationId ? { ...v, resolved: true } : v
        )
      );
      return { violations: next };
    }),

  clearViolations: (workbenchId) =>
    set((state) => {
      const next = new Map(state.violations);
      next.set(workbenchId, []);
      return { violations: next };
    }),

  setAutonomyLevel: (workbenchId, level) =>
    set((state) => {
      const next = new Map(state.autonomyLevels);
      next.set(workbenchId, level);
      return { autonomyLevels: next };
    }),

  getAutonomyLevel: (workbenchId) => {
    return get().autonomyLevels.get(workbenchId) ?? 'supervised';
  },
}));
