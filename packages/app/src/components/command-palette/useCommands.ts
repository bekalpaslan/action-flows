import type { LucideIcon } from 'lucide-react';
import { PanelLeftClose, PanelRightClose, PanelTopClose } from 'lucide-react';
import { WORKBENCHES } from '@/lib/types';
import { useUIStore } from '@/stores/uiStore';

export interface CommandItem {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
  group: 'navigation' | 'actions';
}

export function useCommands(): CommandItem[] {
  const setActiveWorkbench = useUIStore((s) => s.setActiveWorkbench);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleChat = useUIStore((s) => s.toggleChat);
  const togglePipeline = useUIStore((s) => s.togglePipeline);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

  const navigation: CommandItem[] = WORKBENCHES.map((wb, i) => ({
    id: `nav-${wb.id}`,
    label: wb.label,
    icon: wb.icon,
    shortcut: String(i + 1),
    action: () => {
      setActiveWorkbench(wb.id);
      setCommandPaletteOpen(false);
    },
    group: 'navigation' as const,
  }));

  const actions: CommandItem[] = [
    {
      id: 'toggle-sidebar',
      label: 'Toggle sidebar',
      icon: PanelLeftClose,
      action: () => {
        toggleSidebar();
        setCommandPaletteOpen(false);
      },
      group: 'actions' as const,
    },
    {
      id: 'toggle-chat',
      label: 'Toggle chat panel',
      icon: PanelRightClose,
      action: () => {
        toggleChat();
        setCommandPaletteOpen(false);
      },
      group: 'actions' as const,
    },
    {
      id: 'toggle-pipeline',
      label: 'Toggle pipeline',
      icon: PanelTopClose,
      action: () => {
        togglePipeline();
        setCommandPaletteOpen(false);
      },
      group: 'actions' as const,
    },
  ];

  return [...navigation, ...actions];
}
