/**
 * Event Types for ActionFlows System
 * Comprehensive event definitions with null-safe parsed fields for graceful degradation
 */

import type {
  SessionId,
  ChainId,
  StepNumber,
  UserId,
  Timestamp,
  StatusString,
  ModelString,
  ChainSourceString,
  DurationMs,
} from './types.js';

/**
 * Base event structure
 * All events extend this with common metadata
 */
export interface BaseEvent {
  /** Event type discriminator */
  type: string;

  /** Session this event belongs to */
  sessionId: SessionId;

  /** ISO 8601 timestamp when event occurred */
  timestamp: Timestamp;

  /** Optional user/operator who triggered the event (when applicable) */
  user?: UserId;

  /** Unique event ID for deduplication */
  eventId?: string;
}

/**
 * Session lifecycle events
 */

export interface SessionStartedEvent extends BaseEvent {
  type: 'session:started';

  // Automatic fields (always available from hooks)
  cwd: string;

  // Parsed fields (nullable, extracted from Claude output)
  user?: UserId;

  // Inferred fallbacks (always available, computed from automatic fields)
  hostname?: string;
  platform?: string;
}

export interface SessionEndedEvent extends BaseEvent {
  type: 'session:ended';

  // Automatic fields
  duration?: DurationMs;

  // Parsed fields (nullable)
  reason?: string;
  summary?: string;

  // Inferred fallbacks
  totalStepsExecuted?: number;
  totalChainsCompleted?: number;
}

/**
 * Chain compilation and lifecycle events
 */

export interface ChainCompiledEvent extends BaseEvent {
  type: 'chain:compiled';

  // Automatic fields
  chainId?: ChainId;

  // Parsed fields (nullable)
  title?: string | null;
  steps?: ChainStepSnapshot[] | null;
  source?: ChainSourceString | null;
  ref?: string | null; // Reference to past execution or flow name
  totalSteps?: number | null;

  // Inferred fallbacks
  executionMode?: 'sequential' | 'parallel' | 'mixed';
  estimatedDuration?: DurationMs;
}

export interface ChainStepSnapshot {
  stepNumber: number;
  action: string;
  model?: string;
  inputs?: Record<string, unknown>;
  waitsFor?: number[];
  description?: string;
}

export interface ChainStartedEvent extends BaseEvent {
  type: 'chain:started';

  // Automatic fields
  chainId: ChainId;

  // Parsed fields (nullable)
  title?: string | null;
  stepCount?: number | null;

  // Inferred fallbacks
  currentStep?: StepNumber;
}

export interface ChainCompletedEvent extends BaseEvent {
  type: 'chain:completed';

  // Automatic fields
  chainId: ChainId;
  duration: DurationMs;

  // Parsed fields (nullable)
  title?: string | null;
  status?: StatusString | null;
  successfulSteps?: number | null;
  failedSteps?: number | null;
  skippedSteps?: number | null;
  summary?: string | null;

  // Inferred fallbacks
  overallStatus: 'success' | 'partial' | 'failure';
}

/**
 * Step execution events
 */

export interface StepSpawnedEvent extends BaseEvent {
  type: 'step:spawned';

  // Automatic fields
  stepNumber: StepNumber;

  // Parsed fields (nullable)
  action?: string | null;
  model?: ModelString | null;
  inputs?: Record<string, unknown> | null;
  description?: string | null;
  waitsFor?: StepNumber[] | null;

  // Inferred fallbacks
  estimatedDuration?: DurationMs;
  subagentType?: string;

  // Parent linking (optional, for future nesting support)
  parentStepId?: string | null;  // ID of parent step if this is a nested spawn
  depth?: number;                 // Nesting level: 0 = top-level (default)
}

export interface StepStartedEvent extends BaseEvent {
  type: 'step:started';

  // Automatic fields
  stepNumber: StepNumber;

  // Parsed fields (nullable)
  action?: string | null;
  agentName?: string | null;

  // Inferred fallbacks
  startedAt: Timestamp;
}

export interface StepCompletedEvent extends BaseEvent {
  type: 'step:completed';

  // Automatic fields
  stepNumber: StepNumber;
  duration: DurationMs;

  // Parsed fields (nullable)
  action?: string | null;
  status?: StatusString | null;
  result?: unknown | null;
  learning?: string | null;
  fileChanges?: FileChange[] | null;
  summary?: string | null;

  // Inferred fallbacks
  succeeded: boolean;
  outputLength?: number;

  // Parent linking (optional, for future nesting support)
  parentStepId?: string | null;  // ID of parent step if this was a nested spawn
  depth?: number;                 // Nesting level: 0 = top-level (default)
}

export interface StepFailedEvent extends BaseEvent {
  type: 'step:failed';

  // Automatic fields
  stepNumber: StepNumber;

  // Parsed fields (nullable)
  action?: string | null;
  error?: string | null;
  errorType?: string | null;
  stackTrace?: string | null;
  suggestion?: string | null;

  // Inferred fallbacks
  isCritical: boolean;
  isRetryable: boolean;
}

export interface FileChange {
  path: string;
  type: 'created' | 'modified' | 'deleted';
  description?: string;
}

