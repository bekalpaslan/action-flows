import { useEffect } from 'react';
import type { WorkbenchId } from '@/lib/types';
import { useUIStore } from '@/stores/uiStore';
import { panelHandles } from '@/workbenches/shell/AppShell';

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts() {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const setActiveWorkbench = useUIStore((s) => s.setActiveWorkbench);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+K: toggle command palette
      if (mod && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Ctrl+B: toggle sidebar (imperative panel handle)
      if (mod && e.key === 'b') {
        e.preventDefault();
        const panel = panelHandles.sidebar;
        if (panel) {
          if (panel.isCollapsed()) {
            panel.expand();
          } else {
            panel.collapse();
          }
        }
        return;
      }

      // Number keys 1-7: switch workbench (only when no input focused and palette closed)
      if (!mod && !e.altKey && !e.shiftKey && e.key >= '1' && e.key <= '7') {
        if (isInputFocused() || commandPaletteOpen) return;
        const workbenches: WorkbenchId[] = [
          'work',
          'explore',
          'review',
          'pm',
          'settings',
          'archive',
          'studio',
        ];
        const index = parseInt(e.key, 10) - 1;
        if (index >= 0 && index < workbenches.length) {
          setActiveWorkbench(workbenches[index]);
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette, commandPaletteOpen, setActiveWorkbench]);
}
