import { describe, it, expect } from 'vitest';
import { summarizeTrace } from '../services/gateTraceSummarizer.js';
import type { GateTrace } from '@afw/shared';

describe('summarizeTrace (D-06)', () => {
  it('maps a passing GateTrace to a LedgerEntry with outcome=pass', () => {
    const trace: GateTrace = {
      gateId: 'gate-04',
      gateName: 'Compile Chain',
      timestamp: '2026-04-03T00:00:00.000Z' as any,
      chainId: 'chain-1' as any,
      traceLevel: 'INFO',
      orchestratorOutput: '',
      input: '',
      selected: 'code-and-review',
      rationale: 'matched flow',
      confidence: 'high',
      validationResult: { passed: true, violations: [], harmonyScore: 100 },
    };
    const entry = summarizeTrace(trace);
    expect(entry).not.toBeNull();
    expect(entry!.outcome).toBe('pass');
    expect(entry!.sourceTraceTimestamp).toBe(trace.timestamp);
    expect(entry!.reason.length).toBeLessThanOrEqual(200);
  });

  it('returns null for traces missing identity fields', () => {
    expect(summarizeTrace({} as any)).toBeNull();
  });

  it('maps failed validation to outcome=fail', () => {
    const trace: GateTrace = {
      gateId: 'gate-09',
      gateName: 'Agent Output Validation',
      timestamp: '2026-04-03T00:00:00.000Z' as any,
      chainId: 'chain-2' as any,
      traceLevel: 'INFO',
      orchestratorOutput: '',
      input: '',
      selected: 'x',
      rationale: 'broken',
      confidence: 'low',
      validationResult: { passed: false, violations: ['v1'], harmonyScore: 50 },
    };
    expect(summarizeTrace(trace)!.outcome).toBe('fail');
  });
});
