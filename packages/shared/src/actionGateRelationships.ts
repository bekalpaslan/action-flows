/**
 * Action-Gate Relationships
 *
 * Maps orchestrator actions to their gate checkpoint dependencies, action metadata,
 * and gate metadata. Consumable by backend gate checkpoint service and frontend dashboard.
 *
 * ## Use Cases
 *
 * **Backend Gate Checkpoint Service:**
 * ```typescript
 * import { getActionGates } from '@afw/shared';
 * const gates = getActionGates('review');
 * // ['gate-07', 'gate-08', 'gate-09', 'gate-10']
 * ```
 *
 * **Frontend Dashboard Visualization:**
 * ```typescript
 * import { ACTION_GATE_RELATIONSHIPS, getActionsForGate } from '@afw/shared';
 * const actionsAtGate = getActionsForGate('gate-08');
 * ```
 *
 * **Orchestrator Auto-Trigger Logic:**
 * ```typescript
 * import { hasAutoTrigger, AUTO_TRIGGER_RULES } from '@afw/shared';
 * const shouldTrigger = hasAutoTrigger('review', 'second-opinion');
 * ```
 *
 * @module actionGateRelationships
 */

import type { GateId } from './gateTrace.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Gate phases in the orchestrator lifecycle
 */
export type GatePhase =
  | 'REQUEST_RECEPTION'
  | 'CHAIN_COMPILATION'
  | 'CHAIN_EXECUTION'
  | 'COMPLETION'
  | 'POST_EXECUTION';

/**
 * Log capture status for a gate
 */
export type LogStatus =
  | 'NOT_LOGGED'
  | 'PARTIAL'
  | 'IMPLICIT'
  | 'MOSTLY_DONE'
  | 'FULLY_LOGGED';

/**
 * Metadata for a gate checkpoint
 */
export interface GateCheckpoint {
  /** Human-readable gate name */
  name: string;
  /** Phase in orchestrator lifecycle */
  phase: GatePhase;
  /** How this gate is validated */
  validatedBy: string;
  /** Whether/how this gate is logged */
  logStatus: LogStatus;
  /** Contract format ID validated at this gate (e.g., "5.1", "6.2") */
  format: string | null;
}

/**
 * Action-specific metadata
 */
export interface ActionMetadata {
  /** Model executing this action */
  model: 'haiku' | 'sonnet' | 'opus';
  /** Contract output format ID if this action produces structured output */
  contractOutput: string | null;
  /** Auto-trigger conditions (e.g., "second-opinion", "second-opinion:opt-in") */
  autoTriggers: string[];
  /** Whether this action is code-backed (custom implementation in packages/) */
  codeBacked: boolean;
  /** Package path if code-backed */
  codeBackedPackage?: string;
  /** Whether execution varies by tech stack */
  stackSpecific: boolean;
  /** Stack description if stack-specific */
  stack?: string;
}

/**
 * Mapping from action to gates and metadata
 */
export interface ActionGateMapping {
  /** Action identifier */
  action: string;
  /** Gate checkpoints this action must cross */
  gates: GateId[];
  /** Action metadata */
  metadata: ActionMetadata;
}

/**
 * Auto-trigger rule for an action
 */
export interface AutoTriggerRule {
  /** What this action triggers */
  triggers: string;
  /** "auto" or "opt-in" */
  type: 'auto' | 'opt-in';
  /** Whether auto-trigger can be suppressed */
  suppressible: boolean;
  /** Keywords to suppress this trigger */
  suppressKeywords?: string[];
  /** Gate where triggered action is inserted */
  gateInsertionPoint: GateId;
  /** Pattern for wait logic */
  waitPattern: string;
}

/**
 * Six-trigger evaluation criteria
 */
export interface SixTrigger {
  /** Trigger name (SIGNAL, PATTERN, DEPENDENCY, QUALITY, REDESIGN, REUSE) */
  name: string;
  /** What this trigger evaluates */
  description: string;
  /** Gate where this is evaluated */
  evaluatedAt: GateId;
}

/**
 * Trust boundary definition
 */
export interface TrustBoundary {
  /** Boundary name */
  name: string;
  /** Validation mechanism */
  validator: string;
  /** Service responsible for validation */
  handledBy: string;
}

/**
 * Gate phase definition
 */
export interface GatePhaseDefinition {
  /** Gates in this phase */
  gates: GateId[];
  /** Purpose of this phase */
  purpose: string;
}

// ============================================================================
// GATE_REGISTRY: Metadata for all gates
// ============================================================================

