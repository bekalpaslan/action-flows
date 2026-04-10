/**
 * Ledger Types (Phase 999.1 — D-03, D-04)
 *
 * A LedgerEntry is a compact, append-only record summarizing a GateTrace outcome.
 * The ledger is the long-term, low-cardinality history layer backing the
 * history/memory lifecycle subsystem — complementing short-lived in-memory traces.
 *
 * @see packages/shared/src/gateTrace.ts
 * @module
 */

import type { ChainId, SessionId, Timestamp } from './types.js';
import type { GateId } from './gateTrace.js';

/**
 * A single append-only ledger record derived from a GateTrace.
 *
 * `reason` should be capped at 200 characters at the call site.
 * `sourceTraceTimestamp` links back to the originating GateTrace for provenance.
 */
export interface LedgerEntry {
  timestamp: Timestamp;
  sessionId?: SessionId;
  chainId: ChainId;
  gateId: GateId;
  gateName: string;
  outcome: 'pass' | 'fail' | 'unknown';
  healthScoreDelta?: number;
  reason: string;
  sourceTraceTimestamp: Timestamp;
}

/**
 * Query filter for ledger reads (D-05 support).
 */
export interface LedgerFilter {
  fromTimestamp?: Timestamp;
  toTimestamp?: Timestamp;
  gateId?: GateId;
  outcome?: 'pass' | 'fail';
  limit?: number;
}
