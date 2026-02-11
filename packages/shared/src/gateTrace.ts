/**
 * Gate Checkpoint Tracing System
 *
 * Tracks orchestrator output validation at decision boundaries (gates).
 * Backend parses orchestrator outputs and creates traces for auditability.
 */

import type { ChainId, StepId, Timestamp } from './types.js';

/**
 * Gate trace severity level
 */
export type GateTraceLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

/**
 * Gate identifier (P0-P5 gates from auditable verification system)
 */
export type GateId =
  | 'gate-01'  // Request Reception
  | 'gate-02'  // Route to Context
  | 'gate-03'  // Find the Flow
  | 'gate-04'  // Compile Chain
  | 'gate-05'  // Present Chain
  | 'gate-06'  // Step Boundary Evaluation
  | 'gate-07'  // Triage Fix
  | 'gate-08'  // Format Output
  | 'gate-09'  // Agent Output Validation
  | 'gate-10'  // Learning Surface
  | 'gate-11'  // Fresh Eye Discovery
  | 'gate-12'  // Registry Update
  | 'gate-13'  // Flow Composition
  | 'gate-14'  // Commit Gate
  | 'gate-15'  // Second Opinion
  | 'gate-16'  // Recompilation
  | 'gate-17'  // Autonomous Follow-Through
  | 'gate-18'  // Chain Continuation
  | 'gate-50'; // Bridge Midpoint (50% checkpoint)

/**
 * A gate trace represents a checkpoint validation at a decision boundary.
 * Backend creates these by parsing orchestrator outputs.
 */
export interface GateTrace {
  // Identity
  gateId: GateId;                    // e.g., "gate-02", "gate-04"
  gateName: string;                  // e.g., "Route to Context", "Compile Chain"

  // Context
  timestamp: Timestamp;
  chainId: ChainId;
  stepId?: StepId;                   // Optional (some gates are chain-level)

  // Severity
  traceLevel: GateTraceLevel;

  // Checkpoint data
  orchestratorOutput: string;        // What the orchestrator produced (truncated)
  parsedFormat?: string;             // Contract format ID if applicable (e.g., "Format 1.1")

  // Decision context
  input: string;                     // What triggered this checkpoint
  alternatives?: string[];           // Options considered
  selected: string;                  // What was chosen
  rationale: string;                 // Why this decision
  confidence: 'high' | 'medium' | 'low';

  // Validation result
  validationResult?: {
    passed: boolean;
    violations: string[];
    harmonyScore: number;            // 0-100
  };

  // Metadata
  duration?: number;                 // milliseconds
  metadata?: Record<string, unknown>;
}

/**
 * Gate statistics for monitoring/analytics
 */
export interface GateStats {
  gateId: GateId;
  totalPassages: number;
  passCount: number;
  failCount: number;
  avgDurationMs: number;
  lastPassageTime: Timestamp | null;
}

/**
 * Gate trace query filters
 */
export interface GateTraceFilter {
  gateId?: GateId;
  chainId?: ChainId;
  stepId?: StepId;
  level?: GateTraceLevel;
  fromTimestamp?: Timestamp;
  toTimestamp?: Timestamp;
  limit?: number;
  offset?: number;
}

/**
 * Health score for an individual gate
 */
export interface GateHealthScore {
  gateId: GateId;
  score: number;                              // 0-100
  passCount: number;
  violationCount: number;
  trend: 'improving' | 'stable' | 'degrading';
  lastViolation?: Timestamp;
}

/**
 * Detected drift pattern across gates
 */
export interface DriftPattern {
  pattern: string;                            // e.g., "missing-status-column"
  gates: GateId[];                            // Which gates affected
  frequency: number;                          // How many times seen
  firstSeen: Timestamp;
  lastSeen: Timestamp;
}

/**
 * Overall harmony health score
 */
export interface HarmonyHealthScore {
  overall: number;                           // 0-100
  timestamp: Timestamp;
  byGate: Record<GateId, GateHealthScore>;
  violations24h: number;
  violationsTotal: number;
  driftPatterns: DriftPattern[];
  recommendations: string[];                  // Reference to healing flows
}