/**
 * Registry of all gate checkpoints with metadata.
 * Source: .claude/actionflows/logs/analyze/action-gate-relationships_2026-02-13-01-07-46/action-gate-map.json
 *
 * Note: Only gates 01-14 have full metadata from analysis. Gates 15-18 and 50
 * are defined in gateTrace.ts but not included in analysis output.
 */
export const GATE_REGISTRY: Partial<Record<GateId, GateCheckpoint>> = {
  'gate-01': {
    name: 'Parse & Understand',
    phase: 'REQUEST_RECEPTION',
    validatedBy: 'internal',
    logStatus: 'NOT_LOGGED',
    format: null,
  },
  'gate-02': {
    name: 'Route to Context',
    phase: 'REQUEST_RECEPTION',
    validatedBy: 'gateCheckpoint',
    logStatus: 'NOT_LOGGED',
    format: '6.2',
  },
  'gate-03': {
    name: 'Detect Special Work',
    phase: 'REQUEST_RECEPTION',
    validatedBy: 'gateCheckpoint',
    logStatus: 'NOT_LOGGED',
    format: null,
  },
  'gate-04': {
    name: 'Compile Chain',
    phase: 'CHAIN_COMPILATION',
    validatedBy: 'gateCheckpoint',
    logStatus: 'PARTIAL',
    format: '1.1',
  },
  'gate-05': {
    name: 'Present Chain',
    phase: 'CHAIN_COMPILATION',
    validatedBy: 'response-format',
    logStatus: 'IMPLICIT',
    format: null,
  },
  'gate-06': {
    name: 'Human Approval',
    phase: 'CHAIN_COMPILATION',
    validatedBy: 'gateCheckpoint',
    logStatus: 'NOT_LOGGED',
    format: null,
  },
  'gate-07': {
    name: 'Execute Step',
    phase: 'CHAIN_EXECUTION',
    validatedBy: 'agent-logs',
    logStatus: 'FULLY_LOGGED',
    format: '1.2',
  },
  'gate-08': {
    name: 'Step Completion',
    phase: 'CHAIN_EXECUTION',
    validatedBy: 'response-format',
    logStatus: 'PARTIAL',
    format: '2.1',
  },
  'gate-09': {
    name: 'Mid-Chain Evaluation',
    phase: 'CHAIN_EXECUTION',
    validatedBy: 'gateCheckpoint',
    logStatus: 'NOT_LOGGED',
    format: null,
  },
  'gate-10': {
    name: 'Auto-Trigger Detection',
    phase: 'CHAIN_EXECUTION',
    validatedBy: 'response-format',
    logStatus: 'PARTIAL',
    format: null,
  },
  'gate-11': {
    name: 'Chain Completion',
    phase: 'COMPLETION',
    validatedBy: 'response-format',
    logStatus: 'PARTIAL',
    format: '1.4',
  },
  'gate-12': {
    name: 'Archive & Index',
    phase: 'COMPLETION',
    validatedBy: 'INDEX.md',
    logStatus: 'MOSTLY_DONE',
    format: '4.2',
  },
  'gate-13': {
    name: 'Learning Surface',
    phase: 'POST_EXECUTION',
    validatedBy: 'gateCheckpoint',
    logStatus: 'FULLY_LOGGED',
    format: '3.2',
  },
  'gate-14': {
    name: 'Flow Candidate',
    phase: 'POST_EXECUTION',
    validatedBy: 'FLOWS.md',
    logStatus: 'PARTIAL',
    format: null,
  },
} as const;

// ============================================================================
// ACTION_GATE_RELATIONSHIPS: Primary constant mapping actions to gates
// ============================================================================

/**
 * Primary constant mapping orchestrator actions to gate checkpoints they must cross
 * and their associated metadata.
 *
 * Use `getActionGates()` helper for typical lookups.
 */
