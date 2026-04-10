import fs from 'fs';
import path from 'path';
import type { LedgerEntry, LedgerFilter } from '@afw/shared';

/**
 * LedgerService — append-only JSONL persistence for LedgerEntry rows (D-03, D-04).
 *
 * Writes each entry as a single JSON line to the configured file path. Reads
 * filter entries by gateId, outcome, time range, and limit. Does not wire into
 * CleanupService or routes here — that is Plan 03 / Plan 05.
 */
export class LedgerService {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(process.cwd(), 'data', 'ledger.jsonl');
  }

  private ensureDir(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  append(entry: LedgerEntry): void {
    try {
      this.ensureDir();
      fs.appendFileSync(this.filePath, JSON.stringify(entry) + '\n');
    } catch (err) {
      console.warn('[LedgerService] Append failed:', err);
    }
  }

  appendBatch(entries: LedgerEntry[]): void {
    if (entries.length === 0) return;
    try {
      this.ensureDir();
      const payload = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
      fs.appendFileSync(this.filePath, payload);
      console.log(`[LedgerService] Appended ${entries.length} entries`);
    } catch (err) {
      console.warn('[LedgerService] Batch append failed:', err);
    }
  }

  query(filter: LedgerFilter = {}): LedgerEntry[] {
    if (!fs.existsSync(this.filePath)) return [];
    const raw = fs.readFileSync(this.filePath, 'utf-8').trim();
    if (!raw) return [];
    let entries: LedgerEntry[] = [];
    for (const line of raw.split('\n')) {
      try {
        entries.push(JSON.parse(line) as LedgerEntry);
      } catch {
        /* skip malformed */
      }
    }
    if (filter.gateId) entries = entries.filter((e) => e.gateId === filter.gateId);
    if (filter.outcome) entries = entries.filter((e) => e.outcome === filter.outcome);
    if (filter.fromTimestamp) entries = entries.filter((e) => e.timestamp >= filter.fromTimestamp!);
    if (filter.toTimestamp) entries = entries.filter((e) => e.timestamp <= filter.toTimestamp!);
    if (filter.limit && filter.limit > 0) entries = entries.slice(-filter.limit);
    return entries;
  }
}

// Singleton for backend index.ts wiring (default path: data/ledger.jsonl)
export const ledgerService = new LedgerService();
