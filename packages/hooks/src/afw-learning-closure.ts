import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import * as path from 'path';

/**
 * Post-commit hook: Automatically close learnings when dissolution commits are detected
 *
 * Detects patterns like:
 * - "chore: dissolve learnings L001-L024"
 * - "fix: L001"
 * - "fix: learnings L001, L002, L003"
 *
 * Updates LEARNINGS.md with closure status and commit evidence.
 */

// Patterns that indicate learning fixes/dissolution
const LEARNING_PATTERNS = [
  // Direct dissolution commits
  /chore:\s+dissolve\s+learnings?\s+(L\d{3}(?:-L\d{3})?)/gi,
  /chore:\s+learning-dissolution.*\b(L\d{3})/gi,

  // Individual learning fixes
  /fix:\s+L(\d{3})/gi,
  /feat:\s+implement\s+L(\d{3})/gi,

  // Batch fixes
  /fix:\s+learnings?\s+(L\d{3}(?:,?\s*L\d{3})*)/gi,
];

/**
 * Extract learning IDs from commit message
 * Handles ranges (L001-L024) and lists (L001, L002, L003)
 */
function extractLearningIds(commitMessage: string): string[] {
  const ids = new Set<string>();

  for (const pattern of LEARNING_PATTERNS) {
    const matches = commitMessage.matchAll(pattern);
    for (const match of matches) {
      const captured = match[1] || match[0];

      if (captured.includes('-')) {
        // Range: L001-L024
        const parts = captured.split('-').map(s => s.trim());
        if (parts.length === 2 && parts[0] && parts[1]) {
          const start = parts[0];
          const end = parts[1];
          const startNum = parseInt(start.replace('L', ''));
          const endNum = parseInt(end.replace('L', ''));
          for (let i = startNum; i <= endNum; i++) {
            ids.add(`L${String(i).padStart(3, '0')}`);
          }
        }
      } else {
        // Single or list: L001 or L001,L002
        const singles = captured.match(/L\d{3}/g) || [];
        singles.forEach(id => ids.add(id));
      }
    }
  }

  return Array.from(ids).sort();
}

/**
 * Get commit hash from git
 */
function getCommitHash(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get commit message from git
 */
function getCommitMessage(): string {
  try {
    return execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/**
 * Update LEARNINGS.md with closure status
 */
async function updateLearnings(learningIds: string[], commitHash: string): Promise<number> {
  try {
    const projectRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8'
    }).trim();

    const learningsPath = path.join(projectRoot, '.claude/actionflows/LEARNINGS.md');

    // Check if file exists
    try {
      await fs.access(learningsPath);
    } catch {
      console.log('[afw-learning-closure] ℹ️  LEARNINGS.md not found, skipping');
      return 0;
    }

    const content = await fs.readFile(learningsPath, 'utf8');
    let updated = content;
    let changeCount = 0;

    for (const id of learningIds) {
      // Pattern: ### L001: Title\n...content...\n- **Status:** Open
      // Replace "Status: Open" with "Status: Closed (dissolved) — Evidence: commit {hash}"
      const learningPattern = new RegExp(
        `(### ${id}:[^\\n]*\\n[\\s\\S]*?- \\*\\*Status:\\*\\*)\\s+Open(?!\\s+[a-zA-Z])`,
        'g'
      );

      const shortHash = commitHash.substring(0, 7);
      const replacement = `$1 Closed (dissolved) — Evidence: commit ${shortHash}`;
      const beforeLength = updated.length;
      updated = updated.replace(learningPattern, replacement);

      if (updated.length !== beforeLength) {
        changeCount++;
        console.log(`[afw-learning-closure] ✅ Marked ${id} as closed (commit ${shortHash})`);
      } else {
        console.log(`[afw-learning-closure] ⚠️  ${id} not found or already closed`);
      }
    }

    if (changeCount > 0) {
      await fs.writeFile(learningsPath, updated, 'utf8');
      console.log(`[afw-learning-closure] Updated ${changeCount} learning(s) in LEARNINGS.md`);
    } else if (learningIds.length > 0) {
      console.log(`[afw-learning-closure] No learnings updated (already closed or not found)`);
    }

    return changeCount;
  } catch (error) {
    console.error(`[afw-learning-closure] Error updating learnings:`,
      error instanceof Error ? error.message : String(error)
    );
    return 0;
  }
}

/**
 * Main hook entry point
 */
async function main(): Promise<void> {
  try {
    const commitMessage = getCommitMessage();
    const learningIds = extractLearningIds(commitMessage);

    if (learningIds.length === 0) {
      // No learnings in this commit, nothing to do
      process.exit(0);
    }

    console.log(`[afw-learning-closure] Detected ${learningIds.length} learning(s): ${learningIds.join(', ')}`);

    const commitHash = getCommitHash();
    await updateLearnings(learningIds, commitHash);

    console.log('[afw-learning-closure] ✨ Hook completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[afw-learning-closure] Fatal error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