export const ACTION_GATE_RELATIONSHIPS: Record<string, ActionGateMapping> = {
  code: {
    action: 'code',
    gates: ['gate-07', 'gate-08', 'gate-09'] as const,
    metadata: {
      model: 'haiku',
      contractOutput: null,
      autoTriggers: [],
      codeBacked: false,
      stackSpecific: false,
    },
  },
  'code/backend': {
    action: 'code/backend',
    gates: ['gate-07', 'gate-08', 'gate-09'] as const,
    metadata: {
      model: 'haiku',
      contractOutput: null,
      autoTriggers: [],
      codeBacked: false,
      stackSpecific: true,
      stack: 'Express 4.18 + TypeScript + Zod',
    },
  },
  'code/frontend': {
    action: 'code/frontend',
    gates: ['gate-07', 'gate-08', 'gate-09'] as const,
    metadata: {
      model: 'haiku',
      contractOutput: null,
      autoTriggers: [],
      codeBacked: false,
      stackSpecific: true,
      stack: 'React 18.2 + Vite 5 + Electron 28',
    },
  },
  review: {
    action: 'review',
    gates: ['gate-07', 'gate-08', 'gate-09', 'gate-10'] as const,
    metadata: {
      model: 'sonnet',
      contractOutput: '5.1',
      autoTriggers: ['second-opinion'],
      codeBacked: false,
      stackSpecific: false,
    },
  },
  audit: {
    action: 'audit',
    gates: ['gate-07', 'gate-08', 'gate-09', 'gate-10'] as const,
    metadata: {
      model: 'opus',
      contractOutput: null,
      autoTriggers: ['second-opinion'],
      codeBacked: false,
      stackSpecific: false,
    },
  },
  analyze: {
    action: 'analyze',
    gates: ['gate-07', 'gate-08', 'gate-09'] as const,
    metadata: {
      model: 'sonnet',
      contractOutput: '5.2',
      autoTriggers: ['second-opinion:opt-in'],
      codeBacked: false,
      stackSpecific: false,
    },
  },
  plan: {
    action: 'plan',
    gates: ['gate-07', 'gate-08', 'gate-09'] as const,
    metadata: {
      model: 'sonnet',
      contractOutput: null,
      autoTriggers: ['second-opinion:opt-in'],
      codeBacked: false,
      stackSpecific: false,
    },
  },
  test: {
    action: 'test',
    gates: ['gate-07', 'gate-08', 'gate-09'] as const,
    metadata: {
      model: 'haiku',
      contractOutput: null,
      autoTriggers: [],
      codeBacked: false,
      stackSpecific: false,
    },
  },
  'test/playwright': {
    action: 'test/playwright',
    gates: ['gate-07', 'gate-08', 'gate-09'] as const,
    metadata: {
      model: 'sonnet',
      contractOutput: null,
      autoTriggers: [],
      codeBacked: false,
      stackSpecific: true,
      stack: 'Playwright E2E browser tests',
    },
  },
  commit: {
    action: 'commit',
    gates: ['gate-07', 'gate-08'] as const,
    metadata: {
      model: 'haiku',
      contractOutput: null,
      autoTriggers: [],
      codeBacked: false,
      stackSpecific: false,
    },
  },
  brainstorm: {
    action: 'brainstorm',
    gates: ['gate-07', 'gate-08', 'gate-09'] as const,
    metadata: {
      model: 'opus',
      contractOutput: '5.3',
      autoTriggers: [],
      codeBacked: false,
      stackSpecific: false,
    },
  },
  narrate: {
    action: 'narrate',
    gates: ['gate-07', 'gate-08', 'gate-09'] as const,
    metadata: {
      model: 'opus',
      contractOutput: null,
      autoTriggers: [],
      codeBacked: false,
      stackSpecific: false,
    },
  },
  onboarding: {
    action: 'onboarding',
    gates: ['gate-07', 'gate-08', 'gate-09'] as const,
    metadata: {
      model: 'opus',
      contractOutput: null,
      autoTriggers: [],
      codeBacked: false,
      stackSpecific: false,
    },
  },
  'second-opinion': {
    action: 'second-opinion',
    gates: ['gate-07', 'gate-08'] as const,
    metadata: {
      model: 'haiku',
      contractOutput: null,
      autoTriggers: [],
      codeBacked: true,
      codeBackedPackage: 'packages/second-opinion',
      stackSpecific: false,
    },
  },
} as const;

// ============================================================================
// FORMAT_TO_GATE_MAP: Format validation routing
// ============================================================================

/**
 * Maps contract format IDs to their validation gates or trust boundaries.
 * Used by harmony detector and format validators to route validation logic.
 *
 * Note: Formats 5.1, 5.2, 5.3 are validated at trust boundary t3 (Agent → Orchestrator),
 * not at a specific gate. Use getGateForFormat() to filter for actual gates only.
 */
