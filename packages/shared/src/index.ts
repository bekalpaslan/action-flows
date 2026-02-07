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
  ExecutionLogCreatedEvent,
  TerminalOutputEvent,
  ClaudeCliStartedEvent,
  ClaudeCliOutputEvent,
  ClaudeCliExitedEvent,
  ErrorOccurredEvent,
  WarningOccurredEvent,
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
