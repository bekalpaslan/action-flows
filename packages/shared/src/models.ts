/**
 * Domain Models for ActionFlows System
 * Represents core entities: Chains, Sessions, and related concepts
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
 * Chain Step - represents a single step in a chain
 */
export interface ChainStep {
  /** Step number (1-indexed) */
  stepNumber: StepNumber;

  /** Action to execute (e.g., 'code', 'review', 'audit') */
  action: string;

  /** Model to use for this step (haiku, sonnet, opus) */
  model: ModelString;

  /** Input parameters for the step */
  inputs: Record<string, unknown>;

  /** Step numbers this step depends on (empty if no dependencies) */
  waitsFor: StepNumber[];

  /** Current status of the step */
  status: StatusString;

  /** Detailed description of what this step does */
  description?: string;

  /** When the step started executing */
  startedAt?: Timestamp;

  /** When the step completed */
  completedAt?: Timestamp;

  /** Duration of execution in milliseconds */
  duration?: DurationMs;

  /** Result output from the step */
  result?: unknown;

  /** Error message if step failed */
  error?: string;

  /** Learning discovered during step execution */
  learning?: string;
}

/**
 * Chain - represents a compiled sequence of steps
 */
export interface Chain {
  /** Unique identifier for this chain */
  id: ChainId;

  /** Session this chain belongs to */
  sessionId: SessionId;

  /** User who created this chain */
  userId?: UserId;

  /** Human-readable title of the chain */
  title: string;

  /** All steps in the chain */
  steps: ChainStep[];

  /** Source of this chain: flow, composed, or meta-task */
  source: ChainSourceString;

  /** Reference info (flow name, past execution ID, etc.) */
  ref?: string;

  /** Current overall status */
  status: StatusString;

  /** When the chain was compiled */
  compiledAt: Timestamp;

  /** When execution started */
  startedAt?: Timestamp;

  /** When execution completed */
  completedAt?: Timestamp;

  /** Total duration if completed */
  duration?: DurationMs;

  /** Number of successful steps */
  successfulSteps?: number;

  /** Number of failed steps */
  failedSteps?: number;

  /** Number of skipped steps */
  skippedSteps?: number;

  /** Summary of chain execution */
  summary?: string;

  /** Execution mode determined by dependencies */
  executionMode?: 'sequential' | 'parallel' | 'mixed';

  /** Currently executing step number (if in progress) */
  currentStep?: StepNumber;

  /** Estimated total duration */
  estimatedDuration?: DurationMs;
}

/**
 * Session - represents a work session
 */
export interface Session {
  /** Unique identifier for this session */
  id: SessionId;

  /** User/operator performing the work */
  user?: UserId;

  /** Working directory where session started */
  cwd: string;

  /** System hostname (for context) */
  hostname?: string;

  /** Platform (win32, darwin, linux) */
  platform?: string;

  /** All chains executed in this session */
  chains: Chain[];

  /** Currently active chain (if any) */
  currentChain?: Chain;

  /** Overall status of the session */
  status: StatusString;

  /** Conversation state for input handling */
  conversationState?: 'idle' | 'awaiting_input' | 'receiving_input' | 'active';

  /** Last prompt shown to user (if awaiting input) */
  lastPrompt?: {
    text: string;
    type: 'binary' | 'text' | 'chain_approval';
    quickResponses?: string[];
    timestamp: Timestamp;
  };

  /** When the session started */
  startedAt: Timestamp;

  /** When the session ended */
  endedAt?: Timestamp;

  /** Total duration if ended */
  duration?: DurationMs;

  /** Reason for session ending */
  endReason?: string;

  /** Session-level summary */
  summary?: string;

  /** Total number of steps executed */
  totalStepsExecuted?: number;

  /** Total number of chains completed */
  totalChainsCompleted?: number;

  /** Any critical errors or blockers */
  criticalErrors?: string[];

  /** Session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Execution Plan - represents a proposed or compiled chain plan
 */
export interface ExecutionPlan {
  /** Unique identifier */
  id: string;

  /** Human-readable title */
  title: string;

  /** What this plan accomplishes */
  objective: string;

  /** Steps to execute */
  steps: ExecutionPlanStep[];

