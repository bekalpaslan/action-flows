import type { GateTrace, LedgerEntry } from '@afw/shared';

/**
 * Pure mapper: GateTrace → LedgerEntry. Returns null for traces missing
 * identity fields (gateId, chainId, timestamp). Used by the cleanup job
 * when promoting raw traces to the ledger before TTL prune (D-06).
 *
 * This function is strictly pure — no I/O, no runtime service imports.
 */
export function summarizeTrace(trace: GateTrace): LedgerEntry | null {
  if (!trace || !trace.gateId || !trace.chainId || !trace.timestamp) return null;

  const passed = trace.validationResult?.passed;
  const outcome: LedgerEntry['outcome'] =
    passed === true ? 'pass' : passed === false ? 'fail' : 'unknown';

  const reasonSource = trace.rationale ?? trace.selected ?? '';
  const reason = reasonSource.slice(0, 200);

  return {
    timestamp: new Date().toISOString() as LedgerEntry['timestamp'],
    chainId: trace.chainId,
    gateId: trace.gateId,
    gateName: trace.gateName,
    outcome,
    reason,
    sourceTraceTimestamp: trace.timestamp,
  };
}