/**
 * User interaction events
 */

export interface AwaitingInputEvent extends BaseEvent {
  type: 'interaction:awaiting-input';

  // Automatic fields
  stepNumber?: StepNumber;

  // Parsed fields (nullable)
  question?: string | null;
  context?: string | null;
  quickResponses?: string[] | null;
  inputType?: 'text' | 'choice' | 'confirm' | 'code' | null;

  // Inferred fallbacks
  timeoutMs?: number;
  allowCustomInput: boolean;
}

export interface InputReceivedEvent extends BaseEvent {
  type: 'interaction:input-received';

  // Automatic fields
  input: string;
  source: 'terminal' | 'dashboard' | 'api';

  // Parsed fields (nullable)
  parsedValue?: unknown | null;
  isValid?: boolean | null;

  // Inferred fallbacks
  acknowledgedAt: Timestamp;
}

/**
 * File system events (with session and step tracing)
 */

export interface FileCreatedEvent extends BaseEvent {
  type: 'file:created';

  // Automatic fields
  path: string;
  sessionId: SessionId; // REQUIRED - file watching is always in context of a session

  // Parsed fields (nullable)
  stepNumber?: StepNumber | null;
  content?: string | null;
  size?: number | null;

  // Inferred fallbacks
  relativePath?: string;
  directory?: string;
  extension?: string;
}

export interface FileModifiedEvent extends BaseEvent {
  type: 'file:modified';

  // Automatic fields
  path: string;
  sessionId: SessionId; // REQUIRED - file watching is always in context of a session

  // Parsed fields (nullable)
  stepNumber?: StepNumber | null;
  changeType?: 'content' | 'metadata' | 'both' | null;
  changes?: Record<string, unknown> | null;
  previousContent?: string | null;
  newContent?: string | null;

  // Inferred fallbacks
  relativePath?: string;
  isLargeChange?: boolean;
}

export interface FileDeletedEvent extends BaseEvent {
  type: 'file:deleted';

  // Automatic fields
  path: string;
  sessionId: SessionId; // REQUIRED - file watching is always in context of a session

  // Parsed fields (nullable)
  stepNumber?: StepNumber | null;
  reason?: string | null;

  // Inferred fallbacks
  relativePath?: string;
  isBackedUp?: boolean;
}

/**
 * Registry and system events
 */

export interface RegistryLineUpdatedEvent extends BaseEvent {
  type: 'registry:line-updated';

  // Automatic fields
  registryFile: string;

  // Parsed fields (nullable)
  action?: 'add' | 'remove' | 'update' | null;
  lineContent?: string | null;
  lineNumber?: number | null;
  reason?: string | null;

  // Inferred fallbacks
  registryType?: 'INDEX' | 'FLOWS' | 'ACTIONS' | 'LEARNINGS';
}

export interface ExecutionLogCreatedEvent extends BaseEvent {
  type: 'execution:log-created';

  // Automatic fields
  logPath: string;

  // Parsed fields (nullable)
  description?: string | null;
  intent?: string | null;

  // Inferred fallbacks
  folderName?: string;
  timestamp: Timestamp;
}

/**
 * Terminal output events
 */

export interface TerminalOutputEvent extends BaseEvent {
  type: 'terminal:output';

  // Automatic fields
  sessionId: SessionId;
  output: string;
  stream: 'stdout' | 'stderr';

  // Parsed fields (nullable)
  stepNumber?: StepNumber | null;
  action?: string | null;

  // Inferred fallbacks
  timestamp: Timestamp;
}

/**
 * Claude CLI lifecycle events
 */

export interface ClaudeCliStartedEvent extends BaseEvent {
  type: 'claude-cli:started';

  // Automatic fields
  pid: number;
  cwd: string;
  args: string[];

  // Parsed fields (nullable)
  prompt?: string | null;

  // Inferred fallbacks
  timestamp: Timestamp;
}

export interface ClaudeCliOutputEvent extends BaseEvent {
  type: 'claude-cli:output';

  // Automatic fields
  output: string;
  stream: 'stdout' | 'stderr';

  // Inferred fallbacks
  timestamp: Timestamp;
}

export interface ClaudeCliExitedEvent extends BaseEvent {
  type: 'claude-cli:exited';

  // Automatic fields
  exitCode: number | null;
  exitSignal: string | null;
  duration: DurationMs;

  // Inferred fallbacks
  timestamp: Timestamp;
}

/**
 * Error and diagnostic events
 */

export interface ErrorOccurredEvent extends BaseEvent {
  type: 'error:occurred';

  // Automatic fields
  error: string;

  // Parsed fields (nullable)
  stepNumber?: StepNumber | null;
  severity?: 'low' | 'medium' | 'high' | 'critical' | null;
  context?: Record<string, unknown> | null;
  suggestion?: string | null;

  // Inferred fallbacks
  recoverable: boolean;
  affectsChain: boolean;
}

export interface WarningOccurredEvent extends BaseEvent {
  type: 'warning:occurred';

  // Automatic fields
  warning: string;

  // Parsed fields (nullable)
  stepNumber?: StepNumber | null;
  category?: string | null;
  mitigation?: string | null;

