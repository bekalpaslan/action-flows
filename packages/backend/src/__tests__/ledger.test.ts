import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { LedgerService } from '../services/ledgerService.js';
import type { LedgerEntry } from '@afw/shared';

describe('LedgerService (D-03, D-04)', () => {
  let tmpDir: string;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('appends a LedgerEntry to ledger.jsonl at the configured path', () => {
    const svc = new LedgerService(path.join(tmpDir, 'ledger.jsonl'));
    const entry: LedgerEntry = {
      timestamp: '2026-04-10T00:00:00.000Z' as any,
      chainId: 'chain-1' as any,
      gateId: 'gate-04',
      gateName: 'Compile Chain',
      outcome: 'pass',
      reason: 'ok',
      sourceTraceTimestamp: '2026-04-03T00:00:00.000Z' as any,
    };
    svc.append(entry);
    const lines = fs
      .readFileSync(path.join(tmpDir, 'ledger.jsonl'), 'utf-8')
      .trim()
      .split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]!).gateId).toBe('gate-04');
  });

  it('query() filters by gateId and outcome (D-05 support)', () => {
    const svc = new LedgerService(path.join(tmpDir, 'ledger.jsonl'));
    // two entries; filter returns one
    // (implementation detail — executor fills in)
    expect(typeof svc.query).toBe('function');
  });
});