  /** Source of this plan */
  source: ChainSourceString;

  /** Reference to flow or past execution */
  ref?: string;

  /** Estimated total duration */
  estimatedDuration?: DurationMs;

  /** Execution strategy */
  executionMode: 'sequential' | 'parallel' | 'mixed';

  /** When this plan was created */
  createdAt: Timestamp;

  /** Whether plan was approved by user */
  approved: boolean;

  /** When plan was approved */
  approvedAt?: Timestamp;

  /** Approver user ID */
  approvedBy?: UserId;

  /** Adjustments made by user before approval */
  adjustments?: string[];
}

export interface ExecutionPlanStep {
  stepNumber: StepNumber;
  action: string;
  description: string;
  model: ModelString;
  inputs: Record<string, unknown>;
  waitsFor: StepNumber[];
  estimatedDuration?: DurationMs;
}

/**
 * Action Registry Entry
 */
export interface ActionRegistryEntry {
  /** Action name/identifier */
  name: string;

  /** Action category */
  category: 'code' | 'review' | 'audit' | 'test' | 'analyze' | 'plan' | 'notify' | 'commit' | 'other';

  /** Description of what the action does */
  description: string;

  /** Default model for this action */
  defaultModel: ModelString;

  /** Required inputs */
  requiredInputs: InputDefinition[];

  /** Optional inputs */
  optionalInputs?: InputDefinition[];

  /** Flow file path or reference */
  flowPath?: string;

  /** Whether action is experimental */
  experimental?: boolean;
}

export interface InputDefinition {
  /** Input name */
  name: string;

  /** Input type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';

  /** Input description */
  description: string;

  /** Valid values if enum */
  enum?: string[];
}

/**
 * Flow Definition
 */
export interface FlowDefinition {
  /** Flow name/identifier */
  name: string;

  /** Flow title for display */
  title: string;

  /** What this flow accomplishes */
  objective: string;

  /** Sequence of actions in this flow */
  actions: string[];

  /** Flow description */
  description?: string;

  /** Whether flow is experimental */
  experimental?: boolean;

  /** When flow was created */
  createdAt?: Timestamp;

  /** Last updated */
  updatedAt?: Timestamp;
}

/**
 * Execution Metrics - aggregated statistics
 */
export interface ExecutionMetrics {
  /** Session ID these metrics belong to */
  sessionId: SessionId;

  /** Total sessions executed */
  totalSessions: number;

  /** Average session duration */
  averageSessionDuration: DurationMs;

  /** Total chains executed */
  totalChains: number;

  /** Average steps per chain */
  averageStepsPerChain: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Average step duration */
  averageStepDuration: DurationMs;

  /** Most used actions */
  topActions: { action: string; count: number }[];

  /** Most used models */
  topModels: { model: ModelString; count: number }[];

  /** Error statistics */
  errorStats?: {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recoveryRate: number;
  };

  /** Collected at */
  collectedAt: Timestamp;
}

/**
 * Chain Template - reusable pattern
 */
export interface ChainTemplate {
  /** Template identifier */
  id: string;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Base steps in template */
  steps: ChainTemplateStep[];

  /** Parameters that can be substituted */
  parameters?: Record<string, TemplateParameter>;

  /** Tags for discovery */
  tags?: string[];

  /** Created at */
  createdAt: Timestamp;

  /** Usage count */
  usageCount: number;

  /** Success rate */
  successRate: number;
}

export interface ChainTemplateStep {
  action: string;
  model: ModelString;
  inputs: Record<string, unknown>;
  waitsFor?: string[]; // References to other step action names
}

export interface TemplateParameter {
  name: string;
  type: string;
  description: string;
  defaultValue?: unknown;
}

/**
 * Claude CLI Session - represents a spawned Claude Code CLI process
 */
export interface ClaudeCliSession {
  /** Session ID for this Claude CLI session */
  id: SessionId;

  /** Process ID of spawned Claude CLI subprocess */
  pid: number | null;

  /** Current status of the Claude CLI session */
  status: 'starting' | 'running' | 'paused' | 'stopped' | 'error';

  /** Working directory for Claude CLI */
  cwd: string;

  /** When the session was started */
  startedAt: Timestamp;

