import { create } from 'zustand';
import type { WorkbenchId } from '../lib/types';

interface UIState {
  activeWorkbench: WorkbenchId;
  setActiveWorkbench: (id: WorkbenchId) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeWorkbench: 'work',
  setActiveWorkbench: (id) => set({ activeWorkbench: id }),
}));
