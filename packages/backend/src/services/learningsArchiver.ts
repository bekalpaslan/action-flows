import fs from 'fs';
import path from 'path';

const DEFAULT_PATH = path.resolve(
  process.cwd(),
  '..',
  '..',
  '.claude',
  'actionflows',
  'LEARNINGS.md',
);
const MAX_ACTIVE_ENTRIES = 50;

interface ParsedEntry {
  header: string;
  body: string;
  year: number;
}

/**
 * LearningsArchiver — caps active LEARNINGS.md at MAX_ACTIVE_ENTRIES entries
 * and appends overflow (oldest-first) to year-scoped LEARNINGS-archive-YYYY.md.
 *
 * Closes D-08 (50-entry cap), D-09 (year-scoped archive files),
 * D-10 (append-only oldest-first).
 *
 * CRLF-safe per MEMORY.md L009 — normalizes `\r\n` → `\n` before regex parsing.
 */
export class LearningsArchiver {
  private readonly activePath: string;

  constructor(activePath?: string) {
    this.activePath = activePath ?? DEFAULT_PATH;
  }

  archiveIfNeeded(): void {
    if (!fs.existsSync(this.activePath)) {
      console.log('[LearningsArchiver] No active LEARNINGS.md — skipping');
      return;
    }

    const raw = fs
      .readFileSync(this.activePath, 'utf-8')
      .replace(/\r\n/g, '\n');

    const parts = raw.split(/(?=^### L\d+:)/m);
    const preamble = parts[0] ?? '';
    const entryChunks = parts.slice(1);

    if (entryChunks.length <= MAX_ACTIVE_ENTRIES) return;

    const fallbackYear = new Date().getFullYear();
    const entries: ParsedEntry[] = entryChunks.map((chunk) => {
      const headerLine = chunk.split('\n')[0] ?? '';
      const dateMatch = chunk.match(/\*\*Date:\*\*\s*(\d{4})-\d{2}-\d{2}/);
      const year =
        dateMatch && dateMatch[1] ? parseInt(dateMatch[1], 10) : fallbackYear;
      return { header: headerLine, body: chunk, year };
    });

    const overflow = entries.length - MAX_ACTIVE_ENTRIES;
    const toArchive = entries.slice(0, overflow); // oldest first
    const toKeep = entries.slice(overflow); // newest 50

    // Group archive entries by year; append oldest-first per D-10
    const byYear = new Map<number, ParsedEntry[]>();
    for (const e of toArchive) {
      if (!byYear.has(e.year)) byYear.set(e.year, []);
      byYear.get(e.year)!.push(e);
    }

    for (const [year, items] of byYear) {
      const archivePath = path.join(
        path.dirname(this.activePath),
        `LEARNINGS-archive-${year}.md`,
      );
      const isNew = !fs.existsSync(archivePath);
      const header = isNew ? `# Learnings Archive ${year}\n\n` : '';
      const payload = header + items.map((i) => i.body).join('');
      fs.appendFileSync(archivePath, payload);
    }

    // Rewrite active file with LF endings (newest 50 retained)
    fs.writeFileSync(
      this.activePath,
      preamble + toKeep.map((i) => i.body).join(''),
    );
    console.log(
      `[LearningsArchiver] Archived ${toArchive.length} entries, ${toKeep.length} active`,
    );
  }
}

// Singleton instance
export const learningsArchiver = new LearningsArchiver();