export const FORMAT_TO_GATE_MAP: Record<string, GateId | 't0' | 't1' | 't2' | 't3' | null> = {
  '1.1': 'gate-04',  // Chain Compilation
  '1.2': 'gate-07',  // Execute Step
  '1.3': null,       // No specific gate
  '1.4': 'gate-11',  // Chain Completion
  '2.1': 'gate-08',  // Step Completion
  '2.2': 'gate-08',  // Step Completion (dual output variant)
  '2.3': 'gate-10',  // Auto-Trigger Detection
  '3.1': null,       // No specific gate
  '3.2': 'gate-13',  // Learning Surface
  '3.3': null,       // No specific gate
  '4.1': 'gate-12',  // Archive & Index
  '4.2': 'gate-12',  // Archive & Index
  '4.3': 'gate-13',  // Learning Surface
  '5.1': 't3',       // Trust boundary (Agent → Orchestrator)
  '5.2': 't3',       // Trust boundary (Agent → Orchestrator)
  '5.3': 't3',       // Trust boundary (Agent → Orchestrator)
  '6.1': null,       // No specific gate
  '6.2': 'gate-02',  // Route to Context
} as const;

// ============================================================================
// AUTO_TRIGGER_RULES: Auto-trigger configuration
// ============================================================================

/**
 * Auto-trigger rules defining when actions automatically spawn other actions.
 * Used by gate-10 (Auto-Trigger Detection) to determine if follow-up actions
 * should be queued.
 */
export const AUTO_TRIGGER_RULES: Record<string, AutoTriggerRule> = {
  review: {
    triggers: 'second-opinion',
    type: 'auto',
    suppressible: true,
    suppressKeywords: ['skip second opinions', 'no second opinion'],
    gateInsertionPoint: 'gate-10',
    waitPattern: 'commit waits for review, NOT second-opinion',
  },
  audit: {
    triggers: 'second-opinion',
    type: 'auto',
    suppressible: true,
    suppressKeywords: ['skip second opinions', 'no second opinion'],
    gateInsertionPoint: 'gate-10',
    waitPattern: 'commit waits for audit, NOT second-opinion',
  },
  analyze: {
    triggers: 'second-opinion',
    type: 'opt-in',
    suppressible: false,
    gateInsertionPoint: 'gate-10',
    waitPattern: 'commit waits for analyze, NOT second-opinion',
  },
  plan: {
    triggers: 'second-opinion',
    type: 'opt-in',
    suppressible: false,
    gateInsertionPoint: 'gate-10',
    waitPattern: 'commit waits for plan, NOT second-opinion',
  },
} as const;

// ============================================================================
// SIX_TRIGGERS: Step boundary evaluation criteria
// ============================================================================

/**
 * Six-trigger framework for step boundary evaluation (gate-09).
 * Orchestrator evaluates these criteria to determine if chain recompilation
 * or step insertion is needed.
 *
 * @see ORCHESTRATOR.md § Step Boundary Evaluation Protocol
 */
export const SIX_TRIGGERS: SixTrigger[] = [
  {
    name: 'SIGNAL',
    description: 'Agent Output Signals',
    evaluatedAt: 'gate-09',
  },
  {
    name: 'PATTERN',
    description: 'Pattern Recognition',
    evaluatedAt: 'gate-09',
  },
  {
    name: 'DEPENDENCY',
    description: 'Dependency Discovery',
    evaluatedAt: 'gate-09',
  },
  {
    name: 'QUALITY',
    description: 'Quality Threshold',
    evaluatedAt: 'gate-09',
  },
  {
    name: 'REDESIGN',
    description: 'Chain Redesign Initiative',
    evaluatedAt: 'gate-09',
  },
  {
    name: 'REUSE',
    description: 'Reuse Opportunity',
    evaluatedAt: 'gate-09',
  },
] as const;

// ============================================================================
// TRUST_BOUNDARIES: Security/validation boundaries
// ============================================================================

/**
 * Trust boundaries define where validation occurs across system boundaries.
 * Used by harmony detector to route validation logic.
 */
export const TRUST_BOUNDARIES: Record<string, TrustBoundary> = {
  t0: {
    name: 'User → Backend',
    validator: 'Zod validation',
    handledBy: 'NOT gateCheckpoint.ts',
  },
  t1: {
    name: 'Orchestrator → Backend',
    validator: 'gateCheckpoint.ts',
    handledBy: 'gateCheckpoint.ts',
  },
  t2: {
    name: 'Backend → Frontend',
    validator: 'Event schemas',
    handledBy: 'NOT gateCheckpoint.ts',
  },
  t3: {
    name: 'Agent → Orchestrator',
    validator: 'AgentValidator',
    handledBy: 'AgentValidator (delegated from gateCheckpoint.ts)',
  },
} as const;

// ============================================================================
// GATE_PHASES: Lifecycle phases
// ============================================================================

/**
 * Gate phases organize checkpoints into lifecycle stages.
 * Each phase groups related gates by their role in orchestration.
 */
