import { create } from 'zustand';
import type { WorkbenchId } from '../lib/types';

interface UIState {
  // Existing (Phase 2)
  activeWorkbench: WorkbenchId;
  setActiveWorkbench: (id: WorkbenchId) => void;

  // Phase 4: Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Phase 4: Chat panel
  chatCollapsed: boolean;
  setChatCollapsed: (collapsed: boolean) => void;
  toggleChat: () => void;

  // Phase 4: Pipeline
  pipelineCollapsed: boolean;
  setPipelineCollapsed: (collapsed: boolean) => void;
  togglePipeline: () => void;

  // Phase 4: Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeWorkbench: 'work',
  setActiveWorkbench: (id) => set({ activeWorkbench: id }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  chatCollapsed: false,
  setChatCollapsed: (collapsed) => set({ chatCollapsed: collapsed }),
  toggleChat: () => set((s) => ({ chatCollapsed: !s.chatCollapsed })),

  pipelineCollapsed: false,
  setPipelineCollapsed: (collapsed) => set({ pipelineCollapsed: collapsed }),
  togglePipeline: () => set((s) => ({ pipelineCollapsed: !s.pipelineCollapsed })),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
}));
