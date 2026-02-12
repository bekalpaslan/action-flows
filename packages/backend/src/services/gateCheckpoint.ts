/**
 * Gate Checkpoint Service
 *
 * Backend service that validates orchestrator outputs at decision boundaries.
 * Creates gate traces by parsing existing orchestrator formats — NO extra orchestrator burden.
 *
 * ## Architecture
 * ```
 * Orchestrator outputs Format X.Y (e.g., Chain Compilation)
 *           ↓
 * Backend parses at gate checkpoint (e.g., Gate 4)
 *           ↓
 * Validation passes/fails
 *           ↓
 * Gate trace stored in Harmony (Redis, 7d TTL)
 *           ↓
 * Frontend displays via GateTraceViewer component
 * ```
 *
 * ## Gate Checkpoints
 *
 * ### Gate 2: Route to Context
 * - **Trigger:** Orchestrator outputs context routing decision
 * - **Logs:** orchestrator-decision, gate-passage
 * - **Validation:** Extract context name, validate against enum
 * - **Trace depth:** INFO=context only, DEBUG=+alternatives scored, TRACE=+keyword extraction
 *
 * ### Gate 3: Detect Special Work
 * - **Trigger:** Request parsed, checking for special work types
 * - **Logs:** orchestrator-decision, gate-passage
 * - **Validation:** Detect format-work, harmony-work, flow-work, registry-edit
 * - **Trace depth:** INFO=work type, DEBUG=+triggers matched, TRACE=+routing logic
 *
 * ### Gate 4: Compile Chain
 * - **Trigger:** Orchestrator outputs Format 1.1 (Chain Compilation Table)
 * - **Logs:** orchestrator-decision, chain-compilation, gate-passage, configuration
 * - **Validation:** Parse Format 1.1, validate required fields, check step counts
 * - **Trace depth:** INFO=chain steps, DEBUG=+rationale/alternatives, TRACE=+parallelization analysis
 *
 * ### Gate 6: Human Approval
 * - **Trigger:** Human responds to chain presentation
 * - **Logs:** orchestrator-decision, gate-passage
 * - **Validation:** Parse approval (yes/no/modify), capture suppressions
 * - **Trace depth:** INFO=decision only, DEBUG=+modifications, TRACE=+full response
 *
 * ### Gate 9: Mid-Chain Evaluation
 * - **Trigger:** Orchestrator outputs Format 2.1 (Step Completion)
 * - **Logs:** orchestrator-decision, gate-passage, agent-reasoning
 * - **Validation:** Parse Format 2.1, check 6-trigger signals
 * - **6-triggers:** [SIGNAL], [PATTERN], [DEPENDENCY], [QUALITY], [REDESIGN], [REUSE]
 * - **Trace depth:** INFO=decision only, DEBUG=+triggers fired, TRACE=+trigger matching logic
 *
 * ### Agent Output Validation (T3)
 * - **Trigger:** Agent completes, output file written to log folder
 * - **Logs:** agent-reasoning, tool-usage, data-flow
 * - **Validation:** Delegate to AgentValidator, validate format by action type
 * - **Trace depth:** INFO=pass/fail+harmony, DEBUG=+violations, TRACE=+parsing details
 *
 * ### Gate 13: Learning Surface
 * - **Trigger:** Orchestrator outputs Format 3.2 (Learning Surface)
 * - **Logs:** orchestrator-decision, gate-passage
 * - **Validation:** Validate Issue/Root Cause/Suggestion fields
 * - **Trace depth:** INFO=learning recorded, DEBUG=+full text, TRACE=+categorization
 *
 * ## Trust Levels
 *
 * | Level | Boundary | This Service Handles |
 * |-------|----------|---------------------|
 * | T0 | User → Backend | No (Zod validation) |
 * | T1 | Orchestrator → Backend | **Yes** (gate checkpoints) |
 * | T2 | Backend → Frontend | No (event schemas) |
 * | T3 | Agent → Orchestrator | No (AgentValidator) |
 *
 * This service is the T1 validation layer.
 *
 * ## GateTrace Fields (all gates)
 * @see packages/shared/src/gateTrace.ts for interface definition
 */

import { EventEmitter } from 'events';
import type { GateTrace, GateId, ChainId, GateTraceLevel, GateStats } from '@afw/shared';
import type { Storage } from '../storage/index.js';

/**
 * Gate Checkpoint Service
 * Non-blocking, fire-and-forget pattern for gate validation
 */
export class GateCheckpoint extends EventEmitter {
  private storage: Storage;
  private readonly HARMONY_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

  constructor(storage: Storage) {
    super();
    this.storage = storage;
  }