  // Inferred fallbacks
  acknowledged: boolean;
}

/**
 * Session window events
 */

export interface SessionFollowedEvent extends BaseEvent {
  type: 'session:followed';

  // Automatic fields
  sessionId: SessionId;

  // Parsed fields
  user?: UserId;
}

export interface SessionUnfollowedEvent extends BaseEvent {
  type: 'session:unfollowed';

  // Automatic fields
  sessionId: SessionId;

  // Parsed fields
  user?: UserId;
}

export interface QuickActionTriggeredEvent extends BaseEvent {
  type: 'quick-action:triggered';

  // Automatic fields
  actionId: string;
  value: string;

  // Parsed fields
  label?: string;
}

export interface FlowNodeClickedEvent extends BaseEvent {
  type: 'flow:node-clicked';

  // Automatic fields
  stepNumber: StepNumber;

  // Parsed fields
  action?: string | null;
}

/**
 * Union type for all events
 */
export type WorkspaceEvent =
  | SessionStartedEvent
  | SessionEndedEvent
  | ChainCompiledEvent
  | ChainStartedEvent
  | ChainCompletedEvent
  | StepSpawnedEvent
  | StepStartedEvent
  | StepCompletedEvent
  | StepFailedEvent
  | AwaitingInputEvent
  | InputReceivedEvent
  | FileCreatedEvent
  | FileModifiedEvent
  | FileDeletedEvent
  | RegistryLineUpdatedEvent
  | ExecutionLogCreatedEvent
  | TerminalOutputEvent
  | ClaudeCliStartedEvent
  | ClaudeCliOutputEvent
  | ClaudeCliExitedEvent
  | ErrorOccurredEvent
  | WarningOccurredEvent
  | SessionFollowedEvent
  | SessionUnfollowedEvent
  | QuickActionTriggeredEvent
  | FlowNodeClickedEvent;

/**
 * Type guard functions for discriminating event types
 */
export const eventGuards = {
  isSessionStarted: (event: WorkspaceEvent): event is SessionStartedEvent =>
    event.type === 'session:started',
  isSessionEnded: (event: WorkspaceEvent): event is SessionEndedEvent =>
    event.type === 'session:ended',
  isChainCompiled: (event: WorkspaceEvent): event is ChainCompiledEvent =>
    event.type === 'chain:compiled',
  isChainStarted: (event: WorkspaceEvent): event is ChainStartedEvent =>
    event.type === 'chain:started',
  isChainCompleted: (event: WorkspaceEvent): event is ChainCompletedEvent =>
    event.type === 'chain:completed',
  isStepSpawned: (event: WorkspaceEvent): event is StepSpawnedEvent =>
    event.type === 'step:spawned',
  isStepStarted: (event: WorkspaceEvent): event is StepStartedEvent =>
    event.type === 'step:started',
  isStepCompleted: (event: WorkspaceEvent): event is StepCompletedEvent =>
    event.type === 'step:completed',
  isStepFailed: (event: WorkspaceEvent): event is StepFailedEvent =>
    event.type === 'step:failed',
  isAwaitingInput: (event: WorkspaceEvent): event is AwaitingInputEvent =>
    event.type === 'interaction:awaiting-input',
  isInputReceived: (event: WorkspaceEvent): event is InputReceivedEvent =>
    event.type === 'interaction:input-received',
  isFileCreated: (event: WorkspaceEvent): event is FileCreatedEvent =>
    event.type === 'file:created',
  isFileModified: (event: WorkspaceEvent): event is FileModifiedEvent =>
    event.type === 'file:modified',
  isFileDeleted: (event: WorkspaceEvent): event is FileDeletedEvent =>
    event.type === 'file:deleted',
  isTerminalOutput: (event: WorkspaceEvent): event is TerminalOutputEvent =>
    event.type === 'terminal:output',
  isClaudeCliStarted: (event: WorkspaceEvent): event is ClaudeCliStartedEvent =>
    event.type === 'claude-cli:started',
  isClaudeCliOutput: (event: WorkspaceEvent): event is ClaudeCliOutputEvent =>
    event.type === 'claude-cli:output',
  isClaudeCliExited: (event: WorkspaceEvent): event is ClaudeCliExitedEvent =>
    event.type === 'claude-cli:exited',
  isError: (event: WorkspaceEvent): event is ErrorOccurredEvent =>
    event.type === 'error:occurred',
  isWarning: (event: WorkspaceEvent): event is WarningOccurredEvent =>
    event.type === 'warning:occurred',
  isSessionFollowed: (event: WorkspaceEvent): event is SessionFollowedEvent =>
    event.type === 'session:followed',
  isSessionUnfollowed: (event: WorkspaceEvent): event is SessionUnfollowedEvent =>
    event.type === 'session:unfollowed',
  isQuickActionTriggered: (event: WorkspaceEvent): event is QuickActionTriggeredEvent =>
    event.type === 'quick-action:triggered',
  isFlowNodeClicked: (event: WorkspaceEvent): event is FlowNodeClickedEvent =>
    event.type === 'flow:node-clicked',
};