  /** When the session ended */
  endedAt?: Timestamp;

  /** Exit code if process terminated */
  exitCode?: number;

  /** Exit signal if process was killed */
  exitSignal?: string;

  /** Full command args used to spawn the process */
  spawnArgs: string[];

  /** Additional metadata */
  metadata?: {
    /** User who started this session */
    user?: UserId;
    /** Initial prompt passed to Claude CLI */
    prompt?: string;
    /** Additional flags passed to Claude CLI */
    flags?: Record<string, unknown>;
  };
}

/**
 * Chat Message - represents a single message in a CLI chat conversation
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string;

  /** Session this message belongs to */
  sessionId: SessionId;

  /** Message role */
  role: 'user' | 'assistant' | 'system';

  /** Message content (text) */
  content: string;

  /** When the message was created */
  timestamp: Timestamp;

  /** Type of message content */
  messageType?: 'text' | 'tool_use' | 'tool_result' | 'error';

  /** Optional metadata for assistant messages */
  metadata?: {
    model?: string;
    stopReason?: string;
    toolName?: string;
    toolUseId?: string;
    toolInput?: unknown;
    spawnPrompt?: string;
    stepNumber?: number;
    costUsd?: number;
    durationMs?: number;
  };
}

/**
 * Discovered Claude Session - an externally-running Claude Code session
 * detected via IDE lock files (~/.claude/ide/<port>.lock)
 */
export interface DiscoveredClaudeSession {
  /** Unique key for this discovery entry (e.g. "ide-12345") */
  discoveryKey: string;
  /** How the session was discovered */
  source: 'ide-lock';
  /** Port from the lock file name */
  port: number;
  /** IDE process PID from lock JSON */
  pid: number;
  /** Whether the PID is currently alive */
  pidAlive: boolean;
  /** Workspace folders from lock JSON */
  workspaceFolders: string[];
  /** First workspace folder, normalized */
  primaryCwd: string;
  /** IDE name (e.g. "Visual Studio Code") */
  ideName: string;
  /** Transport protocol */
  transport: string;
  /** When this session was last scanned */
  lastSeenAt: string;
  /** Optional enrichment from JSONL project files */
  enrichment?: DiscoveredSessionEnrichment;
}

/**
 * Enrichment data derived from Claude's JSONL project files
 */
export interface DiscoveredSessionEnrichment {
  /** Most recent session ID found in JSONL files */
  latestSessionId: string | null;
  /** Last prompt text from JSONL */
  lastPrompt: string | null;
  /** Git branch from JSONL metadata */
  gitBranch: string | null;
  /** mtime of most recently modified JSONL file */
  lastActivityAt: string | null;
  /** Total number of JSONL session files found */
  totalSessionFiles: number;
}

// ============================================================================
// Respect Check Types
// ============================================================================

/**
 * Component type categories for spatial checking
 */
export type RespectComponentType =
  | 'layout-shell'
  | 'topbar'
  | 'sidebar'
  | 'panel'
  | 'content-area'
  | 'input'
  | 'visualization'
  | 'widget'
  | 'modal';

/**
 * Types of spatial violations
 */
export type RespectViolationType =
  | 'horizontal_overflow'
  | 'vertical_overflow'
  | 'viewport_escape'
  | 'fixed_dim_mismatch'
  | 'min_constraint'
  | 'max_constraint'
  | 'parent_escape';

/**
 * Single spatial violation detail
 */
export interface RespectViolation {
  type: RespectViolationType;
  severity: 'high' | 'medium' | 'low';
  message: string;
  expected: string;
  actual: string;
}

/**
 * Check result for a single component
 */
export interface RespectComponentResult {
  selector: string;
  type: RespectComponentType;
  violations: RespectViolation[];
  metrics: {
    width: number;
    height: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
  };
}

/**
 * Full respect check result from a single run
 */
export interface RespectCheckResult {
  timestamp: string;
  viewportWidth: number;
  viewportHeight: number;
  totalChecked: number;
  totalElementsFound: number;
  totalViolations: number;
  violations: RespectComponentResult[];
  summary: { high: number; medium: number; low: number };
  clean: Array<{ selector: string; type: RespectComponentType; width: number; height: number }>;
}
