import { describe, it, expect } from 'vitest';
import { useUIStore } from './uiStore';

describe('uiStore', () => {
  // TODO: Test panel collapse/expand state, toggles, setters (LAYOUT-04)
  it('should have default state values', () => {
    const state = useUIStore.getState();
    expect(state.sidebarCollapsed).toBe(false);
    expect(state.chatCollapsed).toBe(false);
    expect(state.pipelineCollapsed).toBe(false);
    expect(state.commandPaletteOpen).toBe(false);
  });
});
