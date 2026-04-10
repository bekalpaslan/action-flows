import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { LearningsArchiver } from '../services/learningsArchiver.js';

describe('LearningsArchiver (D-08, D-09, D-10)', () => {
  let tmpDir: string;
  let activePath: string;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-'));
    activePath = path.join(tmpDir, 'LEARNINGS.md');
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('no-op when active file has <= 50 entries', () => {
    const entries = Array.from(
      { length: 40 },
      (_, i) =>
        `### L${String(i + 1).padStart(3, '0')}: Entry\n**Date:** 2026-01-01\nbody\n\n`,
    ).join('');
    fs.writeFileSync(activePath, '# Learnings\n\n' + entries);
    const a = new LearningsArchiver(activePath);
    a.archiveIfNeeded();
    expect(fs.readdirSync(tmpDir)).toEqual(['LEARNINGS.md']);
  });

  it('archives overflow entries to LEARNINGS-archive-YYYY.md', () => {
    const entries = Array.from(
      { length: 55 },
      (_, i) =>
        `### L${String(i + 1).padStart(3, '0')}: Entry\n**Date:** 2026-01-01\nbody ${i}\n\n`,
    ).join('');
    fs.writeFileSync(activePath, '# Learnings\n\n' + entries);
    const a = new LearningsArchiver(activePath);
    a.archiveIfNeeded();
    const files = fs.readdirSync(tmpDir).sort();
    expect(files).toContain('LEARNINGS-archive-2026.md');
    const remaining = fs.readFileSync(activePath, 'utf-8');
    expect((remaining.match(/^### L\d+:/gm) || []).length).toBe(50);
  });
});