export const GATE_PHASES: Record<GatePhase, GatePhaseDefinition> = {
  REQUEST_RECEPTION: {
    gates: ['gate-01', 'gate-02', 'gate-03'],
    purpose: 'Parse intent, route to context, detect special work',
  },
  CHAIN_COMPILATION: {
    gates: ['gate-04', 'gate-05', 'gate-06'],
    purpose: 'Compile chain, present to human, get approval',
  },
  CHAIN_EXECUTION: {
    gates: ['gate-07', 'gate-08', 'gate-09', 'gate-10'],
    purpose: 'Execute steps, evaluate triggers, auto-insert steps',
  },
  COMPLETION: {
    gates: ['gate-11', 'gate-12'],
    purpose: 'Summarize results, archive to INDEX.md',
  },
  POST_EXECUTION: {
    gates: ['gate-13', 'gate-14'],
    purpose: 'Surface learnings, detect flow candidates',
  },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get gates an action must cross during execution.
 *
 * @param action - Action identifier (e.g., "code", "review")
 * @returns Array of gate IDs, or empty array if action not found
 *
 * @example
 * ```typescript
 * const gates = getActionGates('review');
 * // ['gate-07', 'gate-08', 'gate-09', 'gate-10']
 * ```
 */
export function getActionGates(action: string): GateId[] {
  const mapping = ACTION_GATE_RELATIONSHIPS[action];
  return mapping?.gates ?? [];
}

/**
 * Get all actions that cross a specific gate.
 * Reverse lookup for finding gate activity.
 *
 * @param gateId - Gate identifier (e.g., "gate-08")
 * @returns Array of action names crossing this gate
 *
 * @example
 * ```typescript
 * const actions = getActionsForGate('gate-08');
 * // ['code', 'code/backend', 'code/frontend', 'review', 'audit', ...]
 * ```
 */
export function getActionsForGate(gateId: GateId): string[] {
  return Object.entries(ACTION_GATE_RELATIONSHIPS)
    .filter(([_, mapping]) => mapping.gates.includes(gateId))
    .map(([action]) => action);
}

/**
 * Get the gate where a contract format is validated.
 *
 * @param format - Format ID (e.g., "5.1", "6.2")
 * @returns Gate ID where format is validated, or null if no specific gate
 *
 * @example
 * ```typescript
 * const gate = getGateForFormat('5.1');
 * // 't3' (Agent → Orchestrator trust boundary)
 * ```
 */
export function getGateForFormat(format: string): GateId | null {
  const result = FORMAT_TO_GATE_MAP[format];
  // Trust boundary IDs (t0-t3) are not GateIds, so filter them
  return result && result.startsWith('gate-') ? (result as GateId) : null;
}

/**
 * Get metadata for an action.
 *
 * @param action - Action identifier
 * @returns Action metadata, or null if action not found
 *
 * @example
 * ```typescript
 * const meta = getActionMetadata('code/backend');
 * // { model: 'haiku', stackSpecific: true, stack: 'Express 4.18 + TypeScript + Zod' }
 * ```
 */
export function getActionMetadata(action: string): ActionMetadata | null {
  const mapping = ACTION_GATE_RELATIONSHIPS[action];
  return mapping?.metadata ?? null;
}

/**
 * Check if an action has a specific auto-trigger.
 *
 * @param action - Action identifier
 * @param trigger - Trigger name (e.g., "second-opinion")
 * @returns True if action has this trigger
 *
 * @example
 * ```typescript
 * const shouldTrigger = hasAutoTrigger('review', 'second-opinion');
 * // true
 * ```
 */
export function hasAutoTrigger(action: string, trigger: string): boolean {
  const metadata = getActionMetadata(action);
  if (!metadata) return false;

  // Handle trigger variants (e.g., "second-opinion:opt-in")
  const baseTrigger = trigger.split(':')[0] ?? trigger;
  return metadata.autoTriggers.some((t) =>
    t.startsWith(baseTrigger),
  );
}

/**
 * Get metadata for a gate checkpoint.
 *
 * @param gateId - Gate identifier
 * @returns Gate checkpoint metadata, or null if gate not found or has no metadata
 *
 * @example
 * ```typescript
 * const checkpoint = getGateCheckpoint('gate-08');
 * // { name: 'Step Completion', phase: 'CHAIN_EXECUTION', ... }
 * ```
 */
export function getGateCheckpoint(gateId: GateId): GateCheckpoint | null {
  const checkpoint = GATE_REGISTRY[gateId];
  return checkpoint ?? null;
}