  /**
   * Record a gate checkpoint passage
   * Called by backend after parsing orchestrator output
   * Non-blocking, fire-and-forget pattern
   */
  async recordCheckpoint(trace: GateTrace): Promise<void> {
    const key = `harmony:gate:${trace.chainId}:${trace.gateId}:${trace.timestamp}`;

    try {
      // Store in Harmony namespace (Redis/Memory with 7-day TTL)
      // Use setIfSupported to handle both sync and async storage
      if ('set' in this.storage && typeof this.storage.set === 'function') {
        // Redis-style set with TTL
        const result = await (this.storage as any).set(key, JSON.stringify(trace), this.HARMONY_TTL_SECONDS);
        if (!result) {
          console.warn(`[GateCheckpoint] Failed to store trace: ${key}`);
        }
      } else {
        console.debug(`[GateCheckpoint] Storage does not support set() method, skipping trace storage`);
      }

      // Emit event for WebSocket broadcast
      this.emit('gate:checkpoint', trace);

      // Console output at appropriate level
      this.logToConsole(trace);
    } catch (error) {
      console.error(`[GateCheckpoint] Error recording checkpoint for ${trace.gateId}:`, error);
    }
  }

  /**
   * Retrieve gate traces for a chain
   */
  async getGateTraces(chainId: ChainId, gateId?: GateId): Promise<GateTrace[]> {
    try {
      const pattern = gateId
        ? `harmony:gate:${chainId}:${gateId}:*`
        : `harmony:gate:${chainId}:*`;

      // Try to use keys() method if available (Redis)
      let keys: string[] = [];
      if ('keys' in this.storage && typeof (this.storage as any).keys === 'function') {
        keys = await (this.storage as any).keys(pattern);
      }

      const traces: GateTrace[] = [];

      for (const key of keys) {
        try {
          // Try to get value
          let data: string | null = null;
          if ('get' in this.storage && typeof (this.storage as any).get === 'function') {
            data = await (this.storage as any).get(key);
          }

          if (data) {
            traces.push(JSON.parse(data));
          }
        } catch (parseError) {
          console.warn(`[GateCheckpoint] Failed to parse trace from key ${key}:`, parseError);
        }
      }

      return traces.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });
    } catch (error) {
      console.error(`[GateCheckpoint] Error retrieving gate traces for ${chainId}:`, error);
      return [];
    }
  }

  /**
   * Get gate statistics (pass/fail rates, avg duration)
   */
  async getGateStats(gateId: GateId): Promise<GateStats> {
    try {
      const pattern = `harmony:gate:*:${gateId}:*`;
      let keys: string[] = [];

      if ('keys' in this.storage && typeof (this.storage as any).keys === 'function') {
        keys = await (this.storage as any).keys(pattern);
      }

      const traces: GateTrace[] = [];

      for (const key of keys) {
        try {
          let data: string | null = null;
          if ('get' in this.storage && typeof (this.storage as any).get === 'function') {
            data = await (this.storage as any).get(key);
          }

          if (data) {
            traces.push(JSON.parse(data));
          }
        } catch (parseError) {
          console.warn(`[GateCheckpoint] Failed to parse trace:`, parseError);
        }
      }

      // Calculate stats
      const passCount = traces.filter(t => t.validationResult?.passed).length;
      const failCount = traces.filter(t => !t.validationResult?.passed).length;
      const durations = traces.filter(t => t.duration).map(t => t.duration!);
      const avgDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

      const lastTrace = traces.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      })[0];

      return {
        gateId,
        totalPassages: traces.length,
        passCount,
        failCount,
        avgDurationMs: Math.round(avgDuration),
        lastPassageTime: lastTrace?.timestamp || null,
      };
    } catch (error) {
      console.error(`[GateCheckpoint] Error calculating gate stats for ${gateId}:`, error);
      return {
        gateId,
        totalPassages: 0,
        passCount: 0,
        failCount: 0,
        avgDurationMs: 0,
        lastPassageTime: null,
      };
    }
  }

  /**
   * Log to console at appropriate level
   */
  private logToConsole(trace: GateTrace): void {
    const prefix = `[GateCheckpoint] ${trace.gateId} (${trace.gateName})`;
    const summary = `${trace.selected} (confidence: ${trace.confidence}, harmony: ${trace.validationResult?.harmonyScore ?? 'N/A'}/100)`;

    switch (trace.traceLevel) {
      case 'ERROR':
        console.error(prefix, summary, trace);
        break;
      case 'WARN':
        console.warn(prefix, summary, trace);
        break;
      case 'DEBUG':
        console.debug(prefix, summary);
        break;
      case 'TRACE':
        // Only log TRACE at DEBUG level
        if (process.env.DEBUG) {
          console.debug(prefix, summary);
        }
        break;
      case 'INFO':
      default:
        console.log(prefix, summary);
    }
  }

  /**
   * Cleanup on shutdown
   */
  public shutdown(): void {
    console.log('[GateCheckpoint] Shutting down...');
    this.removeAllListeners();
    console.log('[GateCheckpoint] Shutdown complete');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let gateCheckpoint: GateCheckpoint | null = null;

/**
 * Initialize the GateCheckpoint singleton
 * Call this once during backend startup
 */
export function initGateCheckpoint(storage: Storage): GateCheckpoint {
  if (!gateCheckpoint) {
    gateCheckpoint = new GateCheckpoint(storage);
    console.log('[GateCheckpoint] Service initialized');
  }
  return gateCheckpoint;
}

/**
 * Get the GateCheckpoint singleton instance
 * Throws if not initialized
 */
export function getGateCheckpoint(): GateCheckpoint {
  if (!gateCheckpoint) {
    throw new Error('GateCheckpoint not initialized. Call initGateCheckpoint() first.');
  }
  return gateCheckpoint;
}
