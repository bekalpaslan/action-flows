/**
 * Shared types and interfaces for ActionFlows Dashboard
 *
 * This package provides comprehensive TypeScript interfaces for:
 * - Base types and branded strings (types.ts)
 * - Event system types (events.ts)
 * - Domain models (models.ts)
 * - Command types (commands.ts)
 *
 * All events support null-safe parsed fields for graceful degradation
 * when Claude output doesn't follow expected format.
 */

// ============================================================================
// Base Types & Branded Strings
// ============================================================================
export type {
  SessionId,
  ChainId,
  StepId,
  StepNumber,
  UserId,
  Timestamp,
  StatusString,
  ModelString,
  ChainSourceString,
  DurationMs,
} from './types.js';

export { Status, Model, ChainSource, brandedTypes, duration } from './types.js';

// ============================================================================
// Event Types
// ============================================================================
export type {
  BaseEvent,
  SessionStartedEvent,
  SessionEndedEvent,
  ChainCompiledEvent,
  ChainStepSnapshot,
  ChainStartedEvent,
  ChainCompletedEvent,
  StepSpawnedEvent,
  StepStartedEvent,
  StepCompletedEvent,
  StepFailedEvent,
  FileChange,
  AwaitingInputEvent,
  InputReceivedEvent,
  FileCreatedEvent,
  FileModifiedEvent,
  FileDeletedEvent,
  RegistryLineUpdatedEvent,
  RegistryChangedEvent,
  ExecutionLogCreatedEvent,
  TerminalOutputEvent,
  ClaudeCliStartedEvent,
  ClaudeCliOutputEvent,
  ClaudeCliExitedEvent,
  ErrorOccurredEvent,
  WarningOccurredEvent,
  SessionFollowedEvent,
  SessionUnfollowedEvent,
  QuickActionTriggeredEvent,
  FlowNodeClickedEvent,
  PatternDetectedEvent,
  FrequencyUpdatedEvent,
  BookmarkCreatedEvent,
  WorkspaceEvent,
} from './events.js';

export { eventGuards } from './events.js';

// ============================================================================
// Domain Models
// ============================================================================
export type {
  ChainStep,
  Chain,
  Session,
  ExecutionPlan,
  ExecutionPlanStep,
  ActionRegistryEntry,
  InputDefinition,
  FlowDefinition,
  ExecutionMetrics,
  ChainTemplate,
  ChainTemplateStep,
  TemplateParameter,
  ClaudeCliSession,
  DiscoveredClaudeSession,
  DiscoveredSessionEnrichment,
} from './models.js';

// ============================================================================
// Commands
// ============================================================================
export type {
  Command,
  PauseCommand,
  ResumeCommand,
  CancelCommand,
  AbortCommand,
  RetryCommand,
  SkipCommand,
  ClaudeCliStartCommand,
  ClaudeCliSendInputCommand,
  ClaudeCliStopCommand,
  CommandPayload,
  CommandResult,
} from './commands.js';

export { CommandType, commandGuards, CommandValidator, CommandBuilder } from './commands.js';

// ============================================================================
// Session Window System Types
// ============================================================================
export type {
  SessionWindowState,
  SessionWindowConfig,
  QuickActionDefinition,
  QuickActionPreset,
  PromptType,
  FlowNodeData,
  FlowEdgeData,
  SessionWindowLayout,
  SessionLifecycleState,
} from './sessionWindows.js';

// ============================================================================
// Project Registry Types
// ============================================================================
export type {
  ProjectId,
  Project,
  ProjectAutoDetectionResult,
} from './projects.js';

// ============================================================================
// Self-Evolving System Types
// ============================================================================
export type {
  BehaviorPackId,
  LayerSource,
} from './selfEvolvingTypes.js';

// ============================================================================
// Button System Types
// ============================================================================
export type {
  ButtonId,
  ButtonActionType,
  ButtonAction,
  ButtonContext,
  ButtonDefinition,
  ButtonState,
  ToolbarSlot,
  ToolbarConfig,
} from './buttonTypes.js';

// ============================================================================
// Pattern & Bookmark Types
// ============================================================================
export type {
  BookmarkId,
  PatternId,
  BookmarkCategory,
  Bookmark,
  PatternType,
  ConfidenceScore,
  ActionSequence,
  DetectedPattern,
  PatternAction,
  FrequencyRecord,
  FrequencyQuery,
  BookmarkCluster,
} from './patternTypes.js';

// ============================================================================
// Registry Types
// ============================================================================
export type {
  RegistryEntryId,
  RegistryEntryType,
  RegistryEntryStatus,
  WorkflowDefinition,
  ShortcutDefinition,
  ModifierDefinition,
  RegistryEntry,
  PackCompatibility,
  BehaviorPack,
  ResolvedBehavior,
  RegistryConflict,
  RegistryFilter,
} from './registryTypes.js';

// ============================================================================
// Harmony Detection Types
// ============================================================================
export type {
  HarmonyResult,
  HarmonyCheck,
  HarmonyMetrics,
  HarmonyFilter,
} from './harmonyTypes.js';

// ============================================================================
// Workbench System Types
// ============================================================================
export type {
  WorkbenchId,
  WorkbenchConfig,
  WorkbenchState,
  WorkbenchNotification,
  SessionWorkbenchTag,
} from './workbenchTypes.js';

export {
  WORKBENCH_IDS,
  DEFAULT_WORKBENCH_CONFIGS,
  getWorkbenchForSessionTag,
  getSessionCapableWorkbenches,
  canWorkbenchHaveSessions,
  ROUTABLE_WORKBENCHES,
  isRoutable,
} from './workbenchTypes.js';

// ============================================================================
// Routing Types
// ============================================================================
export type {
  RoutingResult,
  DisambiguationRequest,
  RoutingDecision,
} from './routingTypes.js';

export { ROUTING_THRESHOLDS } from './routingTypes.js';

// ============================================================================
// Control Panel Types
// ============================================================================
export type {
  QuickCommand,
  QuickCommandAction,
  FlowAction,
  ControlPanelConfig,
} from './controlPanelTypes.js';

export {
  DEFAULT_QUICK_COMMANDS,
  DEFAULT_CONTROL_PANEL_CONFIG,
} from './controlPanelTypes.js';

// ============================================================================
// Orchestrator Output Contract
// ============================================================================
export * from './contract/index.js';

// ============================================================================
// Legacy Types (for backward compatibility)
// ============================================================================

/**
 * Hook execution event (legacy)
 */
export interface HookExecutionEvent {
  id: string;
  timestamp: number;
  hookName: string;
  status: 'pending' | 'success' | 'failure';
  data: Record<string, unknown>;
}

/**
 * WebSocket message types (legacy)
 */
export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}

/**
 * Agent task interface (legacy)
 */
export interface AgentTask {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  result?: unknown;
  error?: string;
}

/**
 * Hook definition interface (legacy)
 */
export interface HookDefinition {
  name: string;
  event: string;
  script: string;
  enabled: boolean;
}

export type { HookExecutionEvent as HookEvent };
