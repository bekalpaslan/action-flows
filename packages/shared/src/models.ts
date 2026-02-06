/**
 * Domain Models for ActionFlows System
 * Represents core entities: Chains, Sessions, and related concepts
 */

import type {
  SessionId,
  StepNumber,
  UserId,
  Timestamp,
  StatusString,
  ModelString,
  ChainSourceString,
  DurationMs,
} from './types';

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
  id: string;

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

  /** Department this flow belongs to */
  department: string;

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
