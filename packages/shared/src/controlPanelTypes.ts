/**
 * Control Panel Types
 * Types for the interactive control panel with quick commands and flow pickers
 */

/**
 * Quick command action types (discriminated union)
 */
export type QuickCommandAction =
  | { type: 'send-input'; value: string }
  | { type: 'trigger-flow'; flowId: string }
  | { type: 'execute-action'; actionId: string }
  | { type: 'toggle-panel'; panel: string }
  | { type: 'custom'; handler: string };

/**
 * Quick command button definition
 */
export interface QuickCommand {
  id: string;
  label: string;
  icon?: string; // emoji or icon name
  shortcut?: string; // e.g., "Ctrl+Enter"
  action: QuickCommandAction;
  frequency?: number; // usage count for ordering
  enabled?: boolean;
}

/**
 * Flow or action item for the flow picker
 */
export interface FlowAction {
  id: string;
  name: string;
  description?: string;
  category: 'flow' | 'action' | 'recent';
  icon?: string;
}

/**
 * Control panel configuration
 */
export interface ControlPanelConfig {
  quickCommands: QuickCommand[];
  showFlowPicker: boolean;
  inputPlaceholder: string;
  maxQuickCommands: number; // default 8
}

/**
 * Default quick commands for common operations
 */
export const DEFAULT_QUICK_COMMANDS: QuickCommand[] = [
  {
    id: 'approve',
    label: 'Approve',
    icon: '✓',
    action: { type: 'send-input', value: 'yes' },
    enabled: true,
  },
  {
    id: 'reject',
    label: 'Reject',
    icon: '✗',
    action: { type: 'send-input', value: 'no' },
    enabled: true,
  },
  {
    id: 'pause',
    label: 'Pause',
    icon: '⏸',
    action: { type: 'execute-action', actionId: 'pause' },
    enabled: true,
  },
  {
    id: 'resume',
    label: 'Resume',
    icon: '▶',
    action: { type: 'execute-action', actionId: 'resume' },
    enabled: true,
  },
];

/**
 * Default control panel configuration
 */
export const DEFAULT_CONTROL_PANEL_CONFIG: ControlPanelConfig = {
  quickCommands: DEFAULT_QUICK_COMMANDS,
  showFlowPicker: true,
  inputPlaceholder: 'Type a command or select a quick action...',
  maxQuickCommands: 8,
};
