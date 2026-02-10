/**
 * Button System Types
 * Comprehensive types for the ActionFlows Dashboard button and toolbar system
 * Supports dynamic button registration, context-aware display, and learning-based organization
 */

import type { LayerSource, BehaviorPackId } from './selfEvolvingTypes.js';
import type { Timestamp } from './types.js';
import type { CommandTypeString } from './commands.js';

/**
 * ButtonId - Branded type for button identifiers
 */
export type ButtonId = string & { readonly __brand: 'ButtonId' };

/**
 * Action types a button can trigger
 */
export type ButtonActionType =
  | 'command'        // Maps to existing Command system (pause, resume, retry, etc.)
  | 'api-call'       // Arbitrary API call (POST/GET with payload)
  | 'quick-action'   // Maps to existing QuickActionDefinition
  | 'clipboard'      // Copy content to clipboard
  | 'navigate'       // Navigate to a dashboard screen/tab
  | 'custom';        // Custom handler registered by behavior pack

/**
 * Button action payload
 * Describes what happens when a button is clicked
 */
export interface ButtonAction {
  /** Type of action to trigger */
  type: ButtonActionType;

  /** For 'command': the command type (pause, resume, etc.) */
  commandType?: CommandTypeString;

  /** For 'api-call': the endpoint path */
  endpoint?: string;

  /** For 'api-call': HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';

  /** For 'navigate': the target screen/tab */
  target?: string;

  /** Generic payload passed to the action handler */
  payload?: Record<string, unknown>;
}

/**
 * Context categories for response classification
 * Determines which types of responses a button should appear on
 */
export type ButtonContext =
  | 'code-change'          // Code modifications and patches
  | 'error-message'        // Error logs and failure diagnostics
  | 'analysis-report'      // Analysis results and assessments
  | 'question-prompt'      // Questions and user prompts
  | 'file-modification'    // File create/update/delete operations
  | 'approval-gate'        // Chain compilation approval gates
  | 'general';             // Generic content

/**
 * Single button definition
 * Describes a button that can be displayed in the toolbar
 */
export interface ButtonDefinition {
  /** Unique identifier for this button */
  id: ButtonId;

  /** Display label */
  label: string;

  /** Icon name or emoji (e.g., "save", "🚀", "settings") */
  icon?: string;

  /** Action to trigger when clicked */
  action: ButtonAction;

  /** Response contexts where this button should appear */
  contexts: ButtonContext[];

  /** Keyboard shortcut (e.g., "Ctrl+1", "Cmd+S") */
  shortcut?: string;

  /** Source layer (where this button was defined) */
  source: LayerSource;

  /** Sort order (lower = higher priority) */
  priority: number;

  /** Whether this button is currently enabled */
  enabled: boolean;
}

/**
 * Button execution state
 * Tracks the current state during button interaction
 */
export type ButtonState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Toolbar slot configuration
 * Represents a button's position and state in the toolbar
 */
export interface ToolbarSlot {
  /** Reference to a button definition */
  buttonId: ButtonId;

  /** Manually pinned by operator (won't be auto-removed) */
  pinned: boolean;

  /** Display order in toolbar (0 = leftmost) */
  position: number;

  /** Total number of times this button was clicked */
  usageCount: number;

  /** Last timestamp this button was used */
  lastUsed: Timestamp;
}

/**
 * Toolbar configuration
 * Per-project configuration for the toolbar behavior and layout
 */
export interface ToolbarConfig {
  /** Maximum number of buttons displayed simultaneously */
  maxSlots: number;

  /** Configured button slots */
  slots: ToolbarSlot[];

  /** Automatically add frequent actions to toolbar */
  autoLearn: boolean;

  /** Display usage badge on buttons */
  showUsageCount: boolean;
}
