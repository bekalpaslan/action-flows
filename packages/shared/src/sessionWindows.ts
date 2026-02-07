/**
 * Session Window System Types
 * Defines types for the session monitoring grid interface
 */

import type { SessionId, ChainId, StepNumber, Timestamp } from './types.js';

/**
 * Session lifecycle states for UI rendering
 */
export type SessionLifecycleState = 'created' | 'active' | 'paused' | 'waiting-for-input' | 'ended';

/**
 * Session window display state
 */
export interface SessionWindowState {
  /** Session ID being displayed */
  sessionId: SessionId;

  /** Whether the window is expanded (shows flow viz) or collapsed (card only) */
  expanded: boolean;

  /** Whether the window is in full-screen mode */
  fullScreen: boolean;

  /** Whether the user is following this session */
  followed: boolean;

  /** Position in the grid (null = auto-layout) */
  gridPosition?: {
    row: number;
    col: number;
  };

  /** Lifecycle state for UI rendering */
  lifecycleState: SessionLifecycleState;

  /** CLI session attached to this window */
  attachedCliSessionId?: SessionId;
}

/**
 * User configuration for a session window
 */
export interface SessionWindowConfig {
  /** Session ID this config belongs to */
  sessionId: SessionId;

  /** Auto-expand on new chain compiled */
  autoExpand?: boolean;

  /** Auto-attach CLI when waiting for input */
  autoAttachCli?: boolean;

  /** Enable flow visualization animations */
  enableAnimations?: boolean;

  /** Custom quick actions for this session */
  quickActions?: QuickActionDefinition[];

  /** Auto-archive delay in seconds (default: 60) */
  autoArchiveDelaySeconds?: number;
}

/**
 * Quick action button definition
 */
export interface QuickActionDefinition {
  /** Unique ID for this quick action */
  id: string;

  /** Display label */
  label: string;

  /** Icon name (e.g., 'check', 'x', 'skip') */
  icon: string;

  /** Input value to send when clicked */
  value: string;

  /** Context patterns that trigger this action */
  contextPatterns?: string[];

  /** Always show (ignore context detection) */
  alwaysShow?: boolean;
}

/**
 * Quick action presets (global defaults)
 */
export interface QuickActionPreset {
  /** Preset ID */
  id: string;

  /** Preset name */
  name: string;

  /** Description */
  description: string;

  /** Quick actions in this preset */
  actions: QuickActionDefinition[];
}

/**
 * Prompt type detected from terminal output
 */
export type PromptType = 'binary' | 'choice' | 'text' | 'file-path' | 'chain-approval' | 'confirmation' | 'unknown';

/**
 * Extended metadata for ReactFlow nodes (for future Phase 2)
 */
export interface FlowNodeData {
  /** Step number */
  stepNumber: StepNumber;

  /** Action name */
  action: string;

  /** Step status */
  status: string;

  /** Step description */
  description?: string;

  /** Model used */
  model?: string;

  /** Swimlane assignment (agent type) */
  swimlane?: string;

  /** Animation state */
  animationState?: 'idle' | 'slide-in' | 'pulse' | 'shrink' | 'shake';

  /** Parallel group ID (steps executing in parallel) */
  parallelGroup?: number;
}

/**
 * Extended metadata for ReactFlow edges (for future Phase 2)
 */
export interface FlowEdgeData {
  /** Source step number */
  sourceStep: StepNumber;

  /** Target step number */
  targetStep: StepNumber;

  /** Data label (e.g., "plan.md", "code changes") */
  dataLabel?: string;

  /** Animation progress (0-1) */
  animationProgress?: number;

  /** Whether this edge is active (data flowing) */
  active?: boolean;
}

/**
 * Session window layout configuration
 */
export interface SessionWindowLayout {
  /** Number of windows in grid */
  windowCount: number;

  /** Grid columns (auto-calculated based on count) */
  columns: number;

  /** Grid rows (auto-calculated based on count) */
  rows: number;
}
